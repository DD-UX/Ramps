'use client';

import { Money } from '@ramps/ui/Money';
import { StatusPill } from '@ramps/ui/StatusPill';
import { Tabs } from '@ramps/ui/Tabs';

import { useBillDetail } from '../context/BillDetail.context';
import type { BillDetailsTab } from '../constants/tabs.constants';
import { BILL_DETAILS_TABS } from '../constants/tabs.constants';

export interface BillDetailsTitleProps {
  /** The active header tab, owned by the surface so it can swap the body. */
  tab: BillDetailsTab;
  onTabChange: (tab: BillDetailsTab) => void;
}

/**
 * BillDetailsTitle — the header concern (snapshots 5–6): the status pill, the
 * invoice number as the page heading, the amount, and the Overview / Activity
 * tabs. The tab selection is owned by the surface ({@link BillDetailsContent})
 * so it can swap the body beneath, so this is a controlled consumer.
 */
export function BillDetailsTitle({ tab, onTabChange }: BillDetailsTitleProps) {
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
      <Tabs
        tabs={[...BILL_DETAILS_TABS]}
        value={tab}
        onValueChange={(value) => onTabChange(value as BillDetailsTab)}
      />
    </div>
  );
}
