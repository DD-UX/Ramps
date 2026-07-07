import type { VendorListItemType } from '@ramps/schemas/vendors';

import type { VendorTab } from '../constants/vendor-tabs.constants';
import { VendorsTable } from './VendorsTable';
import { VendorsTabs } from './VendorsTabs';
import { VendorsToolbar } from './VendorsToolbar';

export interface VendorsPageContentProps {
  vendors: VendorListItemType[];
  total: number;
  tabs: readonly VendorTab[];
  activeCode: VendorTab['code'];
  search: VendorListItemType['name'] | null;
}

export function VendorsPageContent({
  vendors,
  total,
  tabs,
  activeCode,
  search,
}: VendorsPageContentProps) {
  return (
    <div className="bg-white flex flex-1 flex-col">
      <div className="pt-rui-6">
        <h2 className="font-heading text-2xl text-ink px-rui-6">Vendors</h2>
        <VendorsTabs tabs={tabs} activeCode={activeCode} />
      </div>
      <VendorsToolbar initialSearch={search} />
      <VendorsTable vendors={vendors} total={total} />
    </div>
  );
}
