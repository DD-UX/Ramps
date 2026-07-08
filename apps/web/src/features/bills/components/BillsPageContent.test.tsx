import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BillsPageContent } from './BillsPageContent';

/**
 * BillsPageContent is the Bill Pay surface: the title, the category tabs (with
 * per-tab count badges rolled up from the per-status counts), the toolbar, and
 * the table. It's presentation only — the page does the data work. These tests
 * pin the composition: the heading renders, each tab shows its rolled-up badge,
 * and the bills reach the table.
 *
 * It renders the client BillsTabs/BillsToolbar leaves, so the App Router hooks
 * are mocked to inert stubs (this test asserts render, not navigation).
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/bills',
  useSearchParams: () => new URLSearchParams(''),
}));

const TABS: BillTabType[] = [
  { id: '1', name: 'Overview', code: 'overview', statuses: [], sort_order: 0, created_by: null },
  {
    id: '2',
    name: 'Drafts',
    code: 'drafts',
    statuses: ['draft', 'missing_info'],
    sort_order: 1,
    created_by: null,
  },
  {
    id: '3',
    name: 'History',
    code: 'history',
    statuses: ['paid'],
    sort_order: 2,
    created_by: null,
  },
];

const COUNTS: Partial<Record<BillStatusType, number>> = {
  draft: 2,
  missing_info: 1,
  paid: 4,
};

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

describe('BillsPageContent', () => {
  it('renders the Bill Pay heading', () => {
    render(
      <BillsPageContent
        bills={[]}
        total={0}
        page={1}
        pageSize={10}
        tabs={TABS}
        activeCode="overview"
        countsByStatus={{}}
        search={null}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Bill Pay' })).toBeInTheDocument();
  });

  it('rolls the per-status counts up into each tab badge', () => {
    render(
      <BillsPageContent
        bills={[]}
        total={0}
        page={1}
        pageSize={10}
        tabs={TABS}
        activeCode="overview"
        countsByStatus={COUNTS}
        search={null}
      />,
    );
    // Overview = grand total (7), Drafts = draft+missing_info (3), History = paid (4).
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveTextContent('7');
    expect(screen.getByRole('tab', { name: /drafts/i })).toHaveTextContent('3');
    expect(screen.getByRole('tab', { name: /history/i })).toHaveTextContent('4');
  });

  it('passes the bills down into the table', () => {
    render(
      <BillsPageContent
        bills={[makeBill({ vendor_name: 'Globex' })]}
        total={1}
        page={1}
        pageSize={10}
        tabs={TABS}
        activeCode="history"
        countsByStatus={COUNTS}
        search={null}
      />,
    );
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('seeds the toolbar search field from the ?q= it loaded with', () => {
    render(
      <BillsPageContent
        bills={[]}
        total={0}
        page={1}
        pageSize={10}
        tabs={TABS}
        activeCode="overview"
        countsByStatus={{}}
        search="acme"
      />,
    );
    expect(screen.getByRole('searchbox', { name: /search bills/i })).toHaveValue('acme');
  });

  it('marks the active tab as selected', () => {
    render(
      <BillsPageContent
        bills={[]}
        total={0}
        page={1}
        pageSize={10}
        tabs={TABS}
        activeCode="drafts"
        countsByStatus={COUNTS}
        search={null}
      />,
    );
    const selected = screen
      .getAllByRole('tab')
      .filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Drafts');
  });
});
