'use client';

import type { BillListItemType } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { IconButton } from '@ramps/ui/IconButton';
import { CalendarRange, ChevronDown, Download, Filter, Layout, Search } from '@ramps/ui/icons';
import { Input } from '@ramps/ui/Input';

import { useDebouncedSearchNavigation } from '@/features/common/hooks/useDebouncedSearchNavigation';

/**
 * BillsToolbar — the control strip between the tabs and the table
 * (…/snapshots/04-processing-invoice-skeleton-row.jpeg).
 *
 * Only the search is real. It's a URL-state control like the tabs: typing
 * debounces a `?q=` param onto the URL (preserving `?tab=`), which re-runs the
 * Server Component's `listBills({ search })` — so the filter is shareable and
 * survives a reload, and there's no client-side fetch or second Zod gate. The
 * rest of the strip (Filter, Status, calendar, download, Options) is present for
 * fidelity but **disabled** — they're honest mocks, not dead buttons dressed up
 * as live ones (a disabled control reads as "not yet", not "broken").
 *
 * The initial value comes from the URL (`initialSearch`) so a shared `?q=` link
 * lands with the field populated; from there `useDebouncedSearchNavigation`
 * owns the keystrokes, the pause and the navigation.
 *
 * What is NOT shared with the Vendors toolbar: everything below the field. The
 * two disabled clusters are identical today because both trace the same
 * reference frame, but they are placeholders for different filters and will
 * diverge as soon as either is built. Only the search wiring — which has no
 * entity vocabulary in it at all — was worth lifting out.
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
  // Debounce, URL math and the shared transition all live in the hook — see
  // useDebouncedSearchNavigation for why that part is shared and the disabled
  // cluster below deliberately is not.
  const { value, onChange } = useDebouncedSearchNavigation(initialSearch);

  const buttonClassName = 'h-full';

  return (
    <div className="gap-rui-2 px-rui-6 py-rui-2 bg-stone-50 flex">
      <div>
        <Input
          rounded
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Vendor name, INV-XXX, PO number…"
          aria-label="Search bills"
          leadingIcon={<Search size={16} />}
          className="h-full w-[20rem]"
        />
      </div>
      <IconButton
        rounded
        variant="outline"
        label="Filter by date"
        icon={<CalendarRange size={16} />}
        disabled
        className={buttonClassName}
      />

      {/* Move the next elements to the right*/}
      <div className="ml-auto" />

      <Button
        rounded
        variant="secondary"
        leadingIcon={<Filter size={16} />}
        outline
        disabled
        className={buttonClassName}
      >
        Status
      </Button>

      <IconButton
        rounded
        variant="outline"
        label="Filter columns"
        icon={<Layout size={16} />}
        disabled
        className={buttonClassName}
      />
      <IconButton
        rounded
        variant="outline"
        label="Export"
        icon={<Download size={16} />}
        disabled
        className={buttonClassName}
      />
      <Button
        rounded
        variant="secondary"
        trailingIcon={<ChevronDown size={16} />}
        disabled
        outline
        className={buttonClassName}
      >
        Options
      </Button>
    </div>
  );
}
