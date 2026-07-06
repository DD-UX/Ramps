import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * Bill Pay tab helpers — the thin logic over the `bill_tabs` rows.
 *
 * The tab bar is DATA: the product categories (Overview | Drafts | For approval
 * | For payment | History) live in the `bill_tabs` lookup and arrive as
 * `BillTabType[]` rows (via `listBillTabs`, ordered by `sort_order`). These
 * helpers are the logic over those rows — how a `?tab=` code resolves to a row,
 * which status group a tab filters by, how per-status counts roll up into a
 * badge. No tab list lives here; change the tabs in the DB, not the code.
 *
 * The default tab is simply the FIRST row (`tabs[0]`) — the catalog's own
 * `sort_order` decides it (Overview is 0). There's no hardcoded default code:
 * assuming a specific slug would re-couple the app to one arrangement of the
 * data we deliberately moved into the DB.
 */

/**
 * Index the tab rows by `code` for O(1) lookup (AGENTS.md: key-based lookups
 * use a Map, never a per-lookup array scan). Build once per request from the
 * rows the page fetched, then pass it to the helpers below.
 */
export function tabsByCode(tabs: readonly BillTabType[]): ReadonlyMap<string, BillTabType> {
  return new Map(tabs.map((tab) => [tab.code, tab]));
}

/**
 * Resolve a raw `?tab=` code to a real tab row. Anything unknown (missing,
 * garbage, an old `?status=` value) falls back to the first tab — the catalog's
 * own default by `sort_order` — so a hand-typed URL can never 500. An empty
 * catalog is a broken deploy, not a user path, so it fails loudly rather than
 * handing back `undefined`.
 */
export function resolveTab(tabs: readonly BillTabType[], rawCode: string | undefined): BillTabType {
  if (rawCode) {
    const match = tabsByCode(tabs).get(rawCode);
    if (match) return match;
  }
  const first = tabs[0];
  if (!first) throw new Error('bill_tabs catalog is empty — no tab to resolve');
  return first;
}

/**
 * The status filter for a tab — the array the facade passes to `status IN (…)`.
 * An empty group (the default/Overview tab) reads as "no filter".
 */
export function statusesForTab(tab: BillTabType): readonly BillStatusType[] {
  return tab.statuses;
}

/**
 * The count badge for a tab — the sum of its grouped states. A tab with an
 * empty group (the default/Overview tab) is the grand total across every state,
 * including the rejected/archived tail no other tab shows, so it counts the
 * whole map.
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

/**
 * Roll the per-status counts up into one badge PER tab, keyed by tab `code` —
 * the map the tab bar reads. Split out of BillsPageContent so the roll-up is
 * unit-tested without a render: it's just `countForTab` applied across the
 * catalog, but doing it inline made the component own logic it shouldn't.
 */
export function buildTabCounts(
  tabs: readonly BillTabType[],
  countsByStatus: Partial<Record<BillStatusType, number>>,
): Record<BillTabType['code'], number> {
  return Object.fromEntries(tabs.map((tab) => [tab.code, countForTab(tab, countsByStatus)]));
}

/**
 * The href a tab switch navigates to. Selecting the DEFAULT tab (the catalog's
 * first row) drops the `?tab=` param — landing on the bare pathname — rather
 * than writing `?tab=<default>`; every other tab gets `?tab=<code>` (encoded).
 *
 * Split out of BillsTabs so the "default drops the param" rule is tested
 * without a router. Note: this owns only the `?tab=` decision; it does not
 * preserve other params (tab switches intentionally reset the search — the
 * page re-queries the new category fresh).
 */
export function tabHref(
  pathname: string,
  code: BillTabType['code'],
  defaultCode: BillTabType['code'] | undefined,
): string {
  return code === defaultCode ? pathname : `${pathname}?tab=${encodeURIComponent(code)}`;
}
