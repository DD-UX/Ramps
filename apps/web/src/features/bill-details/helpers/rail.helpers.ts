import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

/**
 * Rail logic — which bills ride alongside the open one, and in what shape.
 *
 * The detail screen's left rail (frame 1) lists the open bill's CATEGORY: the
 * same status group the Bill Pay tab bar files it under. These helpers answer
 * the three questions the rail asks — which statuses is that (`railStatusesFor`),
 * how do the fetched bills fold into the rail's status-labelled sections
 * (`groupBillsByStatus`), and where do Prev/Next go (`adjacentBills`) — as pure
 * functions over the rows the page already fetched, so the rail component stays
 * a dumb renderer and the answers are unit-testable without a DB.
 */

/**
 * The status group the rail lists for a bill in `status` — the FIRST tab (by
 * the catalog's own `sort_order`) whose group contains it. Empty-group tabs
 * (Overview, "no filter") are skipped: the rail wants the bill's category, not
 * the whole payables inbox. A status no tab claims (e.g. `rejected` when only
 * History rolls it up and History was deleted) degrades to just itself, so the
 * rail still shows the bill's own kind rather than nothing.
 */
export function railStatusesFor(
  tabs: readonly BillTabType[],
  status: BillStatusType,
): readonly BillStatusType[] {
  const tab = tabs.find((t) => t.statuses.length > 0 && t.statuses.includes(status));
  return tab ? tab.statuses : [status];
}

export interface RailGroup {
  status: BillStatusType;
  bills: BillListItemType[];
}

/**
 * Fold the flat, due-date-ordered list into the rail's sections — one per
 * status, in `statusOrder`'s order (the tab's own arrangement, e.g. "Missing
 * info" above "Ready for review" in frame 1). Statuses with no bills vanish
 * (no empty headings); bills whose status isn't in `statusOrder` are appended
 * as trailing groups in first-seen order rather than dropped, so a row the
 * query returned can never silently not render.
 */
export function groupBillsByStatus(
  bills: readonly BillListItemType[],
  statusOrder: readonly BillStatusType[],
): RailGroup[] {
  const byStatus = new Map<BillStatusType, BillListItemType[]>();
  for (const status of statusOrder) byStatus.set(status, []);
  for (const bill of bills) {
    const bucket = byStatus.get(bill.status);
    if (bucket) bucket.push(bill);
    else byStatus.set(bill.status, [bill]);
  }
  return [...byStatus.entries()]
    .filter(([, group]) => group.length > 0)
    .map(([status, group]) => ({ status, bills: group }));
}

/**
 * Prev/Next targets for the rail's footer, walking the bills in the ORDER THE
 * RAIL SHOWS THEM (the grouped order, not the raw query order — Next must land
 * on the card visually below the active one). Ends are `null` (first bill has
 * no Prev); an active id that isn't in the list (just-archived, filtered out)
 * disables both rather than guessing.
 */
export function adjacentBills(
  groups: readonly RailGroup[],
  activeId: BillListItemType['id'],
): { prev: BillListItemType | null; next: BillListItemType | null } {
  const ordered = groups.flatMap((group) => group.bills);
  const index = ordered.findIndex((bill) => bill.id === activeId);
  if (index === -1) return { prev: null, next: null };
  return { prev: ordered[index - 1] ?? null, next: ordered[index + 1] ?? null };
}
