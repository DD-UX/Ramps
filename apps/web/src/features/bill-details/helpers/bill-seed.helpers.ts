import type { BillDetailType, BillListItemType } from '@ramps/schemas/bills';

/**
 * Synthesize a paintable `BillDetailType` from a rail list item — the SEED
 * tier of the detail screen's rendering ladder (full detail → rail seed →
 * skeletons).
 *
 * A rail item IS the bill header (every `BillSchema` column plus vendor_name
 * and flags), so the header-level concerns — vendor, invoice info, PO, memo,
 * amount, status — paint their real values from it. What the list shape
 * doesn't carry is DETAIL-ONLY data, filled here with its "not loaded" value:
 * empty collections and nulls. That's a LIE if rendered as truth (an empty
 * line-item grid reads as "this bill has no lines"), which is why the screen
 * passes the `seed` data level alongside: detail-only sections (which need
 * `full`) render their own skeletons instead of these placeholders, and
 * editing stays locked until the full record replaces them.
 */
export function billDetailFromSeed(item: BillListItemType): BillDetailType {
  return {
    ...item,
    entity_name: null,
    line_items: [],
    approvals: [],
    approval_stages: [],
    payment: null,
  };
}

/**
 * The ladder's bottom rung — a `BillDetailType`-shaped nothing, so the REAL
 * screen (provider, panes, tab bars, section frames) can mount before any
 * data exists at all and every section renders its own skeleton against the
 * `skeleton` data level. Values here are never painted as truth: sections
 * skeletonize below their level, editing is locked below `full`, and the
 * whole record is replaced (form reset included) the moment the ladder
 * climbs. Type-level placeholders only — nothing validates or persists this.
 */
export function billDetailPlaceholder(id: string): BillDetailType {
  return {
    id,
    vendor_id: null,
    entity_id: null,
    created_by: id,
    source: 'manual',
    invoice_number: null,
    invoice_date: null,
    due_date: null,
    accounting_date: null,
    po_number: null,
    amount_cents: 0,
    currency: 'USD',
    memo: null,
    document_url: null,
    status: 'draft',
    vendor_name: null,
    entity_name: null,
    flags: [],
    line_items: [],
    approvals: [],
    approval_stages: [],
    payment: null,
  };
}
