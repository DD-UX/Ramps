import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

import { CLOSED_TAB, groupBillsByStatus, railOrderedIds } from './rail.helpers';

/**
 * Chevron logic — the `< >` category steppers in the detail header.
 *
 * The chevrons walk the rail between the bill categories, and which
 * categories those are is a WHITELIST ({@link CHEVRON_NAVIGABLE_TAB_CODES}):
 * an explicit, ordered list of `bill_tabs` codes, resolved at runtime against
 * the catalog plus the one category the catalog doesn't seed ({@link
 * CLOSED_TAB}, the rejected/archived pair). The whitelist is the single opt-in
 * — Overview isn't "special-cased out", it's simply not on it — and its order
 * is the walk order. The agreed behavior (findings doc, T2):
 *
 * - **Skip empty.** A chevron targets the nearest NON-EMPTY category in its
 *   direction — an empty category is skipped, not landed on.
 * - **Wrap around.** The ring is a circle: walking off either end continues
 *   from the other, so no category is a cul-de-sac. A chevron only goes
 *   disabled when every OTHER category is empty — the same muted-end
 *   treatment as the rail footer, now a genuinely last resort.
 * - **Concrete landing.** The target is a specific BILL — the first CARD the
 *   landing rail will show (its grouped visual order's head, via the rail's
 *   own `groupBillsByStatus`), so the hop selects the first item in the first
 *   list and the chevron can be a real `<Link href="/bills/:id">` the
 *   unsaved-changes guard intercepts.
 *
 * Everything here is a pure function over the tab catalog and whatever
 * category lists the provider has warmed; "not loaded yet" is an explicit
 * outcome (`settled: false`), never a guess — a chevron can't skip past a
 * category it hasn't seen.
 */

/**
 * The ordered whitelist of chevron-navigable tab codes. Codes the catalog
 * doesn't carry are ignored, so a renamed/deleted tab degrades the ring
 * instead of breaking it; a catalog tab NOT listed here (Overview, anything
 * a customer adds) is simply not a chevron stop.
 *
 * The order is the bill LIFECYCLE, and it CLOSES on itself. `closed` — the
 * synthetic {@link CLOSED_TAB}, the one stop the catalog doesn't seed — opens
 * it at index 0 because `rejected` is a bill's way BACK to `draft` in the
 * transition map: `Closed →` lands on Drafts, which is the move a reviewer
 * actually makes from a sent-back bill. Paid, the terminal category, ends it,
 * and its `→` wraps straight back to Closed — the two settled categories,
 * paid and written-off, sit next to each other across the seam, which is the
 * only place a wrap could be a natural adjacency rather than a jump.
 */
export const CHEVRON_NAVIGABLE_TAB_CODES = [
  'closed',
  'drafts',
  'for_approval',
  'for_payment',
  'paid',
] as const;

/** Two status arrangements are the same category iff they list the same states in order. */
export function sameStatuses(a: readonly BillStatusType[], b: readonly BillStatusType[]): boolean {
  return a.length === b.length && a.every((status, index) => status === b[index]);
}

/**
 * The categories the chevrons can reason about: the catalog, then the
 * synthetic Closed fallback. Catalog LAST-resort ordering is deliberate —
 * `find` takes the first match, so a seeded tab that ever claims `closed` (or
 * the rejected/archived pair) shadows the fiction rather than duelling with
 * it. Exactly the precedence `railStatusesFor` uses, so the two agree on what
 * category a bill is in.
 */
function chevronCategories(tabs: readonly BillTabType[]): BillTabType[] {
  return [...tabs, CLOSED_TAB];
}

/**
 * The category a status arrangement IS — the inverse of `railStatusesFor`,
 * and the only place that answer is computed. The chevrons need it to find
 * their position on the ring; the rail's header badge needs its `name` to say
 * which category you're looking at. One lookup, so the badge can never name a
 * category the chevrons are walking from.
 *
 * `undefined` when nothing claims the arrangement — a degraded rail of one
 * (see `railStatusesFor`'s last resort). There is no tab name to give, and
 * inventing one would be the half-truth this whole category exists to avoid.
 */
export function categoryFor(
  tabs: readonly BillTabType[],
  statuses: readonly BillStatusType[],
): BillTabType | undefined {
  return chevronCategories(tabs).find(
    (tab) => tab.statuses.length > 0 && sameStatuses(tab.statuses, statuses),
  );
}

