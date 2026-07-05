'use client';

import { Tabs } from '@ramps/ui/Tabs';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { BILL_TABS, type BillTabValueType } from '../constants/status-tabs.constants';

/**
 * BillsTabs — the five category tabs over the Bill Pay table
 * (Overview | Drafts | For approval | For payment | History).
 *
 * The active tab is the URL's `?tab=` param, not React state: the page is a
 * Server Component that re-queries per tab (ANALYSIS §1 — the IA mirrors the
 * state machine, rolled up to the product's buckets), so switching tabs is a
 * navigation, not a client fetch. This keeps the single Zod gate (the facade
 * parse) as the only validation boundary and the URL shareable/bookmarkable.
 *
 * `count` badges come from the server (per-status counts rolled up per tab) so
 * each tab shows how many bills sit in that category without a second round-trip.
 */
export interface BillsTabsProps {
  /** Active `?tab=` value ('overview' when unfiltered). */
  value: BillTabValueType;
  /** Per-tab row counts, keyed by tab value, for the count badges. */
  counts?: Partial<Record<BillTabValueType, number>>;
}

export function BillsTabs({ value, counts }: BillsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const onValueChange = useCallback(
    (next: string) => {
      // 'overview' is the unfiltered view — drop the param rather than ?tab=overview.
      const href = next === 'overview' ? pathname : `${pathname}?tab=${encodeURIComponent(next)}`;
      router.push(href);
    },
    [router, pathname],
  );

  const tabs = BILL_TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
    count: counts?.[tab.value],
  }));

  return <Tabs tabs={tabs} value={value} onValueChange={onValueChange} />;
}
