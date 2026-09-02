import { getEditorIdentity } from '@/app/chatgpt-auth';
import { runtime } from '@/lib/runtime';

export const dynamic = 'force-dynamic';
export async function GET(_request:Request, { params }: { params:Promise<{id:string}> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null,{status:404});
  const { DB, DOCS_IMAGES } = runtime();
  const record = await DB.prepare('SELECT object_key,mime,published FROM images WHERE id = ?').bind(id).first<{object_key:string;mime:string;published:number}>();
  if (!record || (!record.published && !(await getEditorIdentity()).owner)) return new Response(null,{status:404});
  const object = await DOCS_IMAGES.get(record.object_key);
  if (!object) return new Response(null,{status:404});
  return new Response(object.body,{headers:{'Content-Type':record.mime,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':record.published?'public, max-age=3600':'private, no-store'}});
}
