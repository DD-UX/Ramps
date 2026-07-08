'use client';

import { BillEditFormSchema } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { EmptyState } from '@ramps/ui/EmptyState';
import { FieldError } from '@ramps/ui/FieldError';
import { ActivityIcon } from '@ramps/ui/icons';
import { Tabs } from '@ramps/ui/Tabs';
import { Activity, useEffect, useState } from 'react';
import { useFormState, useWatch } from 'react-hook-form';

import { ACTIVITY_MODE } from '@/features/common/constants/activity.constants';
import { useIsApplePlatform } from '@/features/common/hooks/useIsApplePlatform';

import { isBillEditable } from '../constants/editable-status.constants';
import { FOOTER_ACTION_STRATEGIES, resolveFooterAction } from '../constants/footer-action.constants';
import { isBillPreSubmit } from '../constants/pre-submit.constants';
import { PRIMARY_ACTION_BY_STATUS } from '../constants/primary-action.constants';
import {
  BILL_DETAILS_TAB,
  BILL_DETAILS_TABS,
  type BillDetailsTab,
} from '../constants/tabs.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { billSubmitReady } from '../helpers/section-completeness.helpers';
import { useSaveBillDraft } from '../hooks/useSaveBillDraft';
import { useSubmitBill } from '../hooks/useSubmitBill';
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
 *
 * EDIT MODE (post-submit bills): anything past `draft`/`missing_info` opens
 * READ-ONLY — one `<fieldset disabled>` around the sections inherits the lock
 * to every input/select/button natively — and the footer's left slot swaps
 * "Save draft" for "Edit bill". Edit bill flips the context's `editable` on
 * and becomes "Save bill"; a successful save flips it back off, returning the
 * screen to its frozen record state.
 */
export function BillDetailsForm() {
  const { form, bill, editable, toggleEditable } = useBillDetail();
  const [tab, setTab] = useState<BillDetailsTab>(BILL_DETAILS_TAB.OVERVIEW);
  const { saveDraft, saving: savingDraft, error: saveError } = useSaveBillDraft();
  // Create bill: persist the form + submit for approval + redirect. Only the
  // pre-submit primary action ("Create bill") drives this; past that the label
  // is Approve / Schedule payment, which are out of this pass's scope.
  const { submit, submitting, error: submitError } = useSubmitBill();
  // The save toast's phase: 'saving' while the flow runs, 'saved' once it
  // resolves ok, null otherwise (a failure falls back to the inline error).
  const [saveToast, setSaveToast] = useState<SaveToastPhase | null>(null);

  // Pre-submit bills (draft / missing_info) keep the authoring footer: Save
  // draft, always-editable fields. `awaiting_approval` is still editable — the
  // Edit bill ⇄ Save bill pair owns its left slot, the fieldset lock tracking
  // `editable`. From `approved` on the record is LOCKED: no left action at all.
  const preSubmit = isBillPreSubmit(bill.status);
  const editableStatus = isBillEditable(bill.status);

  /**
   * One save flow, two exits: the pre-submit "Save draft" keeps edit mode as
   * is; the post-submit "Save bill" leaves edit mode on success, snapping the
   * screen back to read-only. A failure keeps edit mode ON either way — the
   * user's unsaved work stays reachable next to the inline error.
   */
  const onSave = async ({ exitEditMode }: { exitEditMode: boolean }) => {
    setSaveToast('saving');
    const ok = await saveDraft();
    setSaveToast(ok ? 'saved' : null);
    if (ok && exitEditMode) toggleEditable(false);
  };

  // The footer's left action, resolved from the lifecycle mode and rendered
  // off the strategy table — label, glyph and behavior travel together, so
  // this component never branches on WHICH action it's showing. Only saving
  // strategies advertise a busy label; Edit bill has none and never disables.
  // A LOCKED bill (approved onward) resolves to null — the left slot stays empty.
  const footerActionKey = resolveFooterAction({ preSubmit, editableStatus, editable });
  const footerAction = footerActionKey ? FOOTER_ACTION_STRATEGIES[footerActionKey] : null;
  const footerBusy = savingDraft && footerAction?.busyLabel != null;
  const footerActionDeps = {
    save: (opts: { exitEditMode: boolean }) => void onSave(opts),
    toggleEditable,
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

  const onSubmit = () => {
    // Pre-submit bills CREATE (save + submit for approval + redirect). Past that
    // the primary action is Approve / Schedule payment — not wired this pass, so
    // a submit there is a no-op rather than a wrong write.
    if (preSubmit) void submit();
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
          {/* The read-only lock, applied ONCE: a disabled fieldset disables
              every nested input/select/textarea/button natively (the DS's
              `disabled:` styling reacts to the same :disabled state), so no
              section needs a threaded prop. `display: contents` keeps the
              fieldset out of layout — the sections still stack directly in
              the pane's flex rhythm. */}
          <fieldset disabled={!editable} className="contents">
            <BillDetailsVendor />
            <BillDetailsInvoiceInfo />
            <BillDetailsPurchaseOrder />
            <BillDetailsLineItems />
            <BillDetailsPayment />
            <BillDetailsMemo />
            <BillDetailsApprovals />
          </fieldset>
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
          {/* The left slot renders whatever strategy the lifecycle resolves to
              (Save draft / Edit bill / Save bill) — the branching lives in the
              strategy table, this stays one dumb Button. A locked bill resolves
              to no action, so the slot renders nothing at all. */}
          {footerAction && (
            <Button
              type="button"
              variant="underline"
              leadingIcon={<footerAction.Icon size={16} />}
              onClick={() => footerAction.run(footerActionDeps)}
              disabled={footerBusy}
            >
              {footerBusy ? footerAction.busyLabel : footerAction.label}
            </Button>
          )}
          <FieldError size="sm">{saveError}</FieldError>
        </div>
        {/* Un-submittable while the form is invalid OR the bill incomplete OR a
            create is already in flight — and the ⌘/Ctrl+↵ chips leave with the
            affordance: a disabled action advertises no shortcut. The create's
            own error surfaces beside the primary, mirroring Save draft's line. */}
        <div className="gap-rui-3 flex items-center">
          <FieldError size="sm">{submitError}</FieldError>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit || submitting}
            keys={canSubmit && !submitting ? [isApple ? '⌘' : 'Ctrl', '↵'] : undefined}
          >
            {submitting ? 'Creating…' : primaryLabel}
          </Button>
        </div>
      </BillDetailsPane>
      {/* Direct child of the <form>, NOT the footer pane: the pane's
          backdrop-blur is a containing block for fixed descendants, which
          would pin the "viewport" toast to the footer band instead. */}
      <BillDetailsSaveToast
        phase={saveToast}
        noun={preSubmit ? 'draft' : 'bill'}
        onDismiss={() => setSaveToast(null)}
      />
    </form>
  );
}
