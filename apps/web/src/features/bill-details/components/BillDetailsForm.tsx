'use client';

import { BillEditFormSchema } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { EmptyState } from '@ramps/ui/EmptyState';
import { FieldError } from '@ramps/ui/FieldError';
import { ActivityIcon } from '@ramps/ui/icons';
import { Tabs } from '@ramps/ui/Tabs';
import { Activity, useEffect, useState } from 'react';
import { useFormState, useWatch } from 'react-hook-form';

import { BillsActionsMenu } from '@/features/bills/components/BillsActionsMenu';
import { hasBillActions } from '@/features/bills/constants/bill-actions.constants';
import { ACTIVITY_MODE } from '@/features/common/constants/activity.constants';
import { useIsApplePlatform } from '@/features/common/hooks/useIsApplePlatform';

import { isBillEditable } from '../constants/editable-status.constants';
import {
  FOOTER_ACTION,
  FOOTER_ACTION_STRATEGIES,
  resolveFooterAction,
} from '../constants/footer-action.constants';
import { isBillPreSubmit } from '../constants/pre-submit.constants';
import {
  PRIMARY_ACTION,
  PRIMARY_ACTION_BY_STATUS,
  resolvePrimaryAction,
  resolvePrimaryActionIcon,
} from '../constants/primary-action.constants';
import {
  BILL_DETAILS_TAB,
  BILL_DETAILS_TABS,
  type BillDetailsTab,
} from '../constants/tabs.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { billSubmitReady } from '../helpers/section-completeness.helpers';
import { useApproveBill } from '../hooks/useApproveBill';
import { useCancelBillEdit } from '../hooks/useCancelBillEdit';
import { useSaveBillDraft } from '../hooks/useSaveBillDraft';
import { useSubmitBill } from '../hooks/useSubmitBill';
import { BillDetailsApprovals } from './BillDetailsApprovals';
import { BillDetailsCompletePaymentButton } from './BillDetailsCompletePaymentButton';
import { BillDetailsHeader } from './BillDetailsHeader';
import { BillDetailsInvoiceInfo } from './BillDetailsInvoiceInfo';
import { BillDetailsLineItems } from './BillDetailsLineItems';
import { BillDetailsMemo } from './BillDetailsMemo';
import { BillDetailsPane } from './BillDetailsPane';
import { BillDetailsPayment } from './BillDetailsPayment';
import { BillDetailsPurchaseOrder } from './BillDetailsPurchaseOrder';
import { BillDetailsSaveToast, type SaveToastPhase } from './BillDetailsSaveToast';
import { BillDetailsScheduleModal } from './BillDetailsScheduleModal';
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
  // Create bill: persist the form + submit for approval + redirect. Drives the
  // pre-submit primary action ("Create bill") only.
  const { submit, submitting, error: submitError } = useSubmitBill();
  // Approve: persist the form + advance the bill (→ scheduled when the payment
  // slice is complete, else → approved). Drives the `awaiting_approval` primary.
  const { approve, submitting: approving, error: approveError } = useApproveBill();
  // Cancel edit: discard in-edit changes and snap back to the fetched record,
  // then leave edit mode — the "Save bill" companion, no network write.
  const { cancelEdit } = useCancelBillEdit();
  // The schedule/view modal's open state — the `approved` primary opens it to
  // book a payment, the `scheduled` primary opens it read-only ("View schedule").
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
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

  // Only the pre-submit CREATE flow rides the form's native submit (so Enter /
  // ⌘↵ works). The post-submit primaries (Approve / Schedule / View) are their
  // own explicit handlers on a type="button", so a stray Enter can't fire them.
  const onSubmit = () => {
    if (preSubmit) void submit();
  };

  // The primary CTA, resolved from status into one declarative kind → its label,
  // click handler, busy state and gating. The footer JSX then renders one button
  // off this record instead of branching on the status inline.
  const primaryAction = resolvePrimaryAction(bill.status);
  const primaryLabel = PRIMARY_ACTION_BY_STATUS[bill.status];
  // The primary's leading glyph, one per status (FilePlus create, Check approve,
  // CalendarClock schedule, Eye view, CircleDollarSign complete, RotateCcw
  // reopen, ArchiveRestore restore). Always present, so the JSX renders it
  // unconditionally as the button's leadingIcon.
  const PrimaryIcon = resolvePrimaryActionIcon(bill.status);

  // create is the only kind whose enablement is form-driven (valid + complete);
  // the others gate on their own in-flight state. `none` (terminal states) is
  // inert. Approve reads the shared payment slice inside its hook, so the button
  // itself needn't gate on payment completeness — an incomplete slice simply
  // lands the bill on `approved` rather than `scheduled`.
  const primary: {
    label: string;
    onClick: () => void;
    disabled: boolean;
    /** Show the ⌘/Ctrl+↵ chip + native submit — create only. */
    isSubmit: boolean;
  } = (() => {
    switch (primaryAction) {
      case PRIMARY_ACTION.CREATE:
        return {
          label: submitting ? 'Creating…' : primaryLabel,
          onClick: () => undefined, // native submit drives it
          disabled: !canSubmit || submitting,
          isSubmit: true,
        };
      case PRIMARY_ACTION.APPROVE:
        return {
          label: approving ? 'Approving…' : primaryLabel,
          onClick: () => void approve(),
          // Locked while editing: the user must Save or Cancel their edits
          // before approving, so Approve never fires over an unsaved form.
          disabled: approving || editable,
          isSubmit: false,
        };
      case PRIMARY_ACTION.SCHEDULE:
      case PRIMARY_ACTION.VIEW:
        return {
          label: primaryLabel,
          onClick: () => setScheduleModalOpen(true),
          disabled: false,
          isSubmit: false,
        };
      case PRIMARY_ACTION.COMPLETE:
        // The shared Complete-payment button renders AS the primary (below) and
        // owns its own flow — this record is never rendered for this kind.
        return { label: primaryLabel, onClick: () => undefined, disabled: false, isSubmit: false };
      default:
        // Terminal / not-yet-wired states — the label reads but the button is inert.
        return { label: primaryLabel, onClick: () => undefined, disabled: true, isSubmit: false };
    }
  })();

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
          {/* Cancel — the "Save bill" companion, only while editing a submitted
              bill (the save_bill mode). Discards the in-edit changes and snaps
              the screen back to the fetched record, no write. Sits BEFORE Save
              in the left cluster ([Cancel][Save bill]); disabled while a save is
              mid-flight so it can't yank the form out from under it. */}
          {footerActionKey === FOOTER_ACTION.SAVE_BILL && (
            <Button type="button" variant="subtle" onClick={cancelEdit} disabled={footerBusy}>
              Cancel
            </Button>
          )}
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
        {/* The status-driven primary (Create / Approve / Schedule / View),
            rendered off the resolved `primary` record. Create rides the form's
            native submit and carries the ⌘/Ctrl+↵ chip (a disabled action
            advertises no shortcut); the rest are explicit-handler buttons. The
            flow's own error surfaces beside it, mirroring Save draft's line. */}
        <div className="gap-rui-3 flex items-center">
          <FieldError size="sm">{submitError ?? approveError}</FieldError>
          {/* The shared overflow menu — the SAME kebab the Bill Pay row carries —
              for the lifecycle side-actions (Reject while awaiting approval,
              Archive from any live state). Only mounted when the status has a
              move: a rejected/archived/mid-payment bill omits the kebab entirely.
              `top` so its panel rises out of the sticky bar instead of clipping
              past the viewport floor. Disabled mid-edit (`editable`): the
              side-actions lock alongside the Approve primary, so the user
              resolves their edit (Save/Cancel) before archiving or rejecting. */}
          {hasBillActions(bill.status) && (
            <BillsActionsMenu bill={bill} side="top" disabled={editable} />
          )}
          {/* A `scheduled` bill's primary reads "View schedule" (read-only) — the
              real money-movement action, "Complete payment", sits beside it as
              the SAME shared button the View-schedule modal uses (secondary here
              so View stays the visual primary). It owns its own roll flow. */}
          {bill.status === 'scheduled' && <BillDetailsCompletePaymentButton variant="secondary" />}
          {primaryAction === PRIMARY_ACTION.COMPLETE ? (
            /* A `partially_paid` bill's primary IS "Complete payment" — the same
               shared button, rendered as the primary (no separate inert CTA) so
               the roll flow is wired identically to the `scheduled` companion. */
            <BillDetailsCompletePaymentButton variant="primary" />
          ) : (
            <Button
              type={primary.isSubmit ? 'submit' : 'button'}
              variant="primary"
              leadingIcon={<PrimaryIcon size={16} />}
              disabled={primary.disabled}
              onClick={primary.isSubmit ? undefined : primary.onClick}
              keys={
                primary.isSubmit && !primary.disabled ? [isApple ? '⌘' : 'Ctrl', '↵'] : undefined
              }
            >
              {primary.label}
            </Button>
          )}
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
      {/* The schedule-payment dialog — the money-movement step lifted out of the
          inline (locked) form. `schedule` opens it editable to book a payment;
          `view` (a `scheduled` bill) opens the same fields read-only. Both reuse
          the Payment section's own components bound to the shared payment slice. */}
      {(primaryAction === PRIMARY_ACTION.SCHEDULE || primaryAction === PRIMARY_ACTION.VIEW) && (
        <BillDetailsScheduleModal
          open={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          mode={primaryAction === PRIMARY_ACTION.VIEW ? 'view' : 'schedule'}
        />
      )}
    </form>
  );
}
