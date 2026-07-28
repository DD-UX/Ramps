'use client';

import { CommonUrlTabs } from '@/features/common/components/CommonUrlTabs';

import type { VendorTab } from '../constants/vendor-tabs.constants';
import { tabHref } from '../helpers/vendor-tabs.helpers';

/**
 * VendorsTabs — the workflow tabs over the vendor table. Same contract as
 * {@link BillsTabs}: the active tab is `?tab=`, so switching is a navigation
 * with an optimistic highlight — the shared choreography lives in
 * {@link CommonUrlTabs}. What's vendors' here is the constant catalog type and
 * its own `tabHref` rule; no count badges — the workflow tabs are empty by
 * design, so the design shows no counts (unlike Bill Pay's populated tabs).
 */
export interface VendorsTabsProps {
  tabs: readonly VendorTab[];
  activeCode: VendorTab['code'];
}

export function VendorsTabs({ tabs, activeCode }: VendorsTabsProps) {
  return <CommonUrlTabs tabs={tabs} activeCode={activeCode} tabHref={tabHref} />;
}
