'use client';

import type { VendorListItemType } from '@ramps/schemas/vendors';
import { Button } from '@ramps/ui/Button';
import { IconButton } from '@ramps/ui/IconButton';
import { ChevronDown, Download, Filter, Layout, Search } from '@ramps/ui/icons';
import { Input } from '@ramps/ui/Input';

import { useDebouncedSearchNavigation } from '@/features/common/hooks/useDebouncedSearchNavigation';

/**
 * VendorsToolbar — the control strip over the vendor table.
 *
 * The search shares Bill Pay's exact contract, and now literally shares its
 * implementation: `useDebouncedSearchNavigation` owns the pause, the URL math
 * and the shared transition. The rest of the strip is disabled fidelity, and is
 * intentionally still its own copy — it stands in for vendor filters, which are
 * not Bill Pay's filters.
 */
export interface VendorsToolbarProps {
  initialSearch: VendorListItemType['name'] | null;
}

export function VendorsToolbar({ initialSearch }: VendorsToolbarProps) {
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
          placeholder="Search or filter…"
          aria-label="Search vendors"
          leadingIcon={<Search size={16} />}
          className="h-full w-[20rem]"
        />
      </div>

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