/**
 * The whitelist resolved against the catalog: the chevrons' ring, in
 * whitelist order. Also the set of categories worth WARMING — every ring
 * member is a potential chevron target, Closed included, which is what pays
 * for the hop out of a rejected bill being instant.
 */
export function chevronRing(tabs: readonly BillTabType[]): BillTabType[] {
  const categories = chevronCategories(tabs);
  return CHEVRON_NAVIGABLE_TAB_CODES.map((code) =>
    categories.find((tab) => tab.code === code && tab.statuses.length > 0),
  ).filter((tab): tab is BillTabType => tab != null);
}

/** A chevron's resolved destination: the category tab and the bill it lands on. */
export interface ChevronTarget {
  tab: BillTabType;
  /** The landing rail's first CARD (grouped visual order) — the `<Link>` href. */
  billId: string;
}

/**
 * One chevron's renderable state. `settled: false` means a candidate list is
 * still loading and the answer isn't knowable yet (render disabled, quietly);
 * `settled: true, target: null` is a REAL clamp — and since the ring wraps,
 * that now means every OTHER category on it is empty, not merely the ones
 * that way.
 */
export interface ChevronState {
  target: ChevronTarget | null;
  settled: boolean;
}

/**
 * The candidate categories in each direction from the current one, nearest
 * first, ready for the skip-empty walk. The ring is a LOOP, so each direction
 * lists every OTHER stop: walk forward off the end and you come back round at
 * Closed, walk back off the front and you arrive at Paid. Concretely, from the
 * terminal category `next` opens on Closed while `prev` still reads For
 * payment — the two chevrons keep pointing opposite ways round the circle, and
 * neither of the four lifecycle ends is a cul-de-sac you have to back out of.
 *
 * The current category is never its own candidate: the wrap stops one short,
 * so the far side of the loop is the LAST resort for the skip-empty walk, not
 * a hop onto the bill you're already reading.
 *
 * When the current category is ON the ring, its position does the split. When
 * it's a catalog category the whitelist omits (anything a customer adds), its
 * `sort_order` interpolates a position instead — so you can still chevron OUT
 * of an unlisted category, in either direction, just never INTO one. A
 * category NEITHER the catalog nor the Closed fallback claims has no position
 * at all: both sides come back empty and the chevrons clamp, the honest answer
 * for a rail of one.
 */
export function chevronCandidates(
  tabs: readonly BillTabType[],
  statuses: readonly BillStatusType[],
): { prev: BillTabType[]; next: BillTabType[] } {
  const current = categoryFor(tabs, statuses);
  if (!current) return { prev: [], next: [] };

  const ring = chevronRing(tabs);
  const position = ring.findIndex((tab) => tab.id === current.id);
  const [before, after] =
    position === -1
      ? // Unlisted: no seat on the ring, so sort_order says which stops fall
        // either side of it. Every ring member lands in exactly one half —
        // the wrap below still reaches all of them.
        [
          ring.filter((tab) => tab.sort_order < current.sort_order),
          ring.filter((tab) => tab.sort_order > current.sort_order),
        ]
      : [ring.slice(0, position), ring.slice(position + 1)];

  // Each direction continues round the far side, nearest stop first
  // throughout: forward runs out the tail then re-enters at the head;
  // backward runs down the head then re-enters at the tail.
  return {
    prev: [...before].reverse().concat([...after].reverse()),
    next: [...after, ...before],
  };
}

/**
 * Walk one direction's candidates (nearest first) to the chevron's state.
 * The first candidate with bills wins — and the landing is the bill its RAIL
 * will show FIRST: the raw list is due-date-ordered ACROSS statuses, but the
 * rail folds it into status sections (`groupBillsByStatus`), so the visual
 * head can differ from `list[0]`. Grouping here keeps the hop honest — you
 * always land selected on the first card of the first section. An UNLOADED
 * candidate stops the walk unsettled: skipping past a category we haven't
 * seen could steal the hop from the nearer neighbor a moment before its
 * (possibly non-empty) list lands.
 */
export function resolveChevronState(
  candidates: readonly BillTabType[],
  listFor: (tab: BillTabType) => BillListItemType[] | undefined,
): ChevronState {
  for (const tab of candidates) {
    const list = listFor(tab);
    if (!list) return { target: null, settled: false };
    const head = railOrderedIds(groupBillsByStatus(list, tab.statuses))[0];
    if (head) return { target: { tab, billId: head }, settled: true };
  }
  return { target: null, settled: true };
}
