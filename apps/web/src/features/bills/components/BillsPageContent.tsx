import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';

import { BillsTable } from './BillsTable';
import { BillsTabs } from './BillsTabs';

/**
 * BillsPageContent — the Bill Pay surface: lifecycle tabs over the table.
 *
 * Pure presentation. The Server Component page does the data work (validated
 * `listBills` + `countBillsByStatus`) and hands the results down; this splits
 * them into the tab bar and the table so the page file stays a thin data
 * loader. Server Component itself — only the interactive leaves (`BillsTabs`,
 * `BillsTable`) cross the client boundary.
 */
export interface BillsPageContentProps {
  bills: BillListItemType[];
  total: number;
  /** Active `?status=` value ('all' when unfiltered). */
  activeStatus: string;
  /** Per-state counts for the tab badges. */
  countsByStatus: Partial<Record<BillStatusType, number>>;
}

export function BillsPageContent({
  bills,
  total,
  activeStatus,
  countsByStatus,
}: BillsPageContentProps) {
  // The "All" badge is the sum of every state; the rest map straight through.
  const allCount = Object.values(countsByStatus).reduce((sum, n) => sum + (n ?? 0), 0);
  const tabCounts: Record<string, number> = { all: allCount, ...countsByStatus };

  return (
    <div className="gap-rui-4 bg-white p-rui-6 flex flex-1 flex-col">
      <h2 className="font-heading text-2xl text-ink">Bill Pay</h2>
      <BillsTabs value={activeStatus} counts={tabCounts} />
      <BillsTable bills={bills} total={total} />
    </div>
  );
}
