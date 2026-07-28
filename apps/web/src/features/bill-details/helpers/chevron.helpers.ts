import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

/**
 * Chevron logic — the `< >` category steppers in the detail header.
 *
 * The chevrons walk the rail between the WORK categories, and which
 * categories those are is a WHITELIST ({@link CHEVRON_NAVIGABLE_TAB_CODES}):
 * an explicit, ordered list of `bill_tabs` codes, resolved against the
 * catalog at runtime. The whitelist is the single opt-in — Overview and
 * History aren't "special-cased out", they're simply not on it — and its
 * order is the walk order. The agreed behavior (findings doc, T2):
 *
 * - **Skip empty.** A chevron targets the nearest NON-EMPTY category in its
 *   direction — an empty category is skipped, not landed on.
 * - **Clamp ends.** No non-empty category in a direction → that chevron is
 *   disabled, same muted-end treatment as the rail footer.
 * - **Concrete landing.** The target is a specific BILL — the first of the
 *   category in the rail's own due-date order — so the chevron can be a real
 *   `<Link href="/bills/:id">` the unsaved-changes guard intercepts.
 *
 * Everything here is a pure function over the tab catalog and whatever
 * category lists the provider has warmed; "not loaded yet" is an explicit
 * outcome (`settled: false`), never a guess — a chevron can't skip past a
 * category it hasn't seen.
 */

/**
 * The ordered whitelist of chevron-navigable tab codes. Codes the catalog
 * doesn't carry are ignored, so a renamed/deleted tab degrades the ring
 * instead of breaking it; a catalog tab NOT listed here (Overview, History,
 * anything a customer adds) is simply not a chevron stop.
 */
export const CHEVRON_NAVIGABLE_TAB_CODES = ['drafts', 'for_approval', 'for_payment'] as const;

/** Two status arrangements are the same category iff they list the same states in order. */
export function sameStatuses(a: readonly BillStatusType[], b: readonly BillStatusType[]): boolean {
  return a.length === b.length && a.every((status, index) => status === b[index]);
}

/**
 * The whitelist resolved against the catalog: the chevrons' ring, in
 * whitelist order. Also the set of categories worth WARMING — every ring
 * member is a potential chevron target.
 */
export function chevronRing(tabs: readonly BillTabType[]): BillTabType[] {
  return CHEVRON_NAVIGABLE_TAB_CODES.map((code) =>
    tabs.find((tab) => tab.code === code && tab.statuses.length > 0),
  ).filter((tab): tab is BillTabType => tab != null);
}

/** A chevron's resolved destination: the category tab and the bill it lands on. */
export interface ChevronTarget {
  tab: BillTabType;
  /** First bill of the category in rail (due-date) order — the `<Link>` href. */
  billId: string;
}

/**
 * One chevron's renderable state. `settled: false` means a candidate list is
 * still loading and the answer isn't knowable yet (render disabled, quietly);
 * `settled: true, target: null` is a REAL clamp — every candidate is empty.
 */
export interface ChevronState {
  target: ChevronTarget | null;
  settled: boolean;
}

/**
 * The candidate categories in each direction from the current one, nearest
 * first, ready for the skip-empty walk. When the current category is ON the
 * ring, its ring position splits it. When it's a catalog category the
 * whitelist omits (History — or anything a customer adds), its `sort_order`
 * interpolates a position instead, so you can still chevron OUT of an
 * unlisted category, just never INTO one. A category no tab claims (the
 * degraded single-status rail) has no position at all — both sides come back
 * empty and the chevrons clamp.
 */
export function chevronCandidates(
  tabs: readonly BillTabType[],
  statuses: readonly BillStatusType[],
): { prev: BillTabType[]; next: BillTabType[] } {
  const current = tabs.find(
    (tab) => tab.statuses.length > 0 && sameStatuses(tab.statuses, statuses),
  );
  if (!current) return { prev: [], next: [] };

  const ring = chevronRing(tabs);
  const position = ring.findIndex((tab) => tab.id === current.id);
  if (position !== -1) {
    return { prev: ring.slice(0, position).reverse(), next: ring.slice(position + 1) };
  }
  return {
    prev: ring.filter((tab) => tab.sort_order < current.sort_order).reverse(),
    next: ring.filter((tab) => tab.sort_order > current.sort_order),
  };
}

/**
 * Walk one direction's candidates (nearest first) to the chevron's state.
 * The first candidate with bills wins — its head bill is the landing. An
 * UNLOADED candidate stops the walk unsettled: skipping past a category we
 * haven't seen could steal the hop from the nearer neighbor a moment before
 * its (possibly non-empty) list lands.
 */
export function resolveChevronState(
  candidates: readonly BillTabType[],
  listFor: (tab: BillTabType) => BillListItemType[] | undefined,
): ChevronState {
  for (const tab of candidates) {
    const list = listFor(tab);
    if (!list) return { target: null, settled: false };
    const head = list[0];
    if (head) return { target: { tab, billId: head.id }, settled: true };
  }
  return { target: null, settled: true };
}
