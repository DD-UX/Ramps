'use client';

import type { BillTabType } from '@ramps/schemas/bill-tabs';
import { Tabs } from '@ramps/ui/Tabs';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * BillsTabs — the category tabs over the Bill Pay table, driven by the
 * `bill_tabs` lookup (Overview | Drafts | For approval | For payment | History,
 * or whatever the catalog says — the list is DATA, passed in as `tabs`).
 *
 * The active tab is the URL's `?tab=` param (a tab `code`), not React state: the
 * page is a Server Component that re-queries per tab (ANALYSIS §1 — the IA
 * mirrors the state machine, rolled up to the product's buckets), so switching
 * tabs is a navigation, not a client fetch. This keeps the single Zod gate (the
 * facade parse) as the only validation boundary and the URL shareable.
 *
 * `count` badges come from the server (per-status counts rolled up per tab) so
 * each tab shows how many bills sit in that category without a second round-trip.
 */
export interface BillsTabsProps {
  /** The tab catalog from the `bill_tabs` lookup, in display order. */
  tabs: BillTabType[];
  /** The active tab's `code` ('overview' when unfiltered). */
  activeCode: string;
  /** Per-tab row counts, keyed by tab `code`, for the count badges. */
  counts?: Record<string, number>;
}

export function BillsTabs({ tabs, activeCode, counts }: BillsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // The default tab is the first row (the catalog's own order) — no hardcoded
  // slug. Switching to it drops the param rather than writing ?tab=<default>.
  const defaultCode = tabs[0]?.code;

  const onValueChange = useCallback(
    (next: string) => {
      const href = next === defaultCode ? pathname : `${pathname}?tab=${encodeURIComponent(next)}`;
      router.push(href);
    },
    [router, pathname, defaultCode],
  );

  const tabItems = tabs.map((tab) => ({
    value: tab.code,
    label: tab.name,
    count: counts?.[tab.code],
  }));

  return <Tabs tabs={tabItems} value={activeCode} onValueChange={onValueChange} />;
}
