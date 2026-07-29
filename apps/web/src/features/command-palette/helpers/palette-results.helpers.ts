import type { BillListItemType } from '@ramps/schemas/bills';

import { formatBillDate } from '@/features/bills/helpers/format-date.helpers';
import type { NavItem, NavSection } from '@/features/common/helpers/nav.helpers';

import { PALETTE_MIN_QUERY_LENGTH } from '../constants/palette.constants';

/**
 * The palette's pure result logic — everything that decides WHAT the overlay
 * lists, kept out of the component so it can be tested without a DOM (and so
 * the two result families can't quietly grow different matching rules).
 *
 * The two families are searched differently ON PURPOSE, because only one of
 * them is fully in memory:
 *
 * - **Bills** live in a table of unknown size, so their search is the SERVER's
 *   (`GET /api/bills?q=`, matching invoice number, PO number, memo and vendor
 *   name). Filtering a fetched page on the client would silently hide every
 *   match that didn't happen to be on it — the precise class of lie this
 *   palette was built to remove.
 * - **Destinations** are a fixed handful already in the bundle, so matching
 *   them locally is exact, not a sample.
 */

/**
 * SWR key for one palette search. Deliberately its OWN prefix rather than
 * `billsListSwrKey`: the table's windows are keyed by category + term + page
 * and sized to `BILLS_PAGE_SIZE`, so sharing the key shape would let a
 * six-row palette read and a ten-row table read collide on one cache entry
 * and serve each other's truncated data.
 */
export function paletteBillsSwrKey(term: string): string {
  return `PALETTE_BILLS:q=${term}`;
}

/**
 * Is this term worth a round-trip? Trimmed, and at least
 * {@link PALETTE_MIN_QUERY_LENGTH} — the single gate both the SWR key and the
 * empty-state copy read, so "not searching yet" and "searched, found nothing"
 * can never disagree on screen.
 */
export function isSearchableQuery(query: string): boolean {
  return query.trim().length >= PALETTE_MIN_QUERY_LENGTH;
}

/**
 * The destinations the palette can offer: nav items that are actually BUILT.
 * `disabled` items are the IA's context, not places you can go — listing them
 * here would rebuild the "many unimplemented pages" problem inside the one
 * surface meant to make navigation feel complete.
 */
export function navigableItems(sections: NavSection[]): NavItem[] {
  return sections.flatMap((section) => section.filter((item) => !item.disabled));
}

/**
 * Match destinations by label, case-insensitively. An empty query matches
 * everything: with no term typed the palette is a menu, and showing the whole
 * (short) list of real destinations is the most useful thing it can do.
 */
export function matchNavItems(sections: NavSection[], query: string): NavItem[] {
  const term = query.trim().toLowerCase();
  const items = navigableItems(sections);
  if (!term) return items;
  return items.filter((item) => item.label.toLowerCase().includes(term));
}

/**
 * The row's second line: the identifiers a searcher actually typed to get
 * here. Invoice number leads (it's the most likely term), then the due date
 * for the "which of these three Acme bills" case. Parts that don't exist are
 * dropped rather than rendered as an em dash — a palette row is a label, not a
 * table cell that must hold its column.
 */
export function billResultDescription(bill: BillListItemType): string {
  const parts: string[] = [];
  if (bill.invoice_number) parts.push(bill.invoice_number);
  if (bill.due_date) parts.push(`Due ${formatBillDate(bill.due_date)}`);
  return parts.join(' · ');
}

/**
 * The row's title. Vendor name is the label a person searches by; the fallback
 * keeps a vendorless email draft from rendering a blank row.
 */
export function billResultLabel(bill: BillListItemType): string {
  return bill.vendor_name ?? 'Untitled bill';
}
