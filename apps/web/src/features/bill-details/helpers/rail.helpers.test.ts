import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import {
  categoryBadgeLabel,
  CLOSED_TAB,
  groupBillsByStatus,
  railAnchorAttrs,
  railAnchorId,
  railOrderedIds,
  railStatusesFor,
} from './rail.helpers';

/**
 * The rail helpers only read `id` + `status` off a row; the fixtures carry just
 * those. Tabs likewise: only `statuses` (and identity fields) matter here.
 */
const bill = (id: string, status: BillStatusType) => ({ id, status }) as BillListItemType;

const tab = (code: string, statuses: BillStatusType[]): BillTabType => ({
  id: `00000000-0000-0000-0000-00000000000${code.length}`,
  name: code,
  code,
  statuses,
  sort_order: 0,
  created_by: null,
});

const TABS = [
  tab('overview', []), // unfiltered — must never be picked
  tab('inbox', ['missing_info', 'draft']),
  tab('approval', ['awaiting_approval']),
];

describe('railStatusesFor', () => {
  it('returns the first non-empty tab group containing the status', () => {
    expect(railStatusesFor(TABS, 'draft')).toEqual(['missing_info', 'draft']);
    expect(railStatusesFor(TABS, 'awaiting_approval')).toEqual(['awaiting_approval']);
  });

  it('skips the unfiltered Overview tab even though it "contains" everything', () => {
    expect(railStatusesFor(TABS, 'missing_info')).toEqual(['missing_info', 'draft']);
  });

  // The two states no seeded tab claims rail TOGETHER, so a rejected bill
  // lists its archived neighbors instead of sitting in a rail of one — and,
  // because that pair is a real ring stop, the chevrons can walk out of it.
  it('falls back to Closed for the two states the catalog leaves out', () => {
    expect(railStatusesFor(TABS, 'rejected')).toEqual(['rejected', 'archived']);
    expect(railStatusesFor(TABS, 'archived')).toEqual(['rejected', 'archived']);
    // Both arrive at the SAME arrangement — same `railBillsSwrKey`, so the two
    // statuses provably share one cached list rather than fetching twice.
    expect(railStatusesFor(TABS, 'rejected')).toBe(railStatusesFor(TABS, 'archived'));
  });

  it('a catalog tab that claims those states WINS over the Closed fallback', () => {
    // The fiction is a fallback, not an override: seed a real tab and it
    // yields, name, order and all.
    const withRejected = [...TABS, tab('sent_back', ['rejected'])];
    expect(railStatusesFor(withRejected, 'rejected')).toEqual(['rejected']);
  });

  it('degrades to the status itself when neither the catalog nor Closed claims it', () => {
    expect(railStatusesFor(TABS, 'paid')).toEqual(['paid']);
  });
});

describe('CLOSED_TAB', () => {
  // It is passed around as a `BillTabType` and must survive every read a real
  // catalog row gets — an id that parses, a non-empty group (an empty one is
  // silently skipped by both `railStatusesFor` and `chevronRing`), and a
  // sort_order ahead of any seeded tab, which is what "before everything"
  // means to the interpolation path in `chevronCandidates`.
  it('is shaped like a catalog row, positioned before every real one', () => {
    expect(CLOSED_TAB.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(CLOSED_TAB.name).toBe('Closed');
    expect(CLOSED_TAB.statuses).toEqual(['rejected', 'archived']);
    expect(CLOSED_TAB.sort_order).toBeLessThan(0);
    // No owner: it is a system category, not someone's saved view.
    expect(CLOSED_TAB.created_by).toBeNull();
  });
});

describe('groupBillsByStatus', () => {
  const bills = [bill('a', 'draft'), bill('b', 'missing_info'), bill('c', 'draft')];

  it("sections in the given status order, keeping each group's row order", () => {
    const groups = groupBillsByStatus(bills, ['missing_info', 'draft']);
    expect(groups.map((g) => g.status)).toEqual(['missing_info', 'draft']);
    expect(groups[1]?.bills.map((b) => b.id)).toEqual(['a', 'c']);
  });

  it('drops empty sections and appends unlisted statuses instead of losing rows', () => {
    const groups = groupBillsByStatus(
      [...bills, bill('d', 'paid')],
      ['missing_info', 'draft', 'awaiting_approval'],
    );
    expect(groups.map((g) => g.status)).toEqual(['missing_info', 'draft', 'paid']);
  });
});

describe('railOrderedIds', () => {
  it('flattens the grouped sections into the visual top-to-bottom order', () => {
    const groups = groupBillsByStatus(
      [bill('b', 'draft'), bill('a', 'missing_info'), bill('c', 'draft')],
      ['missing_info', 'draft'],
    );
    // 'a' first (its section sorts first), then the drafts in row order.
    expect(railOrderedIds(groups)).toEqual(['a', 'b', 'c']);
  });
});

describe('categoryBadgeLabel', () => {
  // The five real catalog names, phrased. Two arrangements, because English
  // has two: a name that can lead the noun does, one that can't follows it.
  it('phrases every shipped category so it reads out loud', () => {
    expect(categoryBadgeLabel('Drafts')).toBe('Draft bills');
    expect(categoryBadgeLabel('For approval')).toBe('Bills for approval');
    expect(categoryBadgeLabel('For payment')).toBe('Bills for payment');
    expect(categoryBadgeLabel('Paid')).toBe('Paid bills');
    expect(categoryBadgeLabel('Closed')).toBe('Closed bills');
  });

  // The attributive slot takes a singular noun — "Drafts bills" is the naive
  // append, and it's wrong.
  it('singularises only a lone trailing `s`', () => {
    expect(categoryBadgeLabel('Drafts')).toBe('Draft bills');
    expect(categoryBadgeLabel('Progress')).toBe('Progress bills');
    expect(categoryBadgeLabel('Approved')).toBe('Approved bills');
  });

  // A prepositional name can't premodify, so the noun leads and the name
  // lowercases in behind it.
  it('leads with the noun when the name opens with a preposition', () => {
    expect(categoryBadgeLabel('Awaiting approval')).toBe('Bills awaiting approval');
    expect(categoryBadgeLabel('Without a vendor')).toBe('Bills without a vendor');
  });

  // A customer tab that already names the noun must not have it added twice.
  it('leaves a name that already says "bill" alone', () => {
    expect(categoryBadgeLabel('Overdue bills')).toBe('Overdue bills');
    expect(categoryBadgeLabel('Bill backlog')).toBe('Bill backlog');
  });

  it('has nothing to say about an empty name', () => {
    expect(categoryBadgeLabel('')).toBe('');
    expect(categoryBadgeLabel('   ')).toBe('');
  });

  // The rail's lone-status fallback feeds this too — a BILL_STATUS_LABEL, not
  // a tab name — and every one of those is already attributive.
  it('phrases a bare status label the same way', () => {
    expect(categoryBadgeLabel('Archived')).toBe('Archived bills');
    expect(categoryBadgeLabel('Missing info')).toBe('Missing info bills');
  });
});

describe('rail anchor tag', () => {
  // The card stamps the attr and the provider queries it — one id, so the
  // stamp and the selector must always agree on a given bill.
  it('the stamped attribute matches its own selector', () => {
    const id = 'b0000000-0000-0000-0000-00000000d001';
    const attrs = railAnchorAttrs(id);
    expect(attrs).toEqual({ 'data-rail-anchor': id });
    expect(railAnchorId(id)).toBe(`data-rail-anchor="${id}"`);
  });
});
