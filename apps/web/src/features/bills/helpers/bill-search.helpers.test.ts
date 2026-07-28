import type { BillListItemType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import { filterBillsBySearch } from './bill-search.helpers';

/**
 * filterBillsBySearch mirrors the facade's toolbar ILIKE (see the helper's
 * docblock for the field list and the `*` wildcard contract). These tests pin
 * the mirrored semantics: the OR across the four fields, case-insensitivity,
 * the in-order wildcard, and the blank-term no-op.
 */
function makeBill(overrides: Partial<BillListItemType> = {}): BillListItemType {
  return {
    id: 'bill-1',
    vendor_id: 'vendor-1',
    entity_id: null,
    created_by: 'user-1',
    source: 'manual',
    invoice_number: 'INV-100',
    invoice_date: '2025-12-01',
    due_date: '2025-12-17',
    accounting_date: null,
    po_number: null,
    amount_cents: 100_000,
    currency: 'USD',
    memo: null,
    document_url: null,
    status: 'paid',
    vendor_name: 'Acme Co',
    entity_name: null,
    flags: [],
    ...overrides,
  };
}

describe('filterBillsBySearch', () => {
  const bills = [
    makeBill({ id: 'a', invoice_number: 'INV-100', vendor_name: 'Acme Co' }),
    makeBill({ id: 'b', invoice_number: 'INV-200', vendor_name: 'Globex', po_number: 'PO-7' }),
    makeBill({ id: 'c', invoice_number: null, vendor_name: null, memo: 'Quarterly retainer' }),
  ];

  it('a blank / null term is a no-op — everything passes', () => {
    expect(filterBillsBySearch(bills, null)).toHaveLength(3);
    expect(filterBillsBySearch(bills, '   ')).toHaveLength(3);
  });

  it('matches case-insensitively across invoice #, PO, memo, and vendor name', () => {
    expect(filterBillsBySearch(bills, 'inv-100').map((b) => b.id)).toEqual(['a']);
    expect(filterBillsBySearch(bills, 'po-7').map((b) => b.id)).toEqual(['b']);
    expect(filterBillsBySearch(bills, 'RETAINER').map((b) => b.id)).toEqual(['c']);
    expect(filterBillsBySearch(bills, 'glob').map((b) => b.id)).toEqual(['b']);
  });

  it('null fields never match — they are skipped, not coerced', () => {
    expect(filterBillsBySearch(bills, 'acme').map((b) => b.id)).toEqual(['a']);
  });

  it('`*` is an in-order wildcard within one field, like the ILIKE %', () => {
    expect(filterBillsBySearch(bills, 'inv*200').map((b) => b.id)).toEqual(['b']);
    // Order matters: the fragments must appear left to right.
    expect(filterBillsBySearch(bills, '200*inv')).toHaveLength(0);
    // A bare `*` sanitizes to nothing → no-op, same as the server.
    expect(filterBillsBySearch(bills, '*')).toHaveLength(3);
  });

  it('fragments must land in the SAME field — no cross-field stitching', () => {
    // 'globex' is the vendor, 'po-7' the PO — same bill, different fields.
    expect(filterBillsBySearch(bills, 'globex*po-7')).toHaveLength(0);
  });
});
