'use client';

import { BillEditFormSchema, type BillEditFormType } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { EmptyState } from '@ramps/ui/EmptyState';
import { FieldError } from '@ramps/ui/FieldError';
import { ActivityIcon, Save } from '@ramps/ui/icons';
import { Tabs } from '@ramps/ui/Tabs';
import { Activity, useEffect, useState } from 'react';
import { useFormState, useWatch } from 'react-hook-form';

import { ACTIVITY_MODE } from '@/features/common/constants/activity.constants';
import { useIsApplePlatform } from '@/features/common/hooks/useIsApplePlatform';

import { PRIMARY_ACTION_BY_STATUS } from '../constants/primary-action.constants';
import {
  BILL_DETAILS_TAB,
  BILL_DETAILS_TABS,
  type BillDetailsTab,
} from '../constants/tabs.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { billSubmitReady } from '../helpers/section-completeness.helpers';
import { useSaveBillDraft } from '../hooks/useSaveBillDraft';
import { BillDetailsApprovals } from './BillDetailsApprovals';
import { BillDetailsHeader } from './BillDetailsHeader';
import { BillDetailsInvoiceInfo } from './BillDetailsInvoiceInfo';
import { BillDetailsLineItems } from './BillDetailsLineItems';
import { BillDetailsMemo } from './BillDetailsMemo';
import { BillDetailsPane } from './BillDetailsPane';
import { BillDetailsPayment } from './BillDetailsPayment';
import { BillDetailsPurchaseOrder } from './BillDetailsPurchaseOrder';
import { BillDetailsSaveToast, type SaveToastPhase } from './BillDetailsSaveToast';
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
  // The Save-draft toast's phase: 'saving' while the flow runs, 'saved' once
  // it resolves ok, null otherwise (a failure falls back to the inline error).
  const [saveToast, setSaveToast] = useState<SaveToastPhase | null>(null);

  const onSaveDraft = async () => {
    setSaveToast('saving');
    const ok = await saveDraft();
    setSaveToast(ok ? 'saved' : null);
  };
  // The submit chip spells the OS's own modifier — ⌘ on Apple, Ctrl elsewhere —
  // via the same hydration-safe read the top bar's ⌘K keycap uses.
  const isApple = useIsApplePlatform();
  // useFormState — NOT `form.formState` — on purpose: formState is a lazy
  // proxy scoped to the component that CALLED useForm (the provider). Read
  // through the context in a child, the isValid subscription registers too
  // late and RHF never runs the mount-time validity pass — the button would
  // sit disabled forever on a perfectly valid bill. useFormState opens this
  // component's own subscription, which also makes RHF resolve validity up
  // front, so a bill that loads complete is submittable immediately.
  const { isValid } = useFormState({ control: form.control });

  // The resolver says "valid FORM"; the submit needs "COMPLETE bill" — the
  // schema deliberately admits draft blanks (unmatched vendor, no invoice
  // number), so the primary action gates on the same section-completeness
  // rules the amber/green pills read, recomputed live from the watched slice.
  const [vendorId, invoiceNumber, invoiceDate, dueDate, lineItems] = useWatch({
    control: form.control,
    name: ['vendor_id', 'invoice_number', 'invoice_date', 'due_date', 'line_items'],
  });
  const canSubmit =
    isValid &&
    billSubmitReady({
      vendor_id: vendorId,
      invoice_number: invoiceNumber ?? '',
      invoice_date: invoiceDate,
      due_date: dueDate,
      line_items: lineItems ?? [],
    });

  // WHY-is-it-invalid console trail: RHF's silent validity check doesn't
  // populate `formState.errors` until a field blurs or a submit fires, so an
  // invalid-on-load bill would show a disabled button with no explanation.
  // Re-run the same zod schema over the current values and log the issues —
  // read-only (no trigger()), so no inline errors light up uninvited.
  useEffect(() => {
    if (isValid) return;
    const result = BillEditFormSchema.safeParse(form.getValues());
    if (!result.success) {
      console.warn(
        '[bill-details] form invalid:',
        result.error.issues.map(({ path, code, message }) => ({
          field: path.join('.'),
          code,
          message,
        })),
      );
    }
  }, [isValid, form]);

  const onSubmit = (values: BillEditFormType) => {
    // Persistence is out of scope for this pass — surface the validated payload.
    console.info('[bill-details] validated form (save stubbed):', values);
  };

  const primaryLabel = PRIMARY_ACTION_BY_STATUS[bill.status];

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (errors) =>
        console.warn('[bill-details] submit blocked by validation:', errors),
      )}
      className="gap-rui-4 flex h-full flex-col"
    >
      {/* The compact identity row (avatar · Draft · title) pins to the pane's
          top while the form scrolls under it — frame 1's scrolled state. */}
      <BillDetailsHeader />
      <BillDetailsPane className="py-0">
        <BillDetailsTitle />
      </BillDetailsPane>

      {/* Same h-12 band as the document pane's tab bar — the two Tabs rows share
          one height; items-stretch keeps the underline on the border. */}
      <Tabs
        tabs={[...BILL_DETAILS_TABS]}
        value={tab}
        onValueChange={(value) => setTab(value as BillDetailsTab)}
        className="px-rui-5 h-12 shrink-0 items-stretch"
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
          space between, not clustered. Fixed h-14 band (py-0 overrides the
          pane's default padding) so it levels with the rail's Prev/Next
          footer instead of towering over it. */}
      <BillDetailsPane className="border-bone bg-white/80 backdrop-blur h-14 py-0 sticky -bottom-px z-10 grid shrink-0 grid-flow-col items-center justify-between border-t">
        <div className="gap-rui-3 flex items-center">
          <Button
            type="button"
            variant="underline"
            leadingIcon={<Save size={16} />}
            onClick={() => void onSaveDraft()}
            disabled={savingDraft}
          >
            {savingDraft ? 'Saving…' : 'Save draft'}
          </Button>
          <FieldError size="sm">{saveError}</FieldError>
        </div>
        {/* Un-submittable while the form is invalid OR the bill incomplete —
            and the ⌘/Ctrl+↵ chips leave with the affordance: a disabled
            action advertises no shortcut. */}
        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          keys={canSubmit ? [isApple ? '⌘' : 'Ctrl', '↵'] : undefined}
        >
          {primaryLabel}
        </Button>
      </BillDetailsPane>
      {/* Direct child of the <form>, NOT the footer pane: the pane's
          backdrop-blur is a containing block for fixed descendants, which
          would pin the "viewport" toast to the footer band instead. */}
      <BillDetailsSaveToast phase={saveToast} onDismiss={() => setSaveToast(null)} />
    </form>
  );
}
