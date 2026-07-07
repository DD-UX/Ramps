'use client';

import type { SelectOption } from '@ramps/ui/Select';
import { useMemo } from 'react';

import { useBillDetail } from '../context/BillDetail.context';

/** A named record with an id — the shape every reference catalog row shares. */
interface NamedRow {
  id: string;
  name: string;
}

/** Map a catalog to `Select` options, prefixing a `code` when the row has one. */
function toOptions(rows: readonly NamedRow[]): SelectOption[] {
  return rows.map((row) => {
    const code = 'code' in row ? (row as { code?: unknown }).code : undefined;
    return {
      value: row.id,
      label: typeof code === 'string' && code ? `${code} · ${row.name}` : row.name,
    };
  });
}

/**
 * Turns the fetched reference catalogs into `Select` option lists, memoized.
 * Every picker in the form (vendor, entity, GL account, department, …) reads
 * its list from here, so the ref→option mapping lives in one place instead of
 * being re-derived in each section.
 */
export function useRefOptions() {
  const { refs } = useBillDetail();

  return useMemo(
    () => ({
      vendors: toOptions(refs.vendors),
      entities: toOptions(refs.entities),
      glAccounts: toOptions(refs.gl_accounts),
      departments: toOptions(refs.departments),
      classes: toOptions(refs.classes),
      locations: toOptions(refs.locations),
      taxCodes: toOptions(refs.tax_codes),
      paymentAccounts: toOptions(refs.payment_accounts),
    }),
    [refs],
  );
}
