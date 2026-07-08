import type { BillFlagType, BillListItemType } from '@ramps/schemas/bills';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BillsTable } from './BillsTable';

// The table reads the App Router hooks — `useRouter` for row-click + page
// navigation, `usePathname`/`useSearchParams` to rebuild the `?page=` URL — so
// stub all three to render outside an App Router context.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/bills',
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * BillsTable is a thin client wrapper over the kit Table: it owns the column
 * definitions and the red ↳ flag-annotation rows. The data is pre-validated,
 * so this layer only maps fields to cells — these tests pin that mapping:
 * vendor fallback, the em-dash for a missing invoice #, the formatted due date,
 * the status pill's label, the money cell, and the duplicate flag's "View
 * original" link pointing at the related bill.
 */
function makeFlag(overrides: Partial<BillFlagType> = {}): BillFlagType {
  return {
    id: 'flag-1',
    bill_id: 'bill-1',
    type: 'overbilling',
    message: 'Amount exceeds the PO by $500',
    related_bill_id: null,
    amount_cents: 50_000,
    dismissed: false,
    ...overrides,
  };
}

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
    amount_cents: 129_755,
    currency: 'USD',
    memo: null,
    document_url: null,
    status: 'paid',
    vendor_name: 'Acme Co',
    flags: [],
    ...overrides,
  };
}

describe('BillsTable', () => {
  it('renders a vendor name, invoice #, formatted due date, status, and amount', () => {
    render(<BillsTable bills={[makeBill()]} total={1} page={1} pageSize={10} />);
    const body = document.querySelector('tbody') as HTMLElement;
    expect(within(body).getByText('Acme Co')).toBeInTheDocument();
    expect(within(body).getByText('INV-100')).toBeInTheDocument();
    expect(within(body).getByText('Dec 17, 2025')).toBeInTheDocument();
    expect(within(body).getByText('Paid')).toBeInTheDocument();
    // The row's money cell (the footer carries the same total for a single row).
    expect(within(body).getByText('$1,297.55')).toBeInTheDocument();
  });

  it('shows the "No vendor" placeholder for a vendor-less draft', () => {
    render(
      <BillsTable bills={[makeBill({ vendor_name: null, status: 'missing_info' })]} total={1} page={1} pageSize={10} />,
    );
    expect(screen.getByText('No vendor')).toBeInTheDocument();
  });

  it('renders an em dash for a missing invoice number and due date', () => {
    render(<BillsTable bills={[makeBill({ invoice_number: null, due_date: null })]} total={1} page={1} pageSize={10} />);
    // Two em dashes: invoice # and due date.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('annotates a duplicate flag with a link to the original bill', () => {
    const bill = makeBill({
      flags: [
        makeFlag({
          type: 'duplicate',
          message: 'Possible duplicate of INV-99',
          related_bill_id: 'bill-99',
        }),
      ],
    });
    render(<BillsTable bills={[bill]} total={1} page={1} pageSize={10} />);
    expect(screen.getByText(/possible duplicate/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /view original/i });
    expect(link).toHaveAttribute('href', '/bills/bill-99');
  });

  it('renders a non-duplicate flag message without a link', () => {
    const bill = makeBill({ flags: [makeFlag({ message: 'Amount exceeds the PO' })] });
    render(<BillsTable bills={[bill]} total={1} page={1} pageSize={10} />);
    expect(screen.getByText('Amount exceeds the PO')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view original/i })).not.toBeInTheDocument();
  });

  it('reports the total row count in the footer, independent of the page size', () => {
    render(<BillsTable bills={[makeBill(), makeBill({ id: 'bill-2' })]} total={42} page={1} pageSize={10} />);
    // The pagination band shows the aggregate "of N" total.
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('renders one status pill per row', () => {
    const bills = [
      makeBill({ id: 'a', status: 'paid', vendor_name: 'A' }),
      makeBill({ id: 'b', status: 'draft', vendor_name: 'B' }),
    ];
    render(<BillsTable bills={bills} total={2} page={1} pageSize={10} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('sums the visible rows into the footer money total', () => {
    const bills = [
      makeBill({ id: 'a', amount_cents: 100_000, vendor_name: 'A' }),
      makeBill({ id: 'b', amount_cents: 50_000, vendor_name: 'B' }),
    ];
    render(<BillsTable bills={bills} total={2} page={1} pageSize={10} />);
    // $1,500.00 aggregate across the two rows lives in the pagination band —
    // a <div> pinned to the scroll floor (NOT a <tfoot>: a sticky tfoot can't
    // travel past the table's bottom to the page floor).
    const band = document.querySelector('[data-table-footer="pagination"]');
    expect(band).not.toBeNull();
    expect(within(band as HTMLElement).getByText(/\$1,500\.00/)).toBeInTheDocument();
  });
});
