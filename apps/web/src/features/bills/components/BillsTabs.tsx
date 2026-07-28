'use client';

import type { BillTabType } from '@ramps/schemas/bill-tabs';

import { CommonUrlTabs } from '@/features/common/components/CommonUrlTabs';

import { tabHref } from '../helpers/bill-tabs.helpers';

/**
 * BillsTabs — the category tabs over the Bill Pay table, driven by the
 * `bill_tabs` lookup (Overview | Drafts | For approval | For payment | History,
 * or whatever the catalog says — the list is DATA, passed in as `tabs`).
 *
 * The active tab is the URL's `?tab=` param, so switching tabs is a navigation
 * that re-runs the Server Component's per-tab query (ANALYSIS §1 — the IA
 * mirrors the state machine, rolled up to the product's buckets). The
 * optimistic-highlight choreography around that navigation is shared with
 * Vendors and lives in {@link CommonUrlTabs}; what's Bill Pay's here is the
 * catalog type, its own `tabHref` rule, and the `count` badges — per-status
 * counts rolled up per tab on the server, so each tab shows how many bills sit
 * in that category without a second round-trip.
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
  return <CommonUrlTabs tabs={tabs} activeCode={activeCode} counts={counts} tabHref={tabHref} />;
}
