'use client';

import { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import type { FieldDefinition } from './doc-fields';

export default function RichEditor({definition,value,onChange}:{definition:FieldDefinition;value:string;onChange:(html:string)=>void}) {
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const [linkOpen,setLinkOpen]=useState(false);
  const [link,setLink]=useState('');
  const imageRef=useRef<HTMLInputElement>(null);
  const block=definition.block;
  const editor=useEditor({
    immediatelyRender:false,
    shouldRerenderOnTransaction:true,
    extensions:[StarterKit.configure({heading:block?{levels:[2,3]}:false,bulletList:block?{}:false,orderedList:block?{}:false,blockquote:block?{}:false,codeBlock:false,horizontalRule:block?{}:false,link:{openOnClick:false,autolink:false}}),Image.configure({inline:true,allowBase64:false})],
    content:block?value:`<p>${value}</p>`,
    editorProps:{attributes:{'aria-label':'文档内容编辑区',class:'rich-document'},handlePaste:(_view,event)=>{
      const file=Array.from(event.clipboardData?.files??[]).find(item=>item.type.startsWith('image/'));
      if(file){void upload(file);return true;}return false;
    }},
    onUpdate:({editor})=>{
      let html=editor.getHTML();
      if(!block) html=html.replace(/^<p>/,'').replace(/<\/p>$/,'').replace(/<\/p><p>/g,'<br>');
      onChange(html);
    },
  });
  async function upload(file:File) {
    if (file.size>5*1024*1024) {setError('图片不能超过 5 MB');return;}
    setUploading(true);setError('');
    try {
      const form=new FormData();form.set('file',file);
      const response=await fetch('/api/images',{method:'POST',body:form});
      const result=await response.json() as {error?:string;url:string;alt:string};
      if(!response.ok) throw new Error(result.error||'图片上传失败');
      editor?.chain().focus().setImage({src:result.url,alt:result.alt}).run();
    } catch(e){setError(e instanceof Error?e.message:'图片上传失败，请重试');}
    finally {setUploading(false);if(imageRef.current) imageRef.current.value='';}
  }
  if (!editor) return <div className="rich-loading">正在准备编辑区…</div>;
  const tool=(label:string,action:()=>void,active=false,disabled=false)=><button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} className={active?'is-active':''} onMouseDown={e=>e.preventDefault()} onClick={action}>{label}</button>;
  return <div className="rich-editor-shell">
    <div className="rich-toolbar" role="toolbar" aria-label="文字格式">
      {tool('加粗',()=>editor.chain().focus().toggleBold().run(),editor.isActive('bold'))}
      {tool('斜体',()=>editor.chain().focus().toggleItalic().run(),editor.isActive('italic'))}
      {tool('下划线',()=>editor.chain().focus().toggleUnderline().run(),editor.isActive('underline'))}
      {tool('链接',()=>{setLink(editor.getAttributes('link').href??'');setLinkOpen(v=>!v);},editor.isActive('link'))}
      {block&&tool('小标题',()=>editor.chain().focus().toggleHeading({level:3}).run(),editor.isActive('heading'))}
      {block&&tool('列表',()=>editor.chain().focus().toggleBulletList().run(),editor.isActive('bulletList'))}
      {block&&tool('编号',()=>editor.chain().focus().toggleOrderedList().run(),editor.isActive('orderedList'))}
      {block&&tool('引用',()=>editor.chain().focus().toggleBlockquote().run(),editor.isActive('blockquote'))}
      <button type="button" disabled={uploading} onClick={()=>imageRef.current?.click()}>{uploading?'上传中…':'插入图片'}</button>
      {tool('撤销',()=>editor.chain().focus().undo().run(),false,!editor.can().undo())}
      {tool('重做',()=>editor.chain().focus().redo().run(),false,!editor.can().redo())}
    </div>
    {linkOpen&&<form className="link-editor" onSubmit={e=>{e.preventDefault();if(!link.trim())editor.chain().focus().unsetLink().run();else if(/^(https?:\/\/|mailto:|#)/i.test(link.trim()))editor.chain().focus().extendMarkRange('link').setLink({href:link.trim()}).run();else {setError('链接请以 https://、http:// 或 mailto: 开头');return;}setLinkOpen(false);setError('');}}><input aria-label="链接地址" placeholder="https://…" value={link} onChange={e=>setLink(e.target.value)} /><button type="submit">应用</button></form>}
    <EditorContent editor={editor} />
    <input ref={imageRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e=>{if(e.target.files?.[0])void upload(e.target.files[0]);}} />
    {error&&<p className="editor-error" role="alert">{error}</p>}
    <div className="rich-editor-help">支持粘贴文字和图片 · 图片最大 5 MB<br />{block?'这里可以新增段落、列表和图片。':'直接改这一段文字；回车可换行，版式保持不变。'}</div>
  </div>;
}
