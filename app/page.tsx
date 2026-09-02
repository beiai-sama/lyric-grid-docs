import DocView from './doc-view';
import { DocumentProvider } from './editor/doc-fields';
import { readDocument } from '@/lib/document';
import { getEditorIdentity } from './chatgpt-auth';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const [document,identity]=await Promise.all([readDocument(),getEditorIdentity()]);
  return <DocumentProvider fields={document.fields} owner={identity.owner}><DocView /></DocumentProvider>;
}
