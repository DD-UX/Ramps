import { CommonListPageSkeleton } from '@/features/common/components/CommonListPageSkeleton';
import { VENDOR_TABS } from '@/features/vendors/constants/vendor-tabs.constants';

/**
 * The Vendors loading boundary — the sibling of Bill Pay's, same reasoning.
 * Covers arriving at /vendors; tab and search changes are covered by the shared
 * transition's activity rail instead (see `UrlNavigation.context`).
 *
 * The vendor tab catalog is a code constant, so the placeholder count is taken
 * from it directly and can never drift.
 */
export default function VendorsLoading() {
  return (
    <CommonListPageSkeleton
      title="Vendors"
      tabCount={VENDOR_TABS.length}
      rowCount={10}
      columns={[
        { header: 'Vendor', width: 'minmax(240px, 1fr)', cellWidth: 'w-40' },
        { header: 'Owner', width: '200px', cellWidth: 'w-28' },
        { header: 'Total spend', width: '160px', align: 'right', cellWidth: 'w-20' },
        { header: 'Payment method', width: '180px', cellWidth: 'w-28' },
        { header: 'Status', width: '160px', cellWidth: 'w-24' },
        { header: '', width: '56px', cellWidth: 'w-4' },
      ]}
    />
  );
}
