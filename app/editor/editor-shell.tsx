'use client';
/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation preserves the unsaved-edit beforeunload guard. */

import { useCallback, useEffect, useRef, useState } from 'react';
import DocView from '../doc-view';
import { DocumentContext, fieldDefinitions } from './doc-fields';
import dynamic from 'next/dynamic';
import type { DocumentSnapshot, Fields } from '@/lib/document';

const RichEditor=dynamic(()=>import('./rich-editor'),{ssr:false,loading:()=> <div className="rich-loading">正在准备编辑区…</div>});

const chapterNames:Record<string,string>={start:'开始使用',model:'理解词格',phoneme:'发音格操作',chinese:'中文逐格编辑',timeline:'听感与时间轴',blind:'盲听打点',import:'导入与导出',lab:'实验室',ai:'AI 参谋',appearance:'外观与隐私',shortcuts:'快捷键',faq:'常见问题'};

export default function EditorShell({initial}:{initial:DocumentSnapshot}) {
  const [fields,setFields]=useState<Fields>(initial.fields);
  const [selected,setSelected]=useState('start-h1-1');
  const [preview,setPreview]=useState(false);
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState(initial.updatedAt?'已载入云端草稿':'准备就绪，点一下正文开始修改');
  const [error,setError]=useState('');
  const [autoPaused,setAutoPaused]=useState(false);
  const [confirmPublish,setConfirmPublish]=useState(false);
  const [resetKey,setResetKey]=useState(0);
  const [savedValue,setSavedValue]=useState(JSON.stringify(initial.fields));
  const current=useRef(fields);
  const revision=useRef(initial.revision);
  const saved=useRef(JSON.stringify(initial.fields));
  const working=useRef(false);
  const dirty=JSON.stringify(fields)!==savedValue;
  const definition=fieldDefinitions[selected];

  const change=useCallback((id:string,html:string)=>{
    const next={...current.current,[id]:html};
    current.current=next;
    setFields(next);
    setStatus('有新修改，稍后自动保存草稿');
  },[]);

  const persist=useCallback(async(action:'save'|'publish')=>{
    if(working.current)return;
    working.current=true;setBusy(true);setError('');
    const snapshot=current.current;
    const snapshotJSON=JSON.stringify(snapshot);
    setStatus(action==='publish'?'正在发布修改…':'正在保存草稿…');
    try {
      const response=await fetch('/api/editor',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,fields:snapshot,revision:revision.current})});
      const result=await response.json() as DocumentSnapshot & {error?:string};
      if(!response.ok)throw new Error(result.error||'保存失败，请稍后重试');
      revision.current=result.revision;
      saved.current=JSON.stringify(result.fields);
      setSavedValue(saved.current);
      if(JSON.stringify(current.current)===snapshotJSON){current.current=result.fields;setFields(result.fields);}
      setAutoPaused(false);
      setStatus(action==='publish'?'已发布，文档页面已更新':'草稿已保存到云端 · 尚未发布');
    }catch(e){setError(e instanceof Error?e.message:'保存失败，修改仍保留在当前页面');setAutoPaused(true);setStatus('尚未保存，请勿关闭页面');}
    finally{working.current=false;setBusy(false);}
  },[]);

  useEffect(()=>{
    if(!dirty||busy||autoPaused)return;
    const timer=window.setTimeout(()=>void persist('save'),1600);
    return()=>window.clearTimeout(timer);
  },[fields,dirty,busy,autoPaused,persist]);

  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(JSON.stringify(current.current)!==saved.current){event.preventDefault();event.returnValue='';}};
    const key=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();void persist('save');}};
    window.addEventListener('beforeunload',warn);window.addEventListener('keydown',key);
    return()=>{window.removeEventListener('beforeunload',warn);window.removeEventListener('keydown',key);};
  },[persist]);

  function backup() {
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'lyric-grid-docs',fields:current.current},null,2)],{type:'application/json'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download='词格使用手册-内容备份.json';anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  return <div className={`edit-session ${preview?'is-preview':''}`}>
    <header className="editor-bar"><a className="editor-brand" href="/">词格 <span>文档编辑室</span></a><div className={`save-indicator ${dirty?'unsaved':''}`} role="status"><i />{status}</div><div className="editor-actions"><button onClick={()=>setPreview(v=>!v)}>{preview?'继续编辑':'预览效果'}</button><button disabled={busy} onClick={()=>void persist('save')}>保存草稿</button><button className="publish-button" disabled={busy} onClick={()=>setConfirmPublish(true)}>发布修改 ↗</button></div></header>
    <DocumentContext.Provider value={{fields,owner:true,editing:!preview,selected:preview?undefined:selected,onSelect:setSelected}}><DocView /></DocumentContext.Provider>
    {!preview&&<aside className="editing-panel" aria-label="文档编辑工具"><div className="editing-panel-heading"><span>只对作者开放</span><h2>点哪里，改哪里。</h2><p>左侧点选正文，下面直接修改。草稿与正式文档分开保存。</p></div>
      <label className="editor-field-label" htmlFor="field-picker">正在编辑 · {chapterNames[definition.section]}</label>
      <select id="field-picker" value={selected} onChange={e=>setSelected(e.target.value)}>{Object.entries(chapterNames).map(([chapter,name])=><optgroup key={chapter} label={name}>{Object.entries(fieldDefinitions).filter(([,item])=>item.section===chapter).map(([id,item])=><option key={id} value={id}>{item.label}</option>)}</optgroup>)}</select>
      <RichEditor key={`${selected}-${resetKey}`} definition={definition} value={fields[selected]??definition.html} onChange={html=>change(selected,html)} />
      <div className="editor-field-actions"><button onClick={()=>{change(selected,definition.html);setResetKey(v=>v+1);}}>恢复这段原文</button><button onClick={()=>setSelected(`extra-${definition.section}`)}>＋ 本章补充内容</button></div>
      {error&&<div className="editor-problem" role="alert"><b>没有覆盖你的修改</b><p>{error}</p><button onClick={backup}>下载当前内容备份</button><button onClick={()=>{if(window.confirm('重新载入会放弃未保存的修改。请先下载备份，确定继续吗？'))window.location.reload();}}>重新载入</button></div>}
      <div className="editor-note"><b>不用碰代码</b><p>文字格式、链接、图片都可以在这里编辑。颜色、格子与页面布局会保留。</p><span>Ctrl / ⌘ + S 保存草稿</span></div>
    </aside>}
    {preview&&<div className="preview-badge">草稿预览 · 还没有替换正式文档</div>}
    {confirmPublish&&<div className="publish-overlay" role="dialog" aria-modal="true" aria-labelledby="publish-title"><div><span>最后一步</span><h2 id="publish-title">发布这次修改？</h2><p>当前草稿会替换文档站正在展示的内容。网站仍然保持现有的访问权限。</p><div><button onClick={()=>setConfirmPublish(false)}>继续修改</button><button className="publish-button" onClick={()=>{setConfirmPublish(false);void persist('publish');}}>确认发布</button></div></div></div>}
  </div>;
}
