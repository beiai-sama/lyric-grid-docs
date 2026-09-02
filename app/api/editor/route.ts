import { getEditorIdentity } from '@/app/chatgpt-auth';
import { isSameOriginWrite } from '@/lib/authorization';
import { database } from '@/lib/runtime';
import { readDocument } from '@/lib/document';
import { referencedImages, validateFields } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET() {
  const who = await getEditorIdentity();
  if (!who.owner) return reply({error:'只有文档作者可以编辑'},who.id ? 403 : 401);
  return reply(await readDocument(true));
}
export async function PUT(request: Request) {
  const who = await getEditorIdentity();
  if (!who.owner) return reply({error:'只有文档作者可以编辑'},who.id ? 403 : 401);
  if (!isSameOriginWrite(request,import.meta.env.DEV)) return reply({error:'请求来源无效'},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'请求格式无效'},415);
  const raw = await request.text();
  if (raw.length > 1100000) return reply({error:'文档过大'},413);
  let input;
  let fields: Record<string,string>;
  try {
    input = JSON.parse(raw);
    if (!['save','publish'].includes(input.action) || !Number.isSafeInteger(input.revision) || input.revision < 0) throw new Error('请求格式无效');
    fields = validateFields(input.fields);
  } catch (error) { return reply({error:error instanceof Error ? error.message : '内容无效'},400); }
  const db = database();
  const now = new Date().toISOString();
  const writeToken = crypto.randomUUID();
  const serialized = JSON.stringify(fields);
  const publish = input.action === 'publish';
  const imageIds = referencedImages(fields);
  if (imageIds.length > 100) return reply({error:'单份文档最多保留 100 张图片'},400);
  for (const id of imageIds) {
    const image = await db.prepare('SELECT id FROM images WHERE id = ?').bind(id).first();
    if (!image) return reply({error:'有图片未上传成功，请重新插入'},400);
  }
  const update = input.revision === 0
    ? db.prepare('INSERT INTO documents (id,draft,published,revision,updated_at,published_at,updated_by,write_token) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind('main',serialized,publish?serialized:'{}',1,now,publish?now:null,who.id,writeToken)
    : db.prepare('UPDATE documents SET draft = ?, published = CASE WHEN ? = 1 THEN ? ELSE published END, revision = revision + 1, updated_at = ?, published_at = CASE WHEN ? = 1 THEN ? ELSE published_at END, updated_by = ?, write_token = ? WHERE id = ? AND revision = ?').bind(serialized,publish?1:0,serialized,now,publish?1:0,now,who.id,writeToken,'main',input.revision);
  // Image publication shares the document transaction and is conditional on this exact write.
  const publishImages = publish ? imageIds.map(id=>db.prepare('UPDATE images SET published = 1 WHERE id = ? AND EXISTS (SELECT 1 FROM documents WHERE id = ? AND write_token = ?)').bind(id,'main',writeToken)) : [];
  const results = await db.batch([update,...publishImages]);
  if (!results[0].meta.changes) return reply({error:'另一标签页保存了较新的版本。请先备份当前内容，再重新载入，避免覆盖。'},409);
  return reply({fields,revision:input.revision+1,updatedAt:now,publishedAt:publish?now:null});
}
