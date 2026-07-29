import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import {
  categoryFor,
  CHEVRON_NAVIGABLE_TAB_CODES,
  chevronCandidates,
  chevronRing,
  resolveChevronState,
  sameStatuses,
} from './chevron.helpers';
// The rail's own resolver, used here on purpose: these tests assert on the
// category a rejected/archived bill ACTUALLY lands in, not on a hand-written
// pair that could drift from it.
import { railStatusesFor } from './rail.helpers';

/**
 * The chevrons are a WHITELIST walk over the tab catalog (see the module's
 * header): these tests pin the ring's order and degradation, the candidate
 * split in each direction and its WRAP round the seam (on-ring position vs.
 * `sort_order` interpolation for unlisted categories), and the skip-empty
 * walk's three outcomes — a concrete landing, an honest "not knowable yet",
 * and the clamp that now only fires when the whole ring is empty.
 *
 * The fixture mirrors the seeded `bill_tabs` catalog, same as the tab-bar
 * helper tests: Overview first and unfiltered, then the four whitelisted
 * categories in order — drafts/for_approval/for_payment/paid.
 *
 * Note what the fixture does NOT carry: a tab for `rejected`/`archived`. The
 * catalog doesn't seed one, so `CLOSED_TAB` supplies it — which means the ring
 * these tests walk is FIVE stops, opening on Closed at index 0, even though
 * the fixture below lists four. That asymmetry is the feature, and several
 * tests here exist to hold it.
 */
const TABS: BillTabType[] = [
  { id: '1', name: 'Overview', code: 'overview', statuses: [], sort_order: 0, created_by: null },
  {
    id: '2',
    name: 'Drafts',
    code: 'drafts',
    statuses: ['draft', 'missing_info'],
    sort_order: 1,
    created_by: null,
  },
  {
    id: '3',
    name: 'For approval',
    code: 'for_approval',
    statuses: ['awaiting_approval'],
    sort_order: 2,
    created_by: null,
  },
  {
    id: '4',
    name: 'For payment',
    code: 'for_payment',
    statuses: ['approved', 'scheduled', 'partially_paid'],
    sort_order: 3,
    created_by: null,
  },
  {
    id: '5',
    name: 'Paid',
    code: 'paid',
    statuses: ['paid'],
    sort_order: 4,
    created_by: null,
  },
];

/** A customer-added catalog tab the whitelist never lists — the unlisted case. */
const CUSTOM_TAB: BillTabType = {
  id: '6',
  name: 'Rejected',
  code: 'rejected_view',
  statuses: ['rejected'],
  sort_order: 5,
  created_by: 'user-1',
};

const tab = (code: string): BillTabType => {
  const found = TABS.find((t) => t.code === code);
  if (!found) throw new Error(`fixture has no tab '${code}'`);
  return found;
};

/**
 * resolveChevronState reads `id` + `status` (it groups the list the way the
 * rail renders it) — a cast keeps the fixture honest-sized. Status-less bills
 * fold into a single trailing group, preserving the flat order.
 */
const bill = (id: string, status?: string) => ({ id, status }) as BillListItemType;

describe('sameStatuses', () => {
  it('is order-sensitive equality over the arrangement', () => {
    expect(sameStatuses(['draft', 'missing_info'], ['draft', 'missing_info'])).toBe(true);
    expect(sameStatuses(['draft', 'missing_info'], ['missing_info', 'draft'])).toBe(false);
    expect(sameStatuses(['draft'], ['draft', 'missing_info'])).toBe(false);
    expect(sameStatuses([], [])).toBe(true);
  });
});

/**
 * The shared "which category is this?" lookup — the chevrons find their ring
 * position with it and the rail's header badge takes its NAME from it, so a
 * disagreement here would put a badge saying one category above steppers
 * walking from another.
 */
describe('categoryFor', () => {
  it('names a catalog category', () => {
    expect(categoryFor(TABS, tab('for_payment').statuses)?.name).toBe('For payment');
  });

  it('names the synthetic Closed category the catalog never seeds', () => {
    expect(categoryFor(TABS, railStatusesFor(TABS, 'rejected'))?.name).toBe('Closed');
    // …from either state, since the rail files both under the one category.
    expect(categoryFor(TABS, railStatusesFor(TABS, 'archived'))?.name).toBe('Closed');
  });

  it('names an unlisted custom view — being off the ring is not being unnamed', () => {
    expect(categoryFor([...TABS, CUSTOM_TAB], CUSTOM_TAB.statuses)?.name).toBe('Rejected');
  });

  it('is order-sensitive: the same statuses in another order are another category', () => {
    expect(categoryFor(TABS, ['missing_info', 'draft'])).toBeUndefined();
  });

  it('gives back NOTHING for an arrangement nothing claims, rather than guessing', () => {
    // The degraded rail of one. The badge falls back to the status's own
    // label here; inventing a tab name would be the half-truth to avoid.
    expect(categoryFor(TABS, ['archived'])).toBeUndefined();
  });

  it('never names the unfiltered Overview tab, which "contains" everything', () => {
    expect(categoryFor(TABS, [])).toBeUndefined();
  });

  it('agrees with chevronCandidates — same lookup, so same verdict', () => {
    // Where categoryFor finds nothing, the chevrons must have no position.
    expect(categoryFor(TABS, ['archived'])).toBeUndefined();
    expect(chevronCandidates(TABS, ['archived'])).toEqual({ prev: [], next: [] });
  });
});

