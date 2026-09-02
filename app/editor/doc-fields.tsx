'use client';

import { createContext, createElement, useContext, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import defaults from '@/content/default-fields.json';
import type { Fields } from '@/lib/document';

export type FieldDefinition = { html:string; section:string; label:string; block:boolean };
export const fieldDefinitions = defaults as Record<string,FieldDefinition>;
type EditingContext = { fields:Fields; owner:boolean; editing?:boolean; selected?:string; onSelect?:(id:string)=>void };
export const DocumentContext = createContext<EditingContext>({fields:{},owner:false});
export function useDocumentSections<T extends {id:string;title:string}>(sections:T[]) {
  const {fields}=useContext(DocumentContext);
  return useMemo(()=>sections.map(item=>({...item,title:fields[`${item.id}-title`]?.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ')??item.title})),[sections,fields]);
}
export function DocumentProvider({fields,owner,children}:{fields:Fields;owner:boolean;children:ReactNode}) {
  return <DocumentContext.Provider value={{fields,owner}}>{children}</DocumentContext.Provider>;
}

export function DocField({fieldId,as='span',className='',...props}:{fieldId:string;as?:'h1'|'h2'|'h3'|'p'|'li'|'b'|'span'|'code'|'div';className?:string} & HTMLAttributes<HTMLElement>) {
  const context=useContext(DocumentContext);
  const definition=fieldDefinitions[fieldId];
  const html=context.fields[fieldId] ?? definition?.html ?? '';
  const select=()=>context.onSelect?.(fieldId);
  return createElement(as,{
    ...props,
    className:`${className} doc-field ${context.editing?'editable-field':''} ${context.selected===fieldId?'field-selected':''}`,
    'data-field-id':fieldId,
    ...(context.editing ? {tabIndex:0,role:'button','aria-label':`编辑：${definition?.label ?? '内容'}`,onClick:(event:React.MouseEvent)=>{event.preventDefault();event.stopPropagation();select();},onKeyDown:(event:React.KeyboardEvent)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}}} : {}),
    dangerouslySetInnerHTML:{__html:html},
  });
}

export function DocExtra({section}:{section:string}) {
  const ctx=useContext(DocumentContext);
  const id=`extra-${section}`;
  const html=ctx.fields[id] ?? '';
  if (!html && !ctx.editing) return null;
  return <div className="doc-extra">{html && <DocField as="div" className="rich-document" fieldId={id} />}{ctx.editing && <button className="add-chapter-content" onClick={()=>ctx.onSelect?.(id)}>＋ {html?'编辑本章补充内容':'在本章追加文字 / 图片'}</button>}</div>;
}

export function OwnerEntry() {
  const ctx=useContext(DocumentContext);
  return ctx.owner && !ctx.editing ? <a className="owner-edit-entry" href="/edit">编辑文档</a> : null;
}
