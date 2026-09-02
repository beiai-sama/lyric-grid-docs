import { database } from './runtime';

export type Fields = Record<string, string>;
export type DocumentSnapshot = { fields: Fields; revision: number; updatedAt: string | null; publishedAt: string | null };
type Row = { draft: string; published: string; revision: number; updated_at: string; published_at: string | null };
export async function readDocument(draft = false): Promise<DocumentSnapshot> {
  const row = await database().prepare('SELECT draft,published,revision,updated_at,published_at FROM documents WHERE id = ?').bind('main').first<Row>();
  return { fields: row ? JSON.parse(draft ? row.draft : row.published) : {}, revision: row?.revision ?? 0, updatedAt: row?.updated_at ?? null, publishedAt: row?.published_at ?? null };
}