describe('chevronRing', () => {
  it('resolves the whitelist against the catalog, in whitelist order', () => {
    expect(chevronRing(TABS).map((t) => t.code)).toEqual([...CHEVRON_NAVIGABLE_TAB_CODES]);
  });

  it('opens on Closed — the one stop the catalog never seeds', () => {
    // The fixture has no rejected/archived tab, yet the ring still has five
    // stops: the synthetic fallback joins as an ordinary member, at index 0.
    const ring = chevronRing(TABS);
    expect(ring[0]?.code).toBe('closed');
    expect(ring[0]?.name).toBe('Closed');
    expect(ring[0]?.statuses).toEqual(['rejected', 'archived']);
    expect(ring).toHaveLength(5); // the 4 whitelisted catalog tabs, plus Closed
  });

  it('a whitelisted code the catalog dropped degrades the ring, never breaks it', () => {
    const withoutApproval = TABS.filter((t) => t.code !== 'for_approval');
    expect(chevronRing(withoutApproval).map((t) => t.code)).toEqual([
      'closed',
      'drafts',
      'for_payment',
      'paid',
    ]);
  });

  it('a whitelisted tab with NO statuses is not a stop — nothing to land in', () => {
    const gutted = TABS.map((t) => (t.code === 'drafts' ? { ...t, statuses: [] } : t));
    expect(chevronRing(gutted).map((t) => t.code)).toEqual([
      'closed',
      'for_approval',
      'for_payment',
      'paid',
    ]);
  });

  it('catalog tabs off the whitelist (Overview, custom views) are simply not stops', () => {
    const codes = chevronRing([...TABS, CUSTOM_TAB]).map((t) => t.code);
    expect(codes).not.toContain('overview');
    expect(codes).not.toContain('rejected_view');
  });

  it('a seeded `closed` tab shadows the synthetic one — the fiction is a fallback', () => {
    const seeded: BillTabType = {
      id: '7',
      name: 'Closed out',
      code: 'closed',
      statuses: ['archived'],
      sort_order: 6,
      created_by: null,
    };
    const ring = chevronRing([...TABS, seeded]);
    expect(ring[0]?.name).toBe('Closed out');
    expect(ring.filter((t) => t.code === 'closed')).toHaveLength(1);
  });
});

