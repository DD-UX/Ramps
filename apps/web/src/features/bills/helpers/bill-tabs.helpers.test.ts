import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import { countForTab, resolveTab, statusesForTab } from './bill-tabs.helpers';

/**
 * The tab bar is data: these helpers operate on the `bill_tabs` rows the page
 * fetched, not a hardcoded list. The fixture mirrors the seeded catalog
 * (Overview first/unfiltered; the rest rolling up their status groups). The
 * default is the FIRST row by order — no hardcoded 'overview' code.
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
    name: 'History',
    code: 'history',
    statuses: ['paid'],
    sort_order: 4,
    created_by: null,
  },
];

/**
 * resolveTab hardens the `?tab=` code before it selects a category. Anything
 * that isn't a real tab code must fall back to the FIRST tab so a hand-typed
 * URL (or a stale `?status=` link) can never 500 — and the default follows the
 * catalog's order, not a hardcoded slug.
 */
describe('resolveTab', () => {
  it('resolves a real tab code to its row', () => {
    expect(resolveTab(TABS, 'drafts').code).toBe('drafts');
    expect(resolveTab(TABS, 'for_payment').code).toBe('for_payment');
    expect(resolveTab(TABS, 'history').code).toBe('history');
  });

  it('falls back to the first tab for missing / unknown / stale codes', () => {
    expect(resolveTab(TABS, undefined).code).toBe('overview');
    expect(resolveTab(TABS, '').code).toBe('overview');
    expect(resolveTab(TABS, 'garbage').code).toBe('overview');
    expect(resolveTab(TABS, 'paid').code).toBe('overview'); // an old ?status= value is not a tab
    expect(resolveTab(TABS, 'DRAFTS').code).toBe('overview'); // case-sensitive
  });

  it('honors the catalog order — the first row is the default, whatever it is', () => {
    const reordered: BillTabType[] = [...TABS].reverse(); // History first, Overview last
    expect(resolveTab(reordered, undefined).code).toBe('history');
    expect(resolveTab(reordered, 'nope').code).toBe('history');
  });

  it('resolves every code the catalog advertises', () => {
    for (const tab of TABS) {
      expect(resolveTab(TABS, tab.code).code).toBe(tab.code);
    }
  });

  it('throws on an empty catalog (a broken deploy, not a user path)', () => {
    expect(() => resolveTab([], undefined)).toThrow();
  });
});

/**
 * statusesForTab is the DB filter behind each tab. The default/Overview tab is
 * unfiltered (empty group); the others roll up the product's buckets exactly.
 */
describe('statusesForTab', () => {
  const byCode = (code: string) => resolveTab(TABS, code);

  it('returns an empty group for the default tab (unfiltered)', () => {
    expect(statusesForTab(byCode('overview'))).toEqual([]);
  });

  it('groups drafts as draft + missing_info', () => {
    expect(statusesForTab(byCode('drafts'))).toEqual(['draft', 'missing_info']);
  });

  it('groups for_payment as approved + scheduled + partially_paid', () => {
    expect(statusesForTab(byCode('for_payment'))).toEqual([
      'approved',
      'scheduled',
      'partially_paid',
    ]);
  });

  it('maps for_approval and history to their single states', () => {
    expect(statusesForTab(byCode('for_approval'))).toEqual(['awaiting_approval']);
    expect(statusesForTab(byCode('history'))).toEqual(['paid']);
  });
});

/**
 * countForTab rolls the nine per-status counts up into a tab badge. The
 * default/Overview tab (empty group) is the grand total, including the
 * rejected/archived tail no tab shows; the rest sum only their group.
 */
describe('countForTab', () => {
  const byCode = (code: string) => resolveTab(TABS, code);
  const counts: Partial<Record<BillStatusType, number>> = {
    draft: 2,
    missing_info: 1,
    awaiting_approval: 3,
    approved: 1,
    scheduled: 2,
    partially_paid: 1,
    paid: 4,
    rejected: 1,
    archived: 1,
  };

  it('sums a group', () => {
    expect(countForTab(byCode('drafts'), counts)).toBe(3); // 2 + 1
    expect(countForTab(byCode('for_payment'), counts)).toBe(4); // 1 + 2 + 1
    expect(countForTab(byCode('for_approval'), counts)).toBe(3);
    expect(countForTab(byCode('history'), counts)).toBe(4);
  });

  it('the default tab totals every state, including rejected/archived', () => {
    expect(countForTab(byCode('overview'), counts)).toBe(16); // sum of all nine
  });

  it('treats a missing state as zero', () => {
    expect(countForTab(byCode('drafts'), {})).toBe(0);
    expect(countForTab(byCode('overview'), {})).toBe(0);
  });
});
