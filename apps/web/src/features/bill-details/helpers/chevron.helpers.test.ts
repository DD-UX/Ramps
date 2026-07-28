import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import {
  CHEVRON_NAVIGABLE_TAB_CODES,
  chevronCandidates,
  chevronRing,
  resolveChevronState,
  sameStatuses,
} from './chevron.helpers';

/**
 * The chevrons are a WHITELIST walk over the tab catalog (see the module's
 * header): these tests pin the ring's order and degradation, the candidate
 * split in each direction (on-ring position vs. `sort_order` interpolation
 * for unlisted categories), and the skip-empty walk's three outcomes — a
 * concrete landing, an honest "not knowable yet", and the end clamp.
 *
 * The fixture mirrors the seeded `bill_tabs` catalog, same as the tab-bar
 * helper tests: Overview first and unfiltered, then the four whitelisted
 * categories in order — drafts/for_approval/for_payment/paid — with Paid
 * closing the ring as the terminal stop.
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

describe('chevronRing', () => {
  it('resolves the whitelist against the catalog, in whitelist order', () => {
    expect(chevronRing(TABS).map((t) => t.code)).toEqual([...CHEVRON_NAVIGABLE_TAB_CODES]);
  });

  it('a whitelisted code the catalog dropped degrades the ring, never breaks it', () => {
    const withoutApproval = TABS.filter((t) => t.code !== 'for_approval');
    expect(chevronRing(withoutApproval).map((t) => t.code)).toEqual([
      'drafts',
      'for_payment',
      'paid',
    ]);
  });

  it('a whitelisted tab with NO statuses is not a stop — nothing to land in', () => {
    const gutted = TABS.map((t) => (t.code === 'drafts' ? { ...t, statuses: [] } : t));
    expect(chevronRing(gutted).map((t) => t.code)).toEqual(['for_approval', 'for_payment', 'paid']);
  });

  it('catalog tabs off the whitelist (Overview, custom views) are simply not stops', () => {
    const codes = chevronRing([...TABS, CUSTOM_TAB]).map((t) => t.code);
    expect(codes).not.toContain('overview');
    expect(codes).not.toContain('rejected_view');
  });
});

describe('chevronCandidates', () => {
  it('splits the ring at the current category, nearest candidate first', () => {
    const mid = chevronCandidates(TABS, tab('for_approval').statuses);
    expect(mid.prev.map((t) => t.code)).toEqual(['drafts']);
    expect(mid.next.map((t) => t.code)).toEqual(['for_payment', 'paid']);

    const last = chevronCandidates(TABS, tab('paid').statuses);
    // Nearest FIRST — the walk order, so prev reads right-to-left on the ring.
    expect(last.prev.map((t) => t.code)).toEqual(['for_payment', 'for_approval', 'drafts']);
    expect(last.next).toEqual([]);
  });

  it('ring ends have an empty side — the whitelist order IS first and last', () => {
    const first = chevronCandidates(TABS, tab('drafts').statuses);
    expect(first.prev).toEqual([]);
    expect(first.next.map((t) => t.code)).toEqual(['for_approval', 'for_payment', 'paid']);
  });

  it('an unlisted category interpolates by sort_order — chevron OUT, never INTO', () => {
    // The custom view (sort_order 5) sits after the whole ring: everything is `prev`.
    const catalog = [...TABS, CUSTOM_TAB];
    const unlisted = chevronCandidates(catalog, CUSTOM_TAB.statuses);
    expect(unlisted.prev.map((t) => t.code)).toEqual([
      'paid',
      'for_payment',
      'for_approval',
      'drafts',
    ]);
    expect(unlisted.next).toEqual([]);
    // …and the custom view itself is never a candidate from a ring member.
    const fromPayment = chevronCandidates(catalog, tab('for_payment').statuses);
    expect(fromPayment.next.map((t) => t.code)).not.toContain('rejected_view');
  });

  it('a category no tab claims has no position — both sides clamp', () => {
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
