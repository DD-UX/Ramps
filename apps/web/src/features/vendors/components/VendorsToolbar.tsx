'use client';

import type { VendorListItemType } from '@ramps/schemas/vendors';

import { CommonToolbar } from '@/features/common/components/CommonToolbar';

/**
 * VendorsToolbar — the control strip over the vendor table.
 *
 * A thin skin over {@link CommonToolbar}, which owns the strip's whole
 * mechanism: the debounced `?q=` search and the disabled right-hand cluster.
 * All that's vendor-flavoured is the search vocabulary; unlike Bill Pay there
 * are no per-page extras, so the slot stays empty.
 */
export interface VendorsToolbarProps {
  initialSearch: VendorListItemType['name'] | null;
}

export function VendorsToolbar({ initialSearch }: VendorsToolbarProps) {
  return (
    <CommonToolbar
      initialSearch={initialSearch}
      searchPlaceholder="Search or filter…"
      searchLabel="Search vendors"
    />
  );
}
