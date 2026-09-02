import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isOwnerIdentity } from '@/lib/authorization';
import { runtime } from '@/lib/runtime';

export async function getEditorIdentity() {
  const h = await headers();
  const id = h.get('oai-authenticated-user-id');
  const email = h.get('oai-authenticated-user-email');
  const expected = import.meta.env.DEV ? 'seedy@sites.test' : runtime().DOCS_OWNER_EMAIL;
  return { id, owner: isOwnerIdentity(id, email, expected) };
}

export function chatGPTSignInPath() { return '/signin-with-chatgpt?return_to=%2Fedit'; }
export async function requireEditorPage() {
  const identity = await getEditorIdentity();
  if (!identity.id) redirect(chatGPTSignInPath());
  return identity;
}
