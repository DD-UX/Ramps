'use client';

import { Tabs } from '@ramps/ui/Tabs';
import { useCallback, useOptimistic } from 'react';

import { useUrlNavigation } from '@/features/common/context/UrlNavigation.context';

import type { VendorTab } from '../constants/vendor-tabs.constants';
import { tabHref } from '../helpers/vendor-tabs.helpers';

/**
 * VendorsTabs — the workflow tabs over the vendor table. Same contract as
 * {@link BillsTabs}: the active tab is `?tab=`, so switching is a navigation,
 * and the highlight is optimistic because Next won't commit the new URL until
 * the server render resolves (see UrlNavigation.context for the full note).
 */
export interface VendorsTabsProps {
  tabs: readonly VendorTab[];
  activeCode: VendorTab['code'];
}

export function VendorsTabs({ tabs, activeCode }: VendorsTabsProps) {
  const { navigate, pathname } = useUrlNavigation();
  const [optimisticCode, setOptimisticCode] = useOptimistic(activeCode);

  const defaultCode = tabs[0]?.code;

  const onValueChange = useCallback(
    (next: string) => {
      navigate(tabHref(pathname, next, defaultCode), {
        optimistic: () => setOptimisticCode(next),
      });
    },
    [navigate, pathname, defaultCode, setOptimisticCode],
  );

  // No count badges — the workflow tabs are empty by design, so the design
  // shows no counts (unlike Bill Pay's populated tabs).
  const tabItems = tabs.map((tab) => ({
    value: tab.code,
    label: tab.name,
  }));

  return (
    <Tabs
      tabs={tabItems}
      value={optimisticCode}
      onValueChange={onValueChange}
      className="px-rui-6"
    />
  );
}