describe('chevronCandidates', () => {
  it('splits the ring at the current category and continues round, nearest first', () => {
    const mid = chevronCandidates(TABS, tab('for_approval').statuses);
    // Backwards to the head, then re-entering at the tail; forwards to the
    // tail, then re-entering at the head. Every OTHER stop, both ways.
    expect(mid.prev.map((t) => t.code)).toEqual(['drafts', 'closed', 'paid', 'for_payment']);
    expect(mid.next.map((t) => t.code)).toEqual(['for_payment', 'paid', 'closed', 'drafts']);
  });

  it('never offers the CURRENT category as its own candidate', () => {
    // The wrap stops one short — otherwise a hop from an all-empty ring would
    // land you back on the bill you're already reading.
    for (const code of ['closed', 'drafts', 'for_approval', 'for_payment', 'paid']) {
      const from = chevronRing(TABS).find((t) => t.code === code)!;
      const { prev, next } = chevronCandidates(TABS, from.statuses);
      expect(prev.map((t) => t.code)).not.toContain(code);
      expect(next.map((t) => t.code)).not.toContain(code);
      // …and between them each direction still reaches all four others.
      expect(prev).toHaveLength(4);
      expect(next).toHaveLength(4);
    }
  });

  /**
   * The behavior this whole category exists for. A rejected or archived bill
   * used to be a navigational DEAD END: no tab claimed its status, so
   * `railStatusesFor` degraded to a rail of one, the lookup here found nothing,
   * and both chevrons clamped — you could arrive and not leave.
   */
  it('Closed is a full ring member: `→` walks out to Drafts', () => {
    const closed = chevronCandidates(TABS, railStatusesFor(TABS, 'rejected'));
    expect(closed.next.map((t) => t.code)).toEqual([
      'drafts',
      'for_approval',
      'for_payment',
      'paid',
    ]);
    // The rail arrives at the same category from either state, so archived
    // gets the identical way out — one category, not two dead ends.
    expect(chevronCandidates(TABS, railStatusesFor(TABS, 'archived'))).toEqual(closed);
  });

  it('…and the walk is symmetric: `←` from Drafts lands back in Closed', () => {
    const drafts = chevronCandidates(TABS, tab('drafts').statuses);
    expect(drafts.prev[0]?.code).toBe('closed');
  });

  /**
   * The ring CLOSES. Neither seam-adjacent category is a cul-de-sac you have
   * to back out of: keep pressing one arrow and you circle, and the two
   * chevrons never point at the same stop while there is more than one other.
   */
  it('wraps at the seam: from Paid `→` reads Closed while `←` still reads For payment', () => {
    const paid = chevronCandidates(TABS, tab('paid').statuses);
    expect(paid.next[0]?.code).toBe('closed');
    expect(paid.prev[0]?.code).toBe('for_payment');
  });

  it('…and the seam is symmetric: from Closed `←` reads Paid while `→` still reads Drafts', () => {
    const closed = chevronCandidates(TABS, railStatusesFor(TABS, 'rejected'));
    expect(closed.prev[0]?.code).toBe('paid');
    expect(closed.next[0]?.code).toBe('drafts');
  });

  it('a ring of ONE still clamps — the wrap must not offer you yourself', () => {
    // Gut every category but Closed: there is genuinely nowhere else to go,
    // and both chevrons must say so rather than pointing back at this rail.
    const gutted = TABS.map((t) => ({ ...t, statuses: [] }));
    expect(chevronRing(gutted).map((t) => t.code)).toEqual(['closed']);
    expect(chevronCandidates(gutted, railStatusesFor(gutted, 'rejected'))).toEqual({
      prev: [],
      next: [],
    });
  });

  it('an unlisted category interpolates by sort_order — chevron OUT, never INTO', () => {
    // The custom view (sort_order 5) sits after the whole ring, so `←` walks
    // back down it — and `→`, having nothing ahead, wraps to the head. An
    // unlisted category is a place you can leave BOTH ways, which matters
    // more here than on the ring: you can never chevron back INTO it.
    const catalog = [...TABS, CUSTOM_TAB];
    const unlisted = chevronCandidates(catalog, CUSTOM_TAB.statuses);
    expect(unlisted.prev.map((t) => t.code)).toEqual([
      'paid',
      'for_payment',
      'for_approval',
      'drafts',
      'closed',
    ]);
    expect(unlisted.next.map((t) => t.code)).toEqual([
      'closed',
      'drafts',
      'for_approval',
      'for_payment',
      'paid',
    ]);
    // …and the custom view itself is never a candidate from a ring member.
    const fromPayment = chevronCandidates(catalog, tab('for_payment').statuses);
    expect(fromPayment.next.map((t) => t.code)).not.toContain('rejected_view');
    expect(fromPayment.prev.map((t) => t.code)).not.toContain('rejected_view');
  });

  it('a category neither the catalog nor Closed claims has no position — both sides clamp', () => {
    // `['archived']` ALONE is no longer a category anything produces —
    // `railStatusesFor` yields the rejected+archived pair — so this is the
    // genuinely unclaimed case: an arrangement nothing on the ring matches
    // still gets the honest clamp rather than a guessed position.
    expect(chevronCandidates(TABS, ['archived'])).toEqual({ prev: [], next: [] });
  });
});

describe('resolveChevronState', () => {
  const lists: Record<string, BillListItemType[] | undefined> = {
    drafts: [bill('d1'), bill('d2')],
    for_approval: [],
    for_payment: [bill('p1')],
  };
  const listFor = (t: BillTabType) => lists[t.code];

  it('the nearest non-empty candidate wins, landing on its head bill', () => {
    const state = resolveChevronState([tab('drafts'), tab('for_payment')], listFor);
    expect(state).toEqual({
      target: { tab: tab('drafts'), billId: 'd1' },
      settled: true,
    });
  });

  it("lands on the rail's FIRST CARD, not the raw list head — grouping wins over due date", () => {
    // For payment renders sections in status order: approved, scheduled,
    // partially_paid. The raw list is due-date-ordered ACROSS statuses, so its
    // head (a scheduled bill) sits in the SECOND section — the hop must select
    // the first card of the first section instead.
    const state = resolveChevronState([tab('for_payment')], () => [
      bill('p-sched', 'scheduled'),
      bill('p-appr', 'approved'),
    ]);
    expect(state).toEqual({
      target: { tab: tab('for_payment'), billId: 'p-appr' },
      settled: true,
    });
  });

  it('skips a loaded-but-empty category to the next candidate', () => {
    const state = resolveChevronState([tab('for_approval'), tab('for_payment')], listFor);
    expect(state).toEqual({
      target: { tab: tab('for_payment'), billId: 'p1' },
      settled: true,
    });
  });

  it('an UNLOADED candidate stops the walk unsettled — no skipping past the unseen', () => {
    // Paid's list hasn't warmed; drafts beyond it is loaded and non-empty,
    // but the walk must not steal the hop from the nearer neighbor.
    const state = resolveChevronState([tab('paid'), tab('drafts')], listFor);
    expect(state).toEqual({ target: null, settled: false });
  });

  it('every candidate loaded and empty is the REAL clamp', () => {
    const state = resolveChevronState([tab('for_approval')], listFor);
    expect(state).toEqual({ target: null, settled: true });
  });

  it('no candidates at all clamps immediately', () => {
    expect(resolveChevronState([], listFor)).toEqual({ target: null, settled: true });
  });
});
