'use client';

import { Tabs } from '@ramps/ui/Tabs';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { BILL_STATUS_TABS } from '../constants/status-tabs.constants';

/**
 * BillsTabs — the lifecycle tab bar over the Bill Pay table.
 *
 * The active tab is the URL's `?status=` param, not React state: the page is a
 * Server Component that re-queries per status (ANALYSIS §1 — the IA mirrors the
 * state machine), so switching tabs is a navigation, not a client fetch. This
 * keeps the single Zod gate (the facade parse) as the only validation boundary
 * and the URL shareable/bookmarkable.
 *
 * `count` badges come from the server so each tab shows how many bills sit in
 * that state without a second round-trip.
 */
export interface BillsTabsProps {
  /** Active `?status=` value ('all' when unfiltered). */
  value: string;
  /** Per-status row counts, keyed by tab value, for the count badges. */
  counts?: Partial<Record<string, number>>;
}

export function BillsTabs({ value, counts }: BillsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const onValueChange = useCallback(
    (next: string) => {
      // 'all' is the unfiltered view — drop the param rather than write ?status=all.
      const href = next === 'all' ? pathname : `${pathname}?status=${encodeURIComponent(next)}`;
      router.push(href);
    },
    [router, pathname],
  );

  const tabs = BILL_STATUS_TABS.map((tab) => ({
    value: tab.value,
    label: tab.label,
    count: counts?.[tab.value],
  }));

  return <Tabs tabs={tabs} value={value} onValueChange={onValueChange} />;
}
