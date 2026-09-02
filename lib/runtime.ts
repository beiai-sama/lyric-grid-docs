import { env } from 'cloudflare:workers';

export type RuntimeEnv = { DB: D1Database; DOCS_IMAGES: R2Bucket; DOCS_OWNER_EMAIL?: string };
export function runtime() { return env as unknown as RuntimeEnv; }
export function database() { return runtime().DB; }
