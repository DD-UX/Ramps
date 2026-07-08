'use client';

import { useBillDetail } from '../context/BillDetail.context';
import { billTitle } from '../helpers/bill-title.helpers';

/**
 * BillDetailsTitle — the big page title (frame 06): one heading, Ramp's exact
 * words — "Clarity Online INV# 4072". Status and amount moved OUT of here: the
 * lifecycle word lives in the pinned {@link BillDetailsHeader} row above, and
 * the money belongs to the line items' Invoice total + the invoice preview —
 * the frames show a bare title, so this is one.
 */
export function BillDetailsTitle() {
  const { bill } = useBillDetail();

  return <h2 className="font-heading text-ink text-3xl">{billTitle(bill)}</h2>;
}
