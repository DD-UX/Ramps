'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { EmptyState } from '@ramps/ui/EmptyState';
import { ActivityIcon, Save } from '@ramps/ui/icons';
import { Tabs } from '@ramps/ui/Tabs';
import { Activity, useState } from 'react';

import { ACTIVITY_MODE } from '@/features/common/constants/activity.constants';

import { PRIMARY_ACTION_BY_STATUS } from '../constants/primary-action.constants';
import {
  BILL_DETAILS_TAB,
  BILL_DETAILS_TABS,
  type BillDetailsTab,
} from '../constants/tabs.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { BillDetailsApprovals } from './BillDetailsApprovals';
import { BillDetailsInvoiceInfo } from './BillDetailsInvoiceInfo';
import { BillDetailsLineItems } from './BillDetailsLineItems';
import { BillDetailsMemo } from './BillDetailsMemo';
import { BillDetailsPane } from './BillDetailsPane';
import { BillDetailsPayment } from './BillDetailsPayment';
import { BillDetailsPurchaseOrder } from './BillDetailsPurchaseOrder';
import { BillDetailsTitle } from './BillDetailsTitle';
import { BillDetailsVendor } from './BillDetailsVendor';

/**
 * BillDetailsForm — the left column: every editable section stacked in review
 * order (Vendor → Bill details → PO → Line items → Payment → Memo → Approvals),
 * plus the sticky action bar. It's the `<form>` element itself; each child owns
 * its own concern and binds to the shared form by name, so this file stays a
 * layout + submit shell.
 *
 * Submit is STUBBED for this pass (read-only): `handleSubmit` validates the
 * whole form against the zod resolver and logs the parsed values — no write yet.
 * The primary action's label tracks the bill's status (Create bill / Approve /
 * Schedule payment …).
 */
export function BillDetailsForm() {
  const { form, bill } = useBillDetail();
  const [tab, setTab] = useState<BillDetailsTab>(BILL_DETAILS_TAB.OVERVIEW);

  const onSubmit = (values: BillEditFormType) => {
    // Persistence is out of scope for this pass — surface the validated payload.
    console.info('[bill-details] validated form (save stubbed):', values);
  };

  const primaryLabel = PRIMARY_ACTION_BY_STATUS[bill.status];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="gap-rui-4 flex h-full flex-col">
      <BillDetailsPane>
        <BillDetailsTitle />
      </BillDetailsPane>

      <Tabs
        tabs={[...BILL_DETAILS_TABS]}
        value={tab}
        onValueChange={(value) => setTab(value as BillDetailsTab)}
        className="px-5"
      />
      {/* Overview holds the resizable split: form on the white left pane,
            invoice preview on the warm limestone right pane. The panel supplies
            each pane's surface + framing, so children only bring padding. */}
      <Activity
        mode={tab === BILL_DETAILS_TAB.OVERVIEW ? ACTIVITY_MODE.VISIBLE : ACTIVITY_MODE.HIDDEN}
      >
        <BillDetailsPane>
          <BillDetailsVendor />
          <BillDetailsInvoiceInfo />
          <BillDetailsPurchaseOrder />
          <BillDetailsLineItems />
          <BillDetailsPayment />
          <BillDetailsMemo />
          <BillDetailsApprovals />
        </BillDetailsPane>
      </Activity>
      {/* Activity — no audit trail yet, so the same empty-state treatment as
            the document pane's "No documents" tab. */}
      <Activity
        mode={tab === BILL_DETAILS_TAB.ACTIVITY ? ACTIVITY_MODE.VISIBLE : ACTIVITY_MODE.HIDDEN}
      >
        <BillDetailsPane className="h-full">
          <EmptyState
            className="min-h-0 flex-1"
            icon={<ActivityIcon size={28} />}
            title="No activity yet"
            description="Approvals, edits and payment events for this bill will appear here."
          />
        </BillDetailsPane>
      </Activity>
      {/* Sticky action bar (snapshot 9): Save draft sits far LEFT with its
          floppy-disk glyph, the status-driven primary far RIGHT — split with
          space between, not clustered. */}
      <BillDetailsPane className="border-bone bg-white/80 py-rui-3 bottom-0 backdrop-blur sticky z-10 grid grid-flow-col items-center justify-between border-t">
        <Button type="button" variant="underline" leadingIcon={<Save size={16} />}>
          Save draft
        </Button>
        <Button type="submit" variant="primary" keys={['⌘', '↵']}>
          {primaryLabel}
        </Button>
      </BillDetailsPane>
    </form>
  );
}
