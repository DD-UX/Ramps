'use client';

import { Skeleton } from '@ramps/ui/Skeleton';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { billTitle } from '../helpers/bill-title.helpers';

/**
 * BillDetailsTitle — the big page title (frame 06): one heading, Ramp's exact
 * words — "Clarity Online INV# 4072". Status and amount moved OUT of here: the
 * lifecycle word lives in the pinned {@link BillDetailsHeader} row above, and
 * the money belongs to the line items' Invoice total + the invoice preview —
 * the frames show a bare title, so this is one.
 *
 * A HEADER concern (the rail item carries vendor + invoice number), so it
 * needs `seed`. The skeleton keeps the h2's exact slot: same element, and
 * `min-h-9` pins the bar state to text-3xl's 2.25rem line box (a flex h2 with
 * only an h-8 bar would otherwise stand 4px short) — so the ladder climb
 * swaps bar for words without moving the tab bar below.
 */
export function BillDetailsTitle() {
  const { bill, dataLevel } = useBillDetail();

  return (
    <h2 className="font-heading text-ink text-3xl min-h-9 flex items-center">
      {dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.SEED) ? (
        billTitle(bill)
      ) : (
        <Skeleton className="h-8 w-72" />
      )}
    </h2>
  );
}
