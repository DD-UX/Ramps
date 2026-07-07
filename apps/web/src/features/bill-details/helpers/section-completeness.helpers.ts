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
 * Do the line amounts reconcile to the bill total? The invoice-total line under
 * the grid turns this into the "$X of $Y" mismatch cue. Returns the summed
 * line amount so callers can render it.
 */
export function lineItemsTotalCents(form: LineItemFields): number {
  return form.line_items.reduce((sum, li) => sum + (li.amount_cents ?? 0), 0);
}
