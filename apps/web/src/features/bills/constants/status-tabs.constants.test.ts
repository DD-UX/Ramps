import type { BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import { BILL_TABS, countForTab, parseTabParam, statusesForTab } from './status-tabs.constants';

/**
 * parseTabParam hardens the `?tab=` query param before it selects a category.
 * Anything that isn't one of the five tabs must fall back to Overview so a
 * hand-typed URL (or a stale `?status=` link) can never 500.
 */
describe('parseTabParam', () => {
  it('passes a real tab value through', () => {
    expect(parseTabParam('drafts')).toBe('drafts');
    expect(parseTabParam('for_payment')).toBe('for_payment');
    expect(parseTabParam('history')).toBe('history');
  });

  it('falls back to overview for missing / unknown / stale values', () => {
    expect(parseTabParam(undefined)).toBe('overview');
    expect(parseTabParam('')).toBe('overview');
    expect(parseTabParam('garbage')).toBe('overview');
    expect(parseTabParam('paid')).toBe('overview'); // an old ?status= value is not a tab
    expect(parseTabParam('DRAFTS')).toBe('overview'); // case-sensitive
  });

  it('accepts every tab value it advertises', () => {
    for (const tab of BILL_TABS) {
      expect(parseTabParam(tab.value)).toBe(tab.value);
    }
  });
});

/**
 * statusesForTab is the DB filter behind each tab. Overview is unfiltered
 * (empty group); the others roll up the product's buckets exactly.
 */
describe('statusesForTab', () => {
  it('returns an empty group for overview (unfiltered)', () => {
    expect(statusesForTab('overview')).toEqual([]);
  });

  it('groups drafts as draft + missing_info', () => {
    expect(statusesForTab('drafts')).toEqual(['draft', 'missing_info']);
  });

  it('groups for_payment as approved + scheduled + partially_paid', () => {
    expect(statusesForTab('for_payment')).toEqual(['approved', 'scheduled', 'partially_paid']);
  });

  it('maps for_approval and history to their single states', () => {
    expect(statusesForTab('for_approval')).toEqual(['awaiting_approval']);
    expect(statusesForTab('history')).toEqual(['paid']);
  });
});

/**
 * countForTab rolls the nine per-status counts up into a tab badge. Overview
 * is the grand total (including the rejected/archived tail no tab shows); the
 * rest sum only their group.
 */
describe('countForTab', () => {
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
    expect(countForTab('drafts', counts)).toBe(3); // 2 + 1
    expect(countForTab('for_payment', counts)).toBe(4); // 1 + 2 + 1
    expect(countForTab('for_approval', counts)).toBe(3);
    expect(countForTab('history', counts)).toBe(4);
  });

  it('overview totals every state, including rejected/archived', () => {
    expect(countForTab('overview', counts)).toBe(16); // sum of all nine
  });

  it('treats a missing state as zero', () => {
    expect(countForTab('drafts', {})).toBe(0);
    expect(countForTab('overview', {})).toBe(0);
  });
});
