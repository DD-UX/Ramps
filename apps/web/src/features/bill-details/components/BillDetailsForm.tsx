'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { EmptyState } from '@ramps/ui/EmptyState';
import { FieldError } from '@ramps/ui/FieldError';
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
import { useSaveBillDraft } from '../hooks/useSaveBillDraft';
import { BillDetailsApprovals } from './BillDetailsApprovals';
import { BillDetailsHeader } from './BillDetailsHeader';
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
 *
 * "Save draft" persists whatever the approvals section staged onto the
 * context's `pendingApprovalStagesRef` (route edits no longer PUT per change).
 * The flow itself lives in {@link useSaveBillDraft} — shared with the
 * unsaved-changes guard's "Save draft" exit — this footer only renders its
 * own trigger + inline error.
 */
export function BillDetailsForm() {
  const { form, bill } = useBillDetail();
  const [tab, setTab] = useState<BillDetailsTab>(BILL_DETAILS_TAB.OVERVIEW);
  const { saveDraft, saving: savingDraft, error: saveError } = useSaveBillDraft();

  const onSubmit = (values: BillEditFormType) => {
    // Persistence is out of scope for this pass — surface the validated payload.
    console.info('[bill-details] validated form (save stubbed):', values);
  };

  const primaryLabel = PRIMARY_ACTION_BY_STATUS[bill.status];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="gap-rui-4 flex h-full flex-col">
      {/* The compact identity row (avatar · Draft · title) pins to the pane's
          top while the form scrolls under it — frame 1's scrolled state. */}
      <BillDetailsHeader />
      <BillDetailsPane className="py-0">
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
      <BillDetailsPane className="border-bone bg-white/80 bottom-0 backdrop-blur sticky z-10 grid grid-flow-col items-center justify-between border-t">
        <div className="gap-rui-3 flex items-center">
          <Button
            type="button"
            variant="underline"
            leadingIcon={<Save size={16} />}
            onClick={() => void saveDraft()}
            disabled={savingDraft}
          >
            {savingDraft ? 'Saving…' : 'Save draft'}
          </Button>
          <FieldError size="sm">{saveError}</FieldError>
        </div>
        <Button type="submit" variant="primary" keys={['⌘', '↵']}>
          {primaryLabel}
        </Button>
      </BillDetailsPane>
    </form>
  );
}
