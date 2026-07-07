'use client';

import type { VendorListItemType } from '@ramps/schemas/vendors';
import { Button } from '@ramps/ui/Button';
import { IconButton } from '@ramps/ui/IconButton';
import { ChevronDown, Download, Filter, Layout, Search } from '@ramps/ui/icons';
import { Input } from '@ramps/ui/Input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { buildSearchQuery } from '../helpers/vendor-search-query.helpers';

export interface VendorsToolbarProps {
  initialSearch: VendorListItemType['name'] | null;
}

const SEARCH_DEBOUNCE_MS = 300;

export function VendorsToolbar({ initialSearch }: VendorsToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(initialSearch ?? '');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const buttonClassName = 'h-full';

  const commit = useCallback(
    (next: string) => {
      const query = buildSearchQuery(searchParams.toString(), next);
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, searchParams],
  );

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
          aria-label="Search vendors"
          leadingIcon={<Search size={16} />}
          className="max-w-xs h-full grow-0"
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
