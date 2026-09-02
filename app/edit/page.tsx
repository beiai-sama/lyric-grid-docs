import { requireEditorPage } from '../chatgpt-auth';
import { readDocument } from '@/lib/document';
import EditorShell from '../editor/editor-shell';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = {title:'编辑使用手册 · 词格',robots:{index:false,follow:false}};
export default async function EditPage() {
  const identity=await requireEditorPage();
  if (!identity.owner) return <main className="editor-denied"><span>仅作者可用</span><h1>这个编辑室只属于北艾sama。</h1><p>当前登录账号没有修改文档的权限。</p><Link href="/">返回使用手册</Link><a href="/signout-with-chatgpt?return_to=%2Fedit" target="_top">更换登录账号</a></main>;
  return <EditorShell initial={await readDocument(true)} />;
}
