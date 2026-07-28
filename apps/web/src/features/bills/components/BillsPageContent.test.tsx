import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { render, screen, within } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BillsPageContent } from './BillsPageContent';

/**
 * BillsPageContent is the Bill Pay surface AND its derivation engine: the RSC
 * bootstrap hands it one whole category, and `?tab=` / `?q=` / `?page=` are
 * client derivations over the SWR-cached rows (see the component docblock).
 * These tests pin the composition (heading, badge roll-up, bills reaching the
 * table) and the derivations (URL-driven active tab, client search filter,
 * client page window + clamp).
 *
 * The URL is the input, so `useSearchParams` is a mutable stub set per test.
 * Each render gets an ISOLATED SWR cache (`provider: () => new Map()`) with
 * mount revalidation off — the component under test must work from its
 * bootstrap payload alone, and a shared cache would bleed one test's seed
 * into the next.
 */
let mockSearch = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/bills',
  useSearchParams: () => new URLSearchParams(mockSearch),
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
    entity_name: null,
    flags: [],
    ...overrides,
  };
}

type ContentProps = Partial<Parameters<typeof BillsPageContent>[0]>;

function renderContent(props: ContentProps = {}) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnMount: false }}>
      <BillsPageContent
        initialBills={[]}
        pageSize={10}
        tabs={TABS}
        countsByStatus={{}}
        search={null}
        {...props}
      />
    </SWRConfig>,
  );
}

beforeEach(() => {
  mockSearch = '';
});

describe('BillsPageContent', () => {
  it('renders the Bill Pay heading', () => {
    renderContent();
    expect(screen.getByRole('heading', { name: 'Bill Pay' })).toBeInTheDocument();
  });

  it('rolls the per-status counts up into each tab badge', () => {
    renderContent({ countsByStatus: COUNTS });
    // Overview = grand total (7), Drafts = draft+missing_info (3), History = paid (4).
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveTextContent('7');
    expect(screen.getByRole('tab', { name: /drafts/i })).toHaveTextContent('3');
    expect(screen.getByRole('tab', { name: /history/i })).toHaveTextContent('4');
  });

  it('passes the bootstrap bills down into the table', () => {
    mockSearch = 'tab=history';
    renderContent({ initialBills: [makeBill({ vendor_name: 'Globex' })] });
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('seeds the toolbar search field from the ?q= it loaded with', () => {
    renderContent({ search: 'acme' });
    expect(screen.getByRole('searchbox', { name: /search bills/i })).toHaveValue('acme');
  });

  it('marks the URL-named tab as selected', () => {
    mockSearch = 'tab=drafts';
    renderContent({ countsByStatus: COUNTS });
    const selected = screen
      .getAllByRole('tab')
      .filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Drafts');
  });

  it('filters the cached rows client-side from ?q=', () => {
    mockSearch = 'q=globex';
    renderContent({
      initialBills: [
        makeBill({ id: 'a', vendor_name: 'Acme Co' }),
        makeBill({ id: 'b', vendor_name: 'Globex' }),
      ],
    });
    const body = document.querySelector('tbody') as HTMLElement;
    expect(within(body).getByText('Globex')).toBeInTheDocument();
    expect(within(body).queryByText('Acme Co')).not.toBeInTheDocument();
  });

  it('windows the rows to ?page= and clamps a page past the end', () => {
    // 11 bills, page size 10 → two pages; row 11 is the only one on page 2.
    const bills = Array.from({ length: 11 }, (_, i) =>
      makeBill({ id: `bill-${i + 1}`, vendor_name: `Vendor ${i + 1}` }),
    );
    // ?page=9 must clamp to the real last page (2), not show an empty window.
    mockSearch = 'page=9';
    renderContent({ initialBills: bills });
    const body = document.querySelector('tbody') as HTMLElement;
    expect(within(body).getByText('Vendor 11')).toBeInTheDocument();
    expect(within(body).queryByText('Vendor 1')).not.toBeInTheDocument();
  });
});
