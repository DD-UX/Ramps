import type { VendorStatusType } from '@ramps/schemas/vendors';
import { describe, expect, it } from 'vitest';

import type { VendorTab } from '../constants/vendor-tabs.constants';
import {
  buildTabCounts,
  countForTab,
  resolveTab,
  statusesForTab,
  tabHref,
} from './vendor-tabs.helpers';

/**
 * The vendor tab bar is a constant (unlike bills' DB catalog), but the helpers
 * still operate on rows, not a hardcoded list — the fixture mirrors the
 * VENDOR_TABS shape (All first/unfiltered; Active/Inactive rolling up their
 * single state). The default is the FIRST row by order.
 */
const TABS: VendorTab[] = [
  { code: 'all', name: 'All', statuses: [] },
  { code: 'active', name: 'Active', statuses: ['active'] },
  { code: 'inactive', name: 'Inactive', statuses: ['inactive'] },
];

describe('resolveTab', () => {
  it('resolves a real tab code to its row', () => {
    expect(resolveTab(TABS, 'active').code).toBe('active');
    expect(resolveTab(TABS, 'inactive').code).toBe('inactive');
  });

  it('falls back to the first tab for missing / unknown / stale codes', () => {
    expect(resolveTab(TABS, undefined).code).toBe('all');
    expect(resolveTab(TABS, '').code).toBe('all');
    expect(resolveTab(TABS, 'garbage').code).toBe('all');
    expect(resolveTab(TABS, 'ACTIVE').code).toBe('all'); // case-sensitive
  });

  it('honors the catalog order — the first row is the default, whatever it is', () => {
    const reordered: VendorTab[] = [...TABS].reverse(); // Inactive first
    expect(resolveTab(reordered, undefined).code).toBe('inactive');
    expect(resolveTab(reordered, 'nope').code).toBe('inactive');
  });

  it('throws on an empty catalog (a broken build, not a user path)', () => {
    expect(() => resolveTab([], undefined)).toThrow();
  });
});

describe('statusesForTab', () => {
  const byCode = (code: string) => resolveTab(TABS, code);

  it('returns an empty group for the default tab (unfiltered)', () => {
    expect(statusesForTab(byCode('all'))).toEqual([]);
  });

  it('maps active and inactive to their single states', () => {
    expect(statusesForTab(byCode('active'))).toEqual(['active']);
    expect(statusesForTab(byCode('inactive'))).toEqual(['inactive']);
  });
});

describe('countForTab', () => {
  const byCode = (code: string) => resolveTab(TABS, code);
  const counts: Partial<Record<VendorStatusType, number>> = { active: 4, inactive: 1 };

  it('sums a group', () => {
    expect(countForTab(byCode('active'), counts)).toBe(4);
    expect(countForTab(byCode('inactive'), counts)).toBe(1);
  });

  it('the default tab totals every state', () => {
    expect(countForTab(byCode('all'), counts)).toBe(5);
  });

  it('treats a missing state as zero', () => {
    expect(countForTab(byCode('active'), {})).toBe(0);
    expect(countForTab(byCode('all'), {})).toBe(0);
  });
});

describe('buildTabCounts', () => {
  const counts: Partial<Record<VendorStatusType, number>> = { active: 4, inactive: 1 };

  it('produces one entry per tab, keyed by code', () => {
    const result = buildTabCounts(TABS, counts);
    expect(Object.keys(result)).toEqual(['all', 'active', 'inactive']);
  });

  it('matches countForTab for every tab (all = grand total)', () => {
    const result = buildTabCounts(TABS, counts);
    expect(result.all).toBe(5);
    expect(result.active).toBe(4);
    expect(result.inactive).toBe(1);
  });

  it('is all zeros when no counts are supplied', () => {
    expect(Object.values(buildTabCounts(TABS, {}))).toEqual([0, 0, 0]);
  });
});

describe('tabHref', () => {
  it('drops the param when selecting the default (first) tab', () => {
    expect(tabHref('/vendors', 'all', 'all')).toBe('/vendors');
  });

  it('writes ?tab=<code> for a non-default tab', () => {
    expect(tabHref('/vendors', 'active', 'all')).toBe('/vendors?tab=active');
    expect(tabHref('/vendors', 'inactive', 'all')).toBe('/vendors?tab=inactive');
  });

  it('never drops the param when there is no default (empty catalog)', () => {
    expect(tabHref('/vendors', 'active', undefined)).toBe('/vendors?tab=active');
  });
});
