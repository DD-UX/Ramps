import type { VendorListItemType, VendorStatusType } from '@ramps/schemas/vendors';

import type { VendorTab } from '../constants/vendor-tabs.constants';
import { buildTabCounts } from '../helpers/vendor-tabs.helpers';
import { VendorsTable } from './VendorsTable';
import { VendorsTabs } from './VendorsTabs';
import { VendorsToolbar } from './VendorsToolbar';

export interface VendorsPageContentProps {
  vendors: VendorListItemType[];
  total: number;
  tabs: readonly VendorTab[];
  activeCode: VendorTab['code'];
  countsByStatus: Partial<Record<VendorStatusType, number>>;
  search: VendorListItemType['name'] | null;
}

export function VendorsPageContent({
  vendors,
  total,
  tabs,
  activeCode,
  countsByStatus,
  search,
}: VendorsPageContentProps) {
  const tabCounts = buildTabCounts(tabs, countsByStatus);

  return (
    <div className="bg-white flex flex-1 flex-col">
      <div className="pt-rui-6">
        <h2 className="font-heading text-2xl text-ink px-rui-6">Vendors</h2>
        <VendorsTabs tabs={tabs} activeCode={activeCode} counts={tabCounts} />
      </div>
      <VendorsToolbar initialSearch={search} />
      <VendorsTable vendors={vendors} total={total} />
    </div>
  );
}
