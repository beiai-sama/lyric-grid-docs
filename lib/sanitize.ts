import sanitizeHtml from 'sanitize-html';
import defaults from '@/content/default-fields.json';

export const chapterIds = ['start','model','phoneme','chinese','timeline','blind','import','lab','ai','appearance','shortcuts','faq'];
const imagePath = /^\/api\/images\/[a-f0-9-]{36}$/;
export function cleanHtml(html: string, block = false) {
  return sanitizeHtml(html, {
    allowedTags: block ? ['p','br','strong','b','em','i','s','u','code','a','h2','h3','ul','ol','li','blockquote','img','hr'] : ['br','strong','b','em','i','s','u','code','a','img'],
    allowedAttributes: { a: ['href','target','rel'], img: ['src','alt','title'] },
    allowedSchemes: ['https','http','mailto'],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
    exclusiveFilter: (frame) => frame.tag === 'img' && !imagePath.test(frame.attribs.src ?? ''),
  });
}
export function validateFields(value: unknown): Record<string,string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('文档格式不正确');
  const entries = Object.entries(value);
  if (entries.length > 500) throw new Error('内容块太多');
  let length = 0;
  const fields: Record<string,string> = {};
  for (const [key, html] of entries) {
    const block = chapterIds.some(id => key === `extra-${id}`);
    if (!block && !Object.prototype.hasOwnProperty.call(defaults,key)) throw new Error('发现未知内容块，请刷新后重试');
    if (typeof html !== 'string' || html.length > (block ? 100000 : 20000)) throw new Error('单段内容过长');
    length += html.length;
    if (length > 800000) throw new Error('文档过大，请减少内容');
    fields[key] = cleanHtml(html,block);
  }
  return fields;
}
export function referencedImages(fields: Record<string,string>) {
  const ids=[...new Set(Object.values(fields).join('').match(/\/api\/images\/[a-f0-9-]{36}/g) ?? [])].map(path=>path.split('/').pop()!);
  return ids;
}
