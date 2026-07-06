import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

import { buildTabCounts } from '../helpers/bill-tabs.helpers';
import { BillsTable } from './BillsTable';
import { BillsTabs } from './BillsTabs';
import { BillsToolbar } from './BillsToolbar';

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
  activeCode: BillTabType['code'];
  /** Per-state counts from the server, rolled up here into per-tab badges. */
  countsByStatus: Partial<Record<BillStatusType, number>>;
  /** The `?q=` term the page loaded with — seeds the toolbar's search field. */
  search: BillListItemType['invoice_number'];
}

export function BillsPageContent({
  bills,
  total,
  tabs,
  activeCode,
  countsByStatus,
  search,
}: BillsPageContentProps) {
  // Roll the per-status counts up into each tab's badge, keyed by tab code.
  const tabCounts = buildTabCounts(tabs, countsByStatus);

  return (
    <div className="bg-white flex flex-1 flex-col">
      <div className="px-rui-6 pt-rui-6">
        <h2 className="font-heading text-2xl text-ink">Bill Pay</h2>
        <BillsTabs tabs={tabs} activeCode={activeCode} counts={tabCounts} />
      </div>
      <BillsToolbar initialSearch={search} />
      <BillsTable bills={bills} total={total} />
    </div>
  );
}
