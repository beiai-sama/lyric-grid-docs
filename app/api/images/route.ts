import { getEditorIdentity } from '@/app/chatgpt-auth';
import { isSameOriginWrite } from '@/lib/authorization';
import { runtime } from '@/lib/runtime';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const who = await getEditorIdentity();
  if (!who.owner) return Response.json({error:'只有作者可以上传图片'},{status:who.id?403:401});
  if (!isSameOriginWrite(request,import.meta.env.DEV)) return Response.json({error:'请求来源无效'},{status:403});
  if (Number(request.headers.get('content-length')) > 6*1024*1024) return Response.json({error:'图片不能超过 5 MB'},{status:413});
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || file.size > 5*1024*1024 || !file.size) return Response.json({error:'请选择 5 MB 以内的图片'},{status:400});
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ascii = (start:number,end:number) => String.fromCharCode(...bytes.slice(start,end));
  const mime = bytes[0]===0x89 && ascii(1,4)==='PNG' && bytes[4]===13 && bytes[5]===10 ? 'image/png'
    : bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff ? 'image/jpeg'
    : ['GIF87a','GIF89a'].includes(ascii(0,6)) ? 'image/gif'
    : ascii(0,4)==='RIFF' && ascii(8,12)==='WEBP' ? 'image/webp' : null;
  if (!mime) return Response.json({error:'只支持 PNG、JPG、WebP 或 GIF，不支持 SVG'},{status:400});
  const { DB, DOCS_IMAGES } = runtime();
  const id = crypto.randomUUID();
  const key = `docs/${id}`;
  await DOCS_IMAGES.put(key,bytes,{httpMetadata:{contentType:mime}});
  try { await DB.prepare('INSERT INTO images (id,object_key,name,mime,size,owner_id,published,created_at) VALUES (?,?,?,?,?,?,0,?)').bind(id,key,file.name.slice(0,200),mime,file.size,who.id,new Date().toISOString()).run(); }
  catch (error) { await DOCS_IMAGES.delete(key); throw error; }
  return Response.json({url:`/api/images/${id}`,alt:file.name.replace(/\.[^.]+$/,'')},{headers:{'Cache-Control':'private, no-store'}});
}
