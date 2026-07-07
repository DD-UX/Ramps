'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';

import { useBillDetail } from '../context/BillDetail.context';
import { PRIMARY_ACTION_BY_STATUS } from '../constants/primary-action.constants';
import { BillDetailsApprovals } from './BillDetailsApprovals';
import { BillDetailsInvoiceInfo } from './BillDetailsInvoiceInfo';
import { BillDetailsLineItems } from './BillDetailsLineItems';
import { BillDetailsMemo } from './BillDetailsMemo';
import { BillDetailsPayment } from './BillDetailsPayment';
import { BillDetailsPurchaseOrder } from './BillDetailsPurchaseOrder';
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

  const onSubmit = (values: BillEditFormType) => {
    // Persistence is out of scope for this pass — surface the validated payload.
    // eslint-disable-next-line no-console
    console.info('[bill-details] validated form (save stubbed):', values);
  };

  const primaryLabel = PRIMARY_ACTION_BY_STATUS[bill.status];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="gap-rui-4 flex flex-col">
      <BillDetailsVendor />
      <BillDetailsInvoiceInfo />
      <BillDetailsPurchaseOrder />
      <BillDetailsLineItems />
      <BillDetailsPayment />
      <BillDetailsMemo />
      <BillDetailsApprovals />

      {/* Sticky action bar (snapshot 9): Save draft + the status-driven primary. */}
      <div className="gap-rui-2 border-bone bg-white/80 py-rui-3 bottom-0 backdrop-blur sticky flex items-center justify-end border-t">
        <Button type="button" variant="underline">
          Save draft
        </Button>
        <Button type="submit" variant="primary" keys={['⌘', '↵']}>
          {primaryLabel}
        </Button>
      </div>
    </form>
  );
}
