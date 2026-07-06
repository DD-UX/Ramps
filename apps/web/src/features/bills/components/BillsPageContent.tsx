import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

import { countForTab } from '../constants/status-tabs.constants';
import { BillsTable } from './BillsTable';
import { BillsTabs } from './BillsTabs';

/**
 * BillsPageContent — the Bill Pay surface: the category tabs over the table.
 *
 * Pure presentation. The Server Component page does the data work (the validated
 * `bill_tabs` catalog, `listBills` + `countBillsByStatus`) and hands the results
 * down; this rolls the per-status counts up into each tab's badge (keyed by the
 * tab `code`) and splits the surface into the tab bar and the table so the page
 * file stays a thin data loader. Server Component itself — only the interactive
 * leaves (`BillsTabs`, `BillsTable`) cross the client boundary.
 */
export interface BillsPageContentProps {
  bills: BillListItemType[];
  total: number;
  /** The tab catalog from the `bill_tabs` lookup, in display order. */
  tabs: BillTabType[];
  /** The active tab's `code` ('overview' when unfiltered). */
  activeCode: string;
  /** Per-state counts from the server, rolled up here into per-tab badges. */
  countsByStatus: Partial<Record<BillStatusType, number>>;
}

export function BillsPageContent({
  bills,
  total,
  tabs,
  activeCode,
  countsByStatus,
}: BillsPageContentProps) {
  // Roll the per-status counts up into each tab's badge, keyed by tab code.
  const tabCounts: Record<string, number> = Object.fromEntries(
    tabs.map((tab) => [tab.code, countForTab(tab, countsByStatus)]),
  );

  return (
    <div className="gap-rui-4 bg-white p-rui-6 flex flex-1 flex-col">
      <h2 className="font-heading text-2xl text-ink">Bill Pay</h2>
      <BillsTabs tabs={tabs} activeCode={activeCode} counts={tabCounts} />
      <BillsTable bills={bills} total={total} />
    </div>
  );
}
