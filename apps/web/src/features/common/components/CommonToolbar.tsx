'use client';

import { Button } from '@ramps/ui/Button';
import { IconButton } from '@ramps/ui/IconButton';
import { ChevronDown, Download, Filter, Layout, Search } from '@ramps/ui/icons';
import { Input } from '@ramps/ui/Input';
import type { ReactNode } from 'react';

import { useDebouncedSearchNavigation } from '../hooks/useDebouncedSearchNavigation';

/**
 * CommonToolbar — the control strip between a list page's tabs and its table,
 * shared by Bill Pay and Vendors.
 *
 * Only the search is real. It's a URL-state control like the tabs: typing
 * debounces a `?q=` param onto the URL (preserving `?tab=`), which re-runs the
 * Server Component's list query — so the filter is shareable and survives a
 * reload, and there's no client-side fetch or second Zod gate.
 * `useDebouncedSearchNavigation` owns the keystrokes, the pause and the
 * navigation; `initialSearch` seeds the field so a shared `?q=` link lands
 * populated.
 *
 * The rest of the strip (Status, column filter, export, Options) is present
 * for fidelity but **disabled** — honest mocks, not dead buttons dressed up as
 * live ones. Both features render the identical cluster today, so it lives
 * here ONCE; the day either grows a real filter, the control graduates out of
 * this shell into that feature (the same way a per-feature extra arrives now:
 * through `children`, rendered between the search and the right-aligned
 * cluster — Bill Pay's date-range button, for instance).
 */
export interface CommonToolbarProps {
  /** The `?q=` value the page loaded with — seeds the search field. */
  initialSearch: string | null;
  /** Entity-flavoured hint text for the search field. */
  searchPlaceholder: string;
  /** Accessible name for the search field ("Search bills", "Search vendors"). */
  searchLabel: string;
  /** Per-feature extras, rendered after the search, before the spacer. */
  children?: ReactNode;
}

export function CommonToolbar({
  initialSearch,
  searchPlaceholder,
  searchLabel,
  children,
}: CommonToolbarProps) {
  // Debounce, URL math and the shared transition all live in the hook.
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
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          leadingIcon={<Search size={16} />}
          className="h-full w-[20rem]"
        />
      </div>
      {children}

      {/* Move the next elements to the right */}
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
