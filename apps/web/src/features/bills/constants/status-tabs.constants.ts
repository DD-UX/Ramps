import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * The Bill Pay tab bar — the five product categories, not one-tab-per-status.
 *
 * Ramp's IA groups the nine lifecycle states into five buckets (see the
 * product-overview frames): Overview | Drafts | For approval | For payment |
 * History. Each tab therefore owns an ARRAY of statuses, and the table filters
 * with `status IN (…)`. Overview is the unfiltered view — its `statuses` is
 * empty, meaning "no filter, show everything".
 *
 * `value` doubles as the `?tab=` query param, so switching tabs is a
 * navigation the Server Component re-queries against (ANALYSIS §1 — the IA
 * mirrors the state machine, here rolled up to the buckets the product shows).
 *
 * Deliberate gap: `rejected` and `archived` belong to no named tab and only
 * surface under Overview. History is `paid` only — the terminal-but-not-paid
 * states are not "history" in the product's sense.
 */

/** A tab's query value — the category key, `'overview'` being the unfiltered view. */
export type BillTabValueType = 'overview' | 'drafts' | 'for_approval' | 'for_payment' | 'history';

export interface BillTabType {
  value: BillTabValueType;
  label: string;
  /** The lifecycle states this tab rolls up. Empty = unfiltered (Overview). */
  statuses: readonly BillStatusType[];
}

export const BILL_TABS: readonly BillTabType[] = [
  { value: 'overview', label: 'Overview', statuses: [] },
  { value: 'drafts', label: 'Drafts', statuses: ['draft', 'missing_info'] },
  { value: 'for_approval', label: 'For approval', statuses: ['awaiting_approval'] },
  {
    value: 'for_payment',
    label: 'For payment',
    statuses: ['approved', 'scheduled', 'partially_paid'],
  },
  { value: 'history', label: 'History', statuses: ['paid'] },
] as const;

/**
 * Tab-by-value lookup — the single dictionary other code reads. Keyed by the
 * `?tab=` value so lookups resolve in O(1) instead of scanning the array on
 * every request (AGENTS.md: key-based lookups use a Map).
 */
export const BILL_TAB_BY_VALUE: ReadonlyMap<BillTabValueType, BillTabType> = new Map(
  BILL_TABS.map((tab) => [tab.value, tab]),
);

/**
 * Narrow an arbitrary `?tab=` string to a real tab value. Anything unknown
 * (missing, garbage, an old `?status=` value) falls back to `'overview'` — the
 * unfiltered view — so a hand-typed URL can never 500.
 */
export function parseTabParam(raw: string | undefined): BillTabValueType {
  if (raw && BILL_TAB_BY_VALUE.has(raw as BillTabValueType)) {
    return raw as BillTabValueType;
  }
  return 'overview';
}

/**
 * The status filter for a tab — the array the facade passes to `status IN (…)`.
 * Overview returns `[]`, which the facade reads as "no filter".
 */
export function statusesForTab(value: BillTabValueType): readonly BillStatusType[] {
  return BILL_TAB_BY_VALUE.get(value)?.statuses ?? [];
}

/**
 * The count badge for a tab — the sum of its grouped states. Overview is the
 * grand total across every state (including the rejected/archived tail that no
 * other tab shows), so it counts the whole map rather than a group.
 */
export function countForTab(
  value: BillTabValueType,
  countsByStatus: Partial<Record<BillStatusType, number>>,
): number {
  if (value === 'overview') {
    return Object.values(countsByStatus).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  }
  return statusesForTab(value).reduce<number>(
    (sum, status) => sum + (countsByStatus[status] ?? 0),
    0,
  );
}
