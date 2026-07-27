import { BILLS_PAGE_SIZE } from '@ramps/sdk/bills';

import { CommonListPageSkeleton } from '@/features/common/components/CommonListPageSkeleton';

/**
 * The Bill Pay loading boundary — what shows while `BillsPage` runs its three
 * queries (the tab catalog, the per-status counts, the windowed list).
 *
 * Scope note: this covers arriving AT /bills — the nav click, a hard reload, a
 * shared link. It does NOT cover switching a tab, searching or paging, because
 * those change only search params and Next does not remount the segment for
 * that (vercel/next.js#53543). Those are handled by the shared transition and
 * the activity rail — see `UrlNavigation.context`.
 *
 * `rowCount` is the real page size so the pagination band lands exactly where
 * the skeleton drew it.
 */
export default function BillsLoading() {
  return (
    <CommonListPageSkeleton
      title="Bill Pay"
      tabCount={5}
      rowCount={BILLS_PAGE_SIZE}
      selectable
      columns={[
        { header: 'Vendor', width: 'minmax(220px, 1fr)', cellWidth: 'w-40' },
        { header: 'Invoice #', width: '160px', cellWidth: 'w-24' },
        { header: 'Due date', width: '140px', cellWidth: 'w-20' },
        { header: 'Status', width: '180px', cellWidth: 'w-24' },
        { header: 'Amount', width: '160px', align: 'right', cellWidth: 'w-20' },
        { header: '', width: '64px', align: 'right', cellWidth: 'w-4' },
      ]}
    />
  );
}
