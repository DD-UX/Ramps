import type { BillEditFormType } from '@ramps/schemas/bills';

/**
 * Section completeness — the amber/green pills each form section carries in the
 * draft-review screen (findings §3, snapshots 6–7): `Vendor: Incomplete`,
 * `Bill details: Complete`, `Line items: Incomplete`, `Purchase order: Optional`.
 *
 * This is a per-section checklist derived from the live form values, NOT one
 * global valid flag — a reviewer sees exactly which sections still need work.
 * Pure over form state so it recomputes on every edit and stays unit-testable.
 */
export type SectionCompleteness = 'complete' | 'incomplete' | 'optional';

/**
 * Each helper reads only the slice of the form its section owns, so callers pass
 * their watched values straight in — no reconstructing (and unsafely casting) a
 * whole `BillEditFormType`. A full form still satisfies every `Pick`, so the
 * unit tests keep handing over the complete fixture unchanged.
 */
type VendorFields = Pick<BillEditFormType, 'vendor_id'>;
type InvoiceFields = Pick<BillEditFormType, 'invoice_number' | 'invoice_date' | 'due_date'>;
type PurchaseOrderFields = Pick<BillEditFormType, 'po_number'>;
type LineItemFields = Pick<BillEditFormType, 'line_items'>;

/** Vendor is complete once a vendor is matched (the unmatched draft is the gap). */
export function vendorCompleteness(form: VendorFields): SectionCompleteness {
  return form.vendor_id ? 'complete' : 'incomplete';
}

/**
 * Bill details need the identifying trio the payment run relies on: an invoice
 * number, an invoice date, and a due date. Anything missing keeps it amber.
 */
export function billDetailsCompleteness(form: InvoiceFields): SectionCompleteness {
  const hasNumber = form.invoice_number.trim().length > 0;
  const hasDates = Boolean(form.invoice_date) && Boolean(form.due_date);
  return hasNumber && hasDates ? 'complete' : 'incomplete';
}

/** The PO is genuinely optional — it's `Optional` when blank, `Complete` when set. */
export function purchaseOrderCompleteness(form: PurchaseOrderFields): SectionCompleteness {
  return form.po_number.trim().length > 0 ? 'complete' : 'optional';
}

/**
 * Line items are complete when there's at least one line AND every line is
 * fully coded (a GL account picked and a non-zero amount). An empty grid or any
 * uncoded line — the OCR partial-extract failure state (findings §"where Ramp
 * fails") — reads Incomplete.
 */
export function lineItemsCompleteness(form: LineItemFields): SectionCompleteness {
  if (form.line_items.length === 0) return 'incomplete';
  const allCoded = form.line_items.every(
    (li) => li.gl_account_id !== null && li.amount_cents !== 0,
  );
  return allCoded ? 'complete' : 'incomplete';
}

/**
 * Approvals are REQUIRED to submit: the chain needs at least one stage, or the
 * bill would enter `awaiting_approval` with nobody to act on it. NOT a form
 * slice like its siblings — the route lives outside react-hook-form (persisted
 * `bill.approval_stages`, or the staged-but-unsaved edit the context counts) —
 * so this reads the resolved stage count the caller derives from those two.
 */
export function approvalsCompleteness(stageCount: number): SectionCompleteness {
  return stageCount > 0 ? 'complete' : 'incomplete';
}

/**
 * Do the line amounts reconcile to the bill total? The invoice-total line under
 * the grid turns this into the "$X of $Y" mismatch cue. Returns the summed
 * line amount so callers can render it.
 */
export function lineItemsTotalCents(form: LineItemFields): number {
  return form.line_items.reduce((sum, li) => sum + (li.amount_cents ?? 0), 0);
}

/**
 * Submit-readiness — the footer's primary action gate. The RESOLVER schema is
 * deliberately lenient (an in-progress draft with blanks is a valid FORM
 * state), so `formState.isValid` alone would offer "Create bill" on an
 * unmatched, number-less draft. What the submit transition demands is the
 * REQUIRED sections reading complete: a matched vendor, the identifying
 * invoice trio, a fully-coded line grid, AND an approval route with at least
 * one stage — the SDK refuses an approver-less submit, so the button gates on
 * the same rule. (The PO stays out — optional.) The stage count travels as its
 * own argument because the route isn't form state (see
 * {@link approvalsCompleteness}).
 */
export function billSubmitReady(
  form: VendorFields & InvoiceFields & LineItemFields,
  approvalStageCount: number,
): boolean {
  return (
    vendorCompleteness(form) === 'complete' &&
    billDetailsCompleteness(form) === 'complete' &&
    lineItemsCompleteness(form) === 'complete' &&
    approvalsCompleteness(approvalStageCount) === 'complete'
  );
}
