'use client';

import type { BillListItemType } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { IconButton } from '@ramps/ui/IconButton';
import { CalendarRange, ChevronDown, Download, Filter, Layout, Search } from '@ramps/ui/icons';
import { Input } from '@ramps/ui/Input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { buildSearchQuery } from '../helpers/search-query.helpers';

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
 * lands with the field populated; local state then owns the keystrokes and the
 * debounce owns the navigation.
 */
export interface BillsToolbarProps {
  /**
   * The `?q=` value the page loaded with — seeds the field so a shared search
   * link renders populated. Typed off the entity's own text column (the search
   * matches invoice_number et al.) rather than a bare string.
   */
  initialSearch: BillListItemType['invoice_number'];
}

/** How long to wait after the last keystroke before navigating (ms). */
const SEARCH_DEBOUNCE_MS = 300;

export function BillsToolbar({ initialSearch }: BillsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(initialSearch ?? '');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buttonClassName = 'h-full';

  // Push `?q=` (trimmed; dropped when empty) while preserving every other param
  // — notably `?tab=` — so searching never clears the active tab. The URL math
  // lives in buildSearchQuery so it's unit-tested without a DOM.
  const commit = useCallback(
    (next: string) => {
      const query = buildSearchQuery(searchParams.toString(), next);
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams],
  );

  // Debounce the navigation: every keystroke resets the timer, so we route once
  // the user pauses rather than on each character.
  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const onChange = useCallback(
    (next: string) => {
      setValue(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => commit(next), SEARCH_DEBOUNCE_MS);
    },
    [commit],
  );

  return (
    <div className="gap-rui-2 px-rui-6 py-rui-2 bg-stone-50 flex">
      <div className="max-w-50">
        <Input
          rounded
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search or filter…"
          aria-label="Search bills"
          leadingIcon={<Search size={16} />}
          className="max-w-xs h-full grow-0"
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
