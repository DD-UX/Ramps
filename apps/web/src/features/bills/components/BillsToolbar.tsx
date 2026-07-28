'use client';

import type { BillListItemType } from '@ramps/schemas/bills';
import { IconButton } from '@ramps/ui/IconButton';
import { CalendarRange } from '@ramps/ui/icons';

import { CommonToolbar } from '@/features/common/components/CommonToolbar';

/**
 * BillsToolbar — the control strip between the tabs and the table
 * (…/snapshots/04-processing-invoice-skeleton-row.jpeg).
 *
 * A thin skin over {@link CommonToolbar}, which owns the strip's whole
 * mechanism: the debounced `?q=` search (the only live control) and the
 * disabled right-hand cluster. What's Bill Pay's here is the vocabulary — the
 * placeholder and label — and the one extra control the reference shows on
 * this page only: the disabled date-range filter, slotted in between the
 * search and the cluster.
 */
export interface BillsToolbarProps {
  /**
   * The `?q=` value the page loaded with — seeds the field so a shared search
   * link renders populated. Typed off the entity's own text column (the search
   * matches invoice_number et al.) rather than a bare string.
   */
  initialSearch: BillListItemType['invoice_number'];
}

export function BillsToolbar({ initialSearch }: BillsToolbarProps) {
  return (
    <CommonToolbar
      initialSearch={initialSearch}
      searchPlaceholder="Vendor name, INV-XXX, PO number…"
      searchLabel="Search bills"
    >
      <IconButton
        rounded
        variant="outline"
        label="Filter by date"
        icon={<CalendarRange size={16} />}
        disabled
        className="h-full"
      />
    </CommonToolbar>
  );
}
