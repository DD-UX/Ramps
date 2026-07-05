/**
 * Format an ISO date (`YYYY-MM-DD`) as the product's short "Mon D, YYYY" — the
 * form the invoice/due dates take in the table (product-overview frames). Null
 * dates (email-ingested drafts that arrived before a due date was parsed) render
 * as an em dash so the column never shows a blank cell.
 *
 * Parsed as UTC noon to dodge the classic off-by-one where a bare `YYYY-MM-DD`
 * is read as UTC midnight and then shifted back a day in a negative timezone.
 */
export function formatBillDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
