import type { BillEditFormType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import {
  billDetailsCompleteness,
  billSubmitReady,
  lineItemsCompleteness,
  lineItemsTotalCents,
  purchaseOrderCompleteness,
  vendorCompleteness,
} from './section-completeness.helpers';

/** A fully-coded, complete form — each test relaxes one field to prove the gap. */
const base: BillEditFormType = {
  vendor_id: 'a0000000-0000-0000-0000-0000000000e1',
  entity_id: '22222222-2222-2222-2222-222222222201',
  invoice_number: 'WBM-4471',
  invoice_date: '2026-06-20',
  due_date: '2026-07-20',
  accounting_date: '2026-06-20',
  po_number: '',
  amount_cents: 128900,
  currency: 'USD',
  memo: '',
  line_items: [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      kind: 'expense',
      description: 'Paper & toner',
      qty: null,
      unit_price_cents: null,
      amount_cents: 89900,
      gl_account_id: '33333333-3333-3333-3333-333333333301',
      department_id: null,
      class_id: null,
      location_id: null,
      tax_code_id: null,
      custom_dimension_id: null,
      billable: false,
    },
  ],
};

describe('vendorCompleteness', () => {
  it('is complete with a vendor, incomplete without', () => {
    expect(vendorCompleteness(base)).toBe('complete');
    expect(vendorCompleteness({ ...base, vendor_id: null })).toBe('incomplete');
  });
});

describe('billDetailsCompleteness', () => {
  it('is complete with number + both dates', () => {
    expect(billDetailsCompleteness(base)).toBe('complete');
  });

  it('is incomplete when the invoice number is blank', () => {
    expect(billDetailsCompleteness({ ...base, invoice_number: '  ' })).toBe('incomplete');
  });

  it('is incomplete when a date is missing', () => {
    expect(billDetailsCompleteness({ ...base, due_date: null })).toBe('incomplete');
    expect(billDetailsCompleteness({ ...base, invoice_date: null })).toBe('incomplete');
  });
});

describe('purchaseOrderCompleteness', () => {
  it('is optional when blank, complete when set', () => {
    expect(purchaseOrderCompleteness(base)).toBe('optional');
    expect(purchaseOrderCompleteness({ ...base, po_number: 'PO-5521' })).toBe('complete');
  });
});

describe('lineItemsCompleteness', () => {
  it('is complete when every line has a GL account and amount', () => {
    expect(lineItemsCompleteness(base)).toBe('complete');
  });

  it('is incomplete with no lines (the OCR partial-extract state)', () => {
    expect(lineItemsCompleteness({ ...base, line_items: [] })).toBe('incomplete');
  });

  it('is incomplete when a line is uncoded', () => {
    const uncoded = { ...base.line_items[0]!, gl_account_id: null };
    expect(lineItemsCompleteness({ ...base, line_items: [uncoded] })).toBe('incomplete');
  });
});

describe('lineItemsTotalCents', () => {
  it('sums the line amounts', () => {
    expect(lineItemsTotalCents(base)).toBe(89900);
    expect(
      lineItemsTotalCents({
        ...base,
        line_items: [base.line_items[0]!, { ...base.line_items[0]!, amount_cents: 39000 }],
      }),
    ).toBe(128900);
  });

  it('is zero for an empty grid', () => {
    expect(lineItemsTotalCents({ ...base, line_items: [] })).toBe(0);
  });
});

describe('billSubmitReady', () => {
  it('is ready when the required sections all read complete', () => {
    expect(billSubmitReady(base)).toBe(true);
  });

  it('is not ready on the unmatched draft (no vendor)', () => {
    expect(billSubmitReady({ ...base, vendor_id: null })).toBe(false);
  });

  it('is not ready without the invoice trio', () => {
    expect(billSubmitReady({ ...base, invoice_number: '' })).toBe(false);
    expect(billSubmitReady({ ...base, due_date: null })).toBe(false);
  });

  it('is not ready with an empty or uncoded line grid', () => {
    expect(billSubmitReady({ ...base, line_items: [] })).toBe(false);
  });

  it('ignores the optional PO (base ships with a blank one)', () => {
    const withPo: BillEditFormType = { ...base, po_number: 'PO-5521' };
    expect(billSubmitReady(base)).toBe(true);
    expect(billSubmitReady(withPo)).toBe(true);
  });
});
