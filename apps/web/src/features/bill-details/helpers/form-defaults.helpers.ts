import type { BillDetailType, BillEditFormType } from '@ramps/schemas/bills';

/**
 * Project a fetched `BillDetailType` into the react-hook-form default values
 * ({@link BillEditFormType}) the detail page edits.
 *
 * The entity's nullable text columns (`invoice_number`, `po_number`, `memo`)
 * become `''` so they bind to controlled `<input>`s without React's
 * "uncontrolled → controlled" warning; the nullable dates/ids stay `null`
 * (a date picker / select's empty state). Line items drop their server-owned
 * `bill_id` / `line_no` / provenance and keep just the editable coding fields,
 * carrying `id` so a save can tell an edit from an insert.
 */
export function billToFormDefaults(bill: BillDetailType): BillEditFormType {
  return {
    vendor_id: bill.vendor_id,
    entity_id: bill.entity_id,
    invoice_number: bill.invoice_number ?? '',
    invoice_date: bill.invoice_date,
    due_date: bill.due_date,
    accounting_date: bill.accounting_date,
    po_number: bill.po_number ?? '',
    amount_cents: bill.amount_cents,
    currency: bill.currency,
    memo: bill.memo ?? '',
    line_items: bill.line_items.map((li) => ({
      id: li.id,
      kind: li.kind,
      description: li.description,
      qty: li.qty,
      unit_price_cents: li.unit_price_cents,
      amount_cents: li.amount_cents,
      gl_account_id: li.gl_account_id,
      department_id: li.department_id,
      class_id: li.class_id,
      location_id: li.location_id,
      tax_code_id: li.tax_code_id,
      custom_dimension_id: li.custom_dimension_id,
      billable: li.billable,
    })),
  };
}
