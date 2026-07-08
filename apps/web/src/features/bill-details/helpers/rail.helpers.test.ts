import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import { adjacentBills, groupBillsByStatus, railStatusesFor } from './rail.helpers';

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

  it('degrades to the status itself when no tab claims it', () => {
    expect(railStatusesFor(TABS, 'archived')).toEqual(['archived']);
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

describe('adjacentBills', () => {
  const groups = groupBillsByStatus(
    [bill('a', 'missing_info'), bill('b', 'draft'), bill('c', 'draft')],
    ['missing_info', 'draft'],
  );

  it('walks the grouped (visual) order across section boundaries', () => {
    expect(adjacentBills(groups, 'b')).toEqual({
      prev: bill('a', 'missing_info'),
      next: bill('c', 'draft'),
    });
  });

  it('is null at the ends and for an active id not in the list', () => {
    expect(adjacentBills(groups, 'a').prev).toBeNull();
    expect(adjacentBills(groups, 'c').next).toBeNull();
    expect(adjacentBills(groups, 'zz')).toEqual({ prev: null, next: null });
  });
});
