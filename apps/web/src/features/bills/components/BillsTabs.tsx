'use client';

import type { BillTabType } from '@ramps/schemas/bill-tabs';
import { Tabs } from '@ramps/ui/Tabs';
import { useCallback, useOptimistic } from 'react';

import { useUrlNavigation } from '@/features/common/context/UrlNavigation.context';

import { tabHref } from '../helpers/bill-tabs.helpers';

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
 * ## Why the highlight is optimistic
 *
 * Deriving the active tab from the URL has one nasty consequence: Next does not
 * commit the new URL until the server render RESOLVES, so a plain
 * `router.push` leaves the clicked tab un-highlighted for the whole round trip.
 * The bar looked frozen — the click appeared to do nothing.
 *
 * `useOptimistic` splits those two facts apart. The tab you clicked becomes
 * active immediately (the underline glides on the same frame as the press),
 * while `?tab=` remains the source of truth underneath. When the navigation
 * commits, the optimistic value is dropped and the prop takes over — the value
 * is identical, so nothing moves. If the navigation FAILS, React discards the
 * optimistic value and the bar snaps back to the tab that is genuinely open,
 * which is the honest outcome: we never leave a tab highlighted for a list that
 * isn't showing.
 *
 * The setter must run inside a transition, which is why navigation goes through
 * {@link useUrlNavigation} rather than `router.push` directly — the same
 * transition also raises the activity rail beneath the toolbar.
 *
 * `count` badges come from the server (per-status counts rolled up per tab) so
 * each tab shows how many bills sit in that category without a second round-trip.
 */
export interface BillsTabsProps {
  /** The tab catalog from the `bill_tabs` lookup, in display order. */
  tabs: BillTabType[];
  /** The active tab's `code` ('overview' when unfiltered). */
  activeCode: BillTabType['code'];
  /** Per-tab row counts, keyed by tab `code`, for the count badges. */
  counts?: Record<BillTabType['code'], number>;
}

export function BillsTabs({ tabs, activeCode, counts }: BillsTabsProps) {
  const { navigate, pathname } = useUrlNavigation();

  // Seeded from the URL-derived prop; runs ahead of it only while a tab
  // navigation is in flight.
  const [optimisticCode, setOptimisticCode] = useOptimistic(activeCode);

  // The default tab is the first row (the catalog's own order) — no hardcoded
  // slug. Switching to it drops the param rather than writing ?tab=<default>.
  const defaultCode = tabs[0]?.code;

  const onValueChange = useCallback(
    (next: string) => {
      navigate(tabHref(pathname, next, defaultCode), {
        optimistic: () => setOptimisticCode(next),
      });
    },
    [navigate, pathname, defaultCode, setOptimisticCode],
  );

  const tabItems = tabs.map((tab) => ({
    value: tab.code,
    label: tab.name,
    count: counts?.[tab.code],
  }));

  return (
    <Tabs
      tabs={tabItems}
      value={optimisticCode}
      onValueChange={onValueChange}
      className="px-rui-6"
    />
  );
}
