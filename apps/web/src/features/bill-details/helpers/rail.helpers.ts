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
 * CLOSED — the one category the catalog doesn't carry.
 *
 * `rejected` and `archived` are deliberately in no seeded tab: the Bill Pay
 * table files bills by what you still owe them, and a bill that's been sent
 * back or filed away is neither. That's right for the TABLE (the user's words:
 * "they are rarely consulted") but it made the DETAIL rail a dead end —
 * `railStatusesFor` degraded to `[status]`, so a rejected bill sat in a rail of
 * one, and the chevrons, which walk categories, had no category to walk from.
 * You could arrive at a rejected bill and then not leave it.
 *
 * So the two states get a category anyway — a synthetic tab, shaped exactly
 * like a catalog row so every helper downstream (`chevronRing`,
 * `chevronCandidates`, the provider's warmers, the rail's own grouping) treats
 * it as one more tab and needs no special case. It rides at the FRONT of the
 * chevron ring: `rejected` is a bill's way back to `draft` in the transition
 * map, so "Closed → Drafts" is the lifecycle read left to right, and Closed's
 * own `prev` clamps because nothing precedes the beginning.
 *
 * `sort_order: -1` keeps that "before everything" reading true for the one
 * path that interpolates by sort order (an unlisted CUSTOM tab working out
 * which ring stops lie behind it). The id is the nil UUID — it satisfies
 * `IdSchema` yet can name no row, which is the honest way to say "this
 * category is a client-side fiction". Nothing here is ever sent to the server;
 * only `statuses` crosses the wire, as `?statuses=rejected,archived`.
 *
 * The catalog always WINS over it (see `railStatusesFor` below and
 * `chevronCategories`): the day someone seeds a real tab covering these
 * states, that tab — with its own name and position — takes over and this
 * fallback goes quiet on its own.
 */
export const CLOSED_TAB: BillTabType = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Closed',
  code: 'closed',
  statuses: ['rejected', 'archived'],
  sort_order: -1,
  created_by: null,
};

/**
 * The status group the rail lists for a bill in `status` — the FIRST tab (by
 * the catalog's own `sort_order`) whose group contains it. Empty-group tabs
 * (Overview, "no filter") are skipped: the rail wants the bill's category, not
 * the whole payables inbox.
 *
 * A status the catalog doesn't claim falls to {@link CLOSED_TAB}, which covers
 * `rejected` + `archived` — so those two rail TOGETHER (a rejected bill lists
 * its archived neighbors and vice versa) instead of each sitting alone. Any
 * OTHER unclaimed status still degrades to just itself: a rail of one is a
 * poor rail, but it beats filing a bill under a category it isn't in.
 */
export function railStatusesFor(
  tabs: readonly BillTabType[],
  status: BillStatusType,
): readonly BillStatusType[] {
  const tab = tabs.find((t) => t.statuses.length > 0 && t.statuses.includes(status));
  if (tab) return tab.statuses;
  if (CLOSED_TAB.statuses.includes(status)) return CLOSED_TAB.statuses;
  return [status];
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
 * Category names that POSTmodify — a name opening with one of these can't be
 * jammed in front of a noun ("For approval bills"), so the noun leads instead
 * and the name trails it: "Bills for approval". Prepositions and the
 * participles that behave like them; anything else is assumed attributive.
 */
const POSTMODIFYING_OPENERS = new Set([
  'for',
  'in',
  'on',
  'under',
  'with',
  'without',
  'awaiting',
  'pending',
  'needing',
]);

/**
 * The rail badge's phrasing: a category name plus the noun it counts, so the
 * chip reads as a THING ("Closed bills") rather than a bare adjective
 * ("Closed") — the difference between a label you parse and one you read.
 *
 * The name still comes verbatim from the tab (rename the tab, the badge
 * follows); only the grammar around it is ours, and English wants two
 * different arrangements:
 *
 * - **Attributive** — a name that can sit in front of the noun takes it last,
 *   SINGULAR, because an attributive noun always is: `Drafts` → "Draft bills",
 *   not "Drafts bills". (`Paid`/`Closed` are unaffected — no trailing `s`.)
 * - **Postmodifying** — a name opening with a preposition can't lead, so the
 *   noun does and the name lowercases behind it: `For approval` → "Bills for
 *   approval". "For approval bills" is the literal append, and it's the one
 *   phrasing here nobody would ever say out loud.
 *
 * A name that already says "bill" is left exactly alone — a customer tab
 * called "Overdue bills" must not become "Overdue bills bills".
 */
export function categoryBadgeLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || /bill/i.test(trimmed)) return trimmed;

  const [opener = ''] = trimmed.split(' ');
  if (POSTMODIFYING_OPENERS.has(opener.toLowerCase())) {
    return `Bills ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
  }
  return `${singularAttributive(trimmed)} bills`;
}

/**
 * Drop a plural `s` for the attributive slot — `Drafts` → `Draft`. Only a lone
 * trailing `s`: `Progress` (double `s`) and every `-ed` state name are already
 * in their attributive form and pass through untouched.
 */
function singularAttributive(name: string): string {
  return /[^s]s$/.test(name) ? name.slice(0, -1) : name;
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
