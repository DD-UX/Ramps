import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

/**
 * Rail logic — which bills ride alongside the open one, and in what shape.
 *
 * The detail screen's left rail (frame 1) lists the open bill's CATEGORY: the
 * same status group the Bill Pay tab bar files it under. These helpers answer
 * the rail's questions — which statuses is that (`railStatusesFor`), how do
 * the fetched bills fold into the rail's status-labelled sections
 * (`groupBillsByStatus`), and what is the rail's flat visual order
 * (`railOrderedIds`) — as pure functions over the rows the page already
 * fetched, so the components stay dumb renderers and the answers are
 * unit-testable without a DB.
 *
 * Stepping that order (↑/↓ Prev/Next) lives in `useUpDownNavigation`, which
 * takes `railOrderedIds` as its item list.
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
 * The rail's flat VISUAL order — the grouped sections read top to bottom, as
 * ids. This is the one list ↑/↓ skimming and the Prev/Next footer both walk,
 * computed once by the (server) rail and handed to the client provider.
 */
export function railOrderedIds(groups: readonly RailGroup[]): string[] {
  return groups.flatMap((group) => group.bills.map((bill) => bill.id));
}

/**
 * The `data-rail-anchor` marker a rail card stamps on its `<Link>`, so the
 * debounced ↑/↓ commit can find and click that exact anchor. One name, two
 * sites: {@link ../components/BillDetailsRailItem} spreads it as a prop, the
 * provider queries `a[data-rail-anchor="<id>"]` — keeping the string honest.
 */
export function railAnchorAttrs(id: string): { 'data-rail-anchor': string } {
  return { 'data-rail-anchor': id };
}

/** The CSS attribute selector body matching {@link railAnchorAttrs} for `id`. */
export function railAnchorId(id: string): string {
  return `data-rail-anchor="${id}"`;
}
