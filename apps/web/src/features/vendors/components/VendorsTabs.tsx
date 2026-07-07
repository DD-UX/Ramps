'use client';

import { Tabs } from '@ramps/ui/Tabs';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import type { VendorTab } from '../constants/vendor-tabs.constants';
import { tabHref } from '../helpers/vendor-tabs.helpers';

export interface VendorsTabsProps {
  tabs: readonly VendorTab[];
  activeCode: VendorTab['code'];
}

export function VendorsTabs({ tabs, activeCode }: VendorsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const defaultCode = tabs[0]?.code;

  const onValueChange = useCallback(
    (next: string) => {
      router.push(tabHref(pathname, next, defaultCode));
    },
    [router, pathname, defaultCode],
  );

  // No count badges — the workflow tabs are empty by design, so the design
  // shows no counts (unlike Bill Pay's populated tabs).
  const tabItems = tabs.map((tab) => ({
    value: tab.code,
    label: tab.name,
  }));

  return (
    <Tabs tabs={tabItems} value={activeCode} onValueChange={onValueChange} className="px-rui-6" />
  );
}
