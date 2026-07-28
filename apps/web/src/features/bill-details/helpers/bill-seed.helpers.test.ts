import type { BillListItemType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import { billDetailFromSeed, billDetailPlaceholder } from './bill-seed.helpers';

/** A rail list item — every header column real, as the list endpoint returns. */
const RAIL_ITEM: BillListItemType = {
  id: 'b0000000-0000-0000-0000-00000000d001',
  vendor_id: 'a0000000-0000-0000-0000-00000000a001',
  entity_id: null,
  created_by: 'c0000000-0000-0000-0000-00000000c001',
  source: 'manual',
  invoice_number: 'INV-042',
  invoice_date: '2026-07-01',
  due_date: '2026-08-01',
  accounting_date: null,
  po_number: 'PO-7',
  amount_cents: 123_45,
  currency: 'USD',
  memo: 'Quarterly retainer',
  document_url: null,
  status: 'awaiting_approval',
  vendor_name: 'Trashlab Supply Co.',
  flags: [],
};

describe('billDetailFromSeed', () => {
  it('carries every header column through as truth — a rail item IS the bill header', () => {
    const seeded = billDetailFromSeed(RAIL_ITEM);
    // The seed must not rewrite anything the list already knows.
    for (const [key, value] of Object.entries(RAIL_ITEM)) {
      expect(seeded[key as keyof BillListItemType]).toEqual(value);
    }
  });

  it('fills detail-only concerns with their "not loaded" values, never invented data', () => {
    const seeded = billDetailFromSeed(RAIL_ITEM);
    expect(seeded.entity_name).toBeNull();
    expect(seeded.line_items).toEqual([]);
    expect(seeded.approvals).toEqual([]);
    expect(seeded.approval_stages).toEqual([]);
    expect(seeded.payment).toBeNull();
  });
});

describe('billDetailPlaceholder', () => {
  it('keeps the route id — the one real thing a cold deep link knows', () => {
    expect(billDetailPlaceholder(RAIL_ITEM.id).id).toBe(RAIL_ITEM.id);
  });

  it('is empty-by-construction: no amount, no vendor, no collections', () => {
    const placeholder = billDetailPlaceholder(RAIL_ITEM.id);
    expect(placeholder.amount_cents).toBe(0);
    expect(placeholder.vendor_name).toBeNull();
    expect(placeholder.line_items).toEqual([]);
    expect(placeholder.payment).toBeNull();
  });
});
