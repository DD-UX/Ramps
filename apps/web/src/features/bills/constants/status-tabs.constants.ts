import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * The lifecycle tabs across the top of the Bill Pay table.
 *
 * The product's IA mirrors the bill state machine (ANALYSIS §1 insight 2): the
 * tab bar is just the lifecycle laid flat, with "All" as the unfiltered view.
 * `value` doubles as the `?status=` query param — `'all'` means no filter, so
 * it's the one value that is NOT a `BillStatusType`.
 *
 * Labels match the StatusPill's STATUS_META so a tab and its pills read the
 * same word.
 */

/** A tab's query value: any lifecycle state, or the unfiltered 'all' view. */
export type BillStatusTabValueType = BillStatusType | 'all';

export interface BillStatusTabType {
  value: BillStatusTabValueType;
  label: string;
}

export const BILL_STATUS_TABS: readonly BillStatusTabType[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'missing_info', label: 'Missing info' },
  { value: 'awaiting_approval', label: 'Awaiting approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'partially_paid', label: 'Partially paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
] as const;

/**
 * Tab-by-value lookup — the single dictionary other code reads. Keyed by the
 * `?status=` value so `parseStatusParam` resolves in O(1) instead of scanning
 * the array on every request (AGENTS.md: key-based lookups use a Map).
 */
export const BILL_STATUS_TAB_BY_VALUE: ReadonlyMap<BillStatusTabValueType, BillStatusTabType> =
  new Map(BILL_STATUS_TABS.map((tab) => [tab.value, tab]));

/**
 * Narrow an arbitrary `?status=` string to a real filter. Anything that isn't a
 * known lifecycle state (including 'all', missing, or garbage) becomes
 * `undefined` — the unfiltered query — so a hand-typed URL can never 500.
 */
export function parseStatusParam(raw: string | undefined): BillStatusType | undefined {
  if (!raw) return undefined;
  const tab = BILL_STATUS_TAB_BY_VALUE.get(raw as BillStatusTabValueType);
  return tab && tab.value !== 'all' ? tab.value : undefined;
}
