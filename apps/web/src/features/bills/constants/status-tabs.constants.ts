import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * Bill Pay tab helpers — the tab bar is DATA now, not a hardcoded list.
 *
 * The five product categories (Overview | Drafts | For approval | For payment |
 * History) live in the `bill_tabs` lookup table and arrive as `BillTabType[]`
 * rows (via `listBillTabs`). This module is the thin logic over those rows: how
 * a `?tab=` code resolves to a row, which status group a tab filters by, and
 * how the per-status counts roll up into a tab's badge. No tab list lives here
 * — change the tabs in the DB, not the code.
 *
 * `code` is the row's URL-safe slug; it doubles as the `?tab=` query param, so
 * switching tabs is a navigation the Server Component re-queries against.
 */

/** The default tab's code — the unfiltered Overview view (a bad/absent `?tab=` lands here). */
export const DEFAULT_TAB_CODE = 'overview';

/**
 * Index the tab rows by `code` for O(1) lookup (AGENTS.md: key-based lookups
 * use a Map, never a per-lookup array scan). Build this once per request from
 * the rows the page fetched, then pass it to the helpers below.
 */
export function tabsByCode(tabs: readonly BillTabType[]): ReadonlyMap<string, BillTabType> {
  return new Map(tabs.map((tab) => [tab.code, tab]));
}

/**
 * Resolve a raw `?tab=` code to a real tab row. Anything unknown (missing,
 * garbage, an old `?status=` value) falls back to the default tab — Overview,
 * the unfiltered view — so a hand-typed URL can never 500. Falls back to the
 * first row if no `overview` code exists (defensive; the seed always has one).
 */
export function resolveTab(tabs: readonly BillTabType[], rawCode: string | undefined): BillTabType {
  const byCode = tabsByCode(tabs);
  if (rawCode) {
    const match = byCode.get(rawCode);
    if (match) return match;
  }
  const fallback = byCode.get(DEFAULT_TAB_CODE) ?? tabs[0];
  // The seed always ships an Overview row; an empty catalog is a broken deploy,
  // not a user path — fail loudly rather than hand back `undefined`.
  if (!fallback) throw new Error('bill_tabs catalog is empty — no tab to resolve');
  return fallback;
}

/**
 * The status filter for a tab — the array the facade passes to `status IN (…)`.
 * An empty group (Overview) reads as "no filter".
 */
export function statusesForTab(tab: BillTabType): readonly BillStatusType[] {
  return tab.statuses;
}

/**
 * The count badge for a tab — the sum of its grouped states. A tab with an
 * empty group (Overview) is the grand total across every state, including the
 * rejected/archived tail no other tab shows, so it counts the whole map.
 */
export function countForTab(
  tab: BillTabType,
  countsByStatus: Partial<Record<BillStatusType, number>>,
): number {
  if (tab.statuses.length === 0) {
    return Object.values(countsByStatus).reduce<number>((sum, n) => sum + (n ?? 0), 0);
  }
  return tab.statuses.reduce<number>((sum, status) => sum + (countsByStatus[status] ?? 0), 0);
}
