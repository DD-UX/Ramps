'use client';

import { Money } from '@ramps/ui/Money';
import { StatusPill } from '@ramps/ui/StatusPill';
import { Tabs } from '@ramps/ui/Tabs';
import { useState } from 'react';

import { useBillDetail } from '../context/BillDetail.context';

const OVERVIEW_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity' },
];

/**
 * BillDetailsTitle — the header concern (snapshots 5–6): the status pill, the
 * invoice number as the page heading, the amount, and the Overview / Activity
 * tabs. Its own component so the title owns exactly its slice of the screen.
 */
export function BillDetailsTitle() {
  const { bill } = useBillDetail();
  const [tab, setTab] = useState('overview');

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
      <Tabs tabs={OVERVIEW_TABS} value={tab} onValueChange={setTab} />
    </div>
  );
}
