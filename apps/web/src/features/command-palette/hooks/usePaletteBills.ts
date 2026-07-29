'use client';

import type { BillListItemType } from '@ramps/schemas/bills';
import useSWR from 'swr';

import { fetchBillsList } from '@/features/bill-details/helpers/bill-cache.helpers';

import { PALETTE_BILL_RESULT_LIMIT } from '../constants/palette.constants';
import { isSearchableQuery, paletteBillsSwrKey } from '../helpers/palette-results.helpers';

/**
 * usePaletteBills — the palette's bill search, straight through the SERVER.
 *
 * It reuses `fetchBillsList` with NO statuses, which is the whole point: an
 * empty status list means "no category filter", so one query reaches every
 * bill — drafts, archived, paid — instead of whichever tab the user happens to
 * be looking at. A palette that could only find rows from the current tab
 * would be the same half-truth the old focus-a-dead-field shortcut was.
 *
 * `pageSize` carries {@link PALETTE_BILL_RESULT_LIMIT} so the CAP is part of
 * the query rather than a `.slice()` afterwards: the server returns six rows
 * and the true `total`, so "6 of 41 matches" stays sayable without paying for
 * the other 35.
 *
 * A null key is the idle state — SWR skips the request entirely below
 * {@link isSearchableQuery}, so an empty palette (and every one-character
 * keystroke on the way to a real term) costs nothing.
 */
export interface PaletteBillsResult {
  bills: BillListItemType[];
  /** Matches across the whole table, not the returned window. */
  total: number;
  /** True only while a NEW term is in flight — a re-fetch of shown rows is silent. */
  loading: boolean;
  error: boolean;
}

export function usePaletteBills(query: string): PaletteBillsResult {
  const term = query.trim();
  const searchable = isSearchableQuery(term);

  const { data, isLoading, error } = useSWR(
    searchable ? paletteBillsSwrKey(term) : null,
    () => fetchBillsList([], term, 1, PALETTE_BILL_RESULT_LIMIT),
    {
      // The previous term's rows stay painted while the next lands, so the
      // list settles instead of blinking empty between keystrokes.
      keepPreviousData: true,
    },
  );

  // `keepPreviousData` also holds data across a key going NULL, so the results
  // are gated on `searchable` here too: clearing the field must empty the list,
  // not leave the last term's rows sitting under a blank query.
  return {
    bills: searchable ? (data?.bills ?? []) : [],
    total: searchable ? (data?.total ?? 0) : 0,
    loading: searchable && isLoading,
    error: searchable && Boolean(error),
  };
}
