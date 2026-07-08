'use client';

import { Money } from '@ramps/ui/Money';
import { StatusPill } from '@ramps/ui/StatusPill';

import { useBillDetail } from '../context/BillDetail.context';

/**
 * BillDetailsTitle — the header concern (snapshots 5–6): the status pill, the
 * vendor name as the page heading, the invoice number, and the amount. It's the
 * first band in the left pane's {@link BillDetailsForm}, above the Overview /
 * Activity tabs; the tabs and the body they swap live in the form, not here.
 */
export function BillDetailsTitle() {
  const { bill } = useBillDetail();

  return (
    <div className="gap-rui-3 flex flex-col">
      <div className="gap-rui-3 flex items-center justify-between">
        <div className="gap-rui-2 flex items-center">
          <StatusPill status={bill.status} />
          <h2 className="font-heading text-2xl text-ink">
            {bill.vendor_name ?? 'Unmatched vendor'}
          </h2>
          {bill.invoice_number && (
            <span className="text-sm font-body text-hushed">#{bill.invoice_number}</span>
          )}
        </div>
        <Money cents={bill.amount_cents} currency={bill.currency} className="text-xl" />
      </div>
    </div>
  );
}
