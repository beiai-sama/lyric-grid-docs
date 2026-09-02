export function isOwnerIdentity(id: string | null, email: string | null, ownerEmail: string | undefined) {
  return Boolean(id?.trim() && email?.trim() && ownerEmail?.trim() && email.trim().toLowerCase() === ownerEmail.trim().toLowerCase());
}

export function isSameOriginWrite(request: Request, development = false) {
  const allowed = ['https://lyric-grid-docs-cn.beiai.chatgpt.site'];
  if (development) allowed.push('http://localhost:3000', 'http://localhost:3001');
  return allowed.includes(request.headers.get('origin') ?? '') && request.headers.get('sec-fetch-site') !== 'cross-site';
}
