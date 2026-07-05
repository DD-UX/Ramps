import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

import { BILL_TABS, type BillTabValueType, countForTab } from '../constants/status-tabs.constants';
import { BillsTable } from './BillsTable';
import { BillsTabs } from './BillsTabs';

/**
 * BillsPageContent — the Bill Pay surface: the five category tabs over the table.
 *
 * Pure presentation. The Server Component page does the data work (validated
 * `listBills` + `countBillsByStatus`) and hands the results down; this rolls
 * the per-status counts up into the five tab badges and splits the surface
 * into the tab bar and the table so the page file stays a thin data loader.
 * Server Component itself — only the interactive leaves (`BillsTabs`,
 * `BillsTable`) cross the client boundary.
 */
export interface BillsPageContentProps {
  bills: BillListItemType[];
  total: number;
  /** Active `?tab=` value ('overview' when unfiltered). */
  activeTab: BillTabValueType;
  /** Per-state counts from the server, rolled up here into per-tab badges. */
  countsByStatus: Partial<Record<BillStatusType, number>>;
}

export function BillsPageContent({
  bills,
  total,
  activeTab,
  countsByStatus,
}: BillsPageContentProps) {
  // Roll the nine per-status counts up into the five category badges.
  const tabCounts: Partial<Record<BillTabValueType, number>> = Object.fromEntries(
    BILL_TABS.map((tab) => [tab.value, countForTab(tab.value, countsByStatus)]),
  );

  return (
    <div className="gap-rui-4 bg-white p-rui-6 flex flex-1 flex-col">
      <h2 className="font-heading text-2xl text-ink">Bill Pay</h2>
      <BillsTabs value={activeTab} counts={tabCounts} />
      <BillsTable bills={bills} total={total} />
    </div>
  );
}
