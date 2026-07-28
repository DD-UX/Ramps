import type { BillListItemType } from '@ramps/schemas/bills';

/**
 * Client-side mirror of the facade's toolbar search (`listBills({ search })`),
 * for the Bill Pay page's SWR-cached derivation: the server fetches the WHOLE
 * category once, and `?q=` narrows it HERE — a keystroke filters over rows the
 * client already holds instead of re-running the ILIKE round trip.
 *
 * Mirrored semantics, field for field:
 * - the same OR across the bill's identifying columns — `invoice_number`,
 *   `po_number`, `memo` — plus the vendor's name. The server reaches the name
 *   through a `vendor_id IN (…)` sub-lookup only because PostgREST can't OR
 *   against an embedded column; the list row already carries the joined
 *   `vendor_name`, so the client matches it directly.
 * - case-insensitive substring, like `ILIKE %term%`.
 * - `*` is the user's wildcard (the server maps it onto `%`): the term splits
 *   on `*` into fragments that must appear IN ORDER within one field.
 * - an all-punctuation / blank term is a no-op (matches everything), same as
 *   the server's "sanitized to empty → no filter".
 *
 * The parenthesis/comma stripping in the server's sanitizer is PostgREST
 * grammar-escaping, not search semantics — nothing here talks to PostgREST, so
 * those characters match literally. That's a strictly LESS surprising reading
 * of `INV (copy)` than the server's, and the divergence only shows for terms
 * containing `(),`.
 */
export function filterBillsBySearch(
  bills: readonly BillListItemType[],
  term: string | null | undefined,
): BillListItemType[] {
  const needles = (term ?? '')
    .toLowerCase()
    .split('*')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (needles.length === 0) return [...bills];

  return bills.filter((bill) =>
    [bill.invoice_number, bill.po_number, bill.memo, bill.vendor_name].some((field) =>
      matchesInOrder(field, needles),
    ),
  );
}

/** True when every needle appears in `field`, in order (the `*` contract). */
function matchesInOrder(field: string | null, needles: readonly string[]): boolean {
  if (field == null) return false;
  const haystack = field.toLowerCase();
  let from = 0;
  for (const needle of needles) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return false;
    from = at + needle.length;
  }
  return true;
}
