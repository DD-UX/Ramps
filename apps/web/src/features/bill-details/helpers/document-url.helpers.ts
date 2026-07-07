/**
 * Turn a stored `bucket/path` document reference into a public object URL.
 *
 * Bills store `document_url` as the storage-relative `invoices/<id>.pdf` (bucket
 * + key), not a full URL — so the value survives a project/base-URL change. The
 * viewer needs an absolute URL, and `SUPABASE_URL` is a server-only secret, so
 * we resolve it here — only the server-component route imports it, and it's
 * handed down as a prop — and never read env in the client pane. Returns `null`
 * for a bill with no document.
 */
export function publicDocumentUrl(documentRef: string | null): string | null {
  if (!documentRef) return null;
  const base = process.env.SUPABASE_URL;
  if (!base) throw new Error('SUPABASE_URL is not set; cannot build a public document URL.');
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/${documentRef}`;
}
