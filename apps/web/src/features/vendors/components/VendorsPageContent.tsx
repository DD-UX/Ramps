import type { VendorListItemType } from '@ramps/schemas/vendors';

import { CommonUrlNavigationProgress } from '@/features/common/components/CommonUrlNavigationProgress';
import { UrlNavigationProvider } from '@/features/common/context/UrlNavigation.context';

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
      {/* Same shared transition as Bill Pay — the tabs and the search field
          navigate through one `startTransition`, and the rail under the filter
          strip reports it. See UrlNavigation.context for why this can't just be
          `loading.tsx`. */}
      <UrlNavigationProvider>
        <div className="pt-rui-6">
          <h2 className="font-heading text-3xl text-ink px-rui-6">Vendors</h2>
          <VendorsTabs tabs={tabs} activeCode={activeCode} />
        </div>
        <VendorsToolbar initialSearch={search} />
        <CommonUrlNavigationProgress />
        <VendorsTable vendors={vendors} total={total} />
      </UrlNavigationProvider>
    </div>
  );
}
