import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { railBillsSwrKey } from '@/features/bill-details/helpers/bill-cache.helpers';

import { BillsPageContent } from './BillsPageContent';

/**
 * BillsPageContent is the Bill Pay surface over a SERVER-owned query: the RSC
 * bootstrap hands it the URL's exact window (`?tab=` + `?q=` + `?page=`), and
 * the component renders that payload VERBATIM — no client-side filter, no
 * client-side slice (see the component docblock). These tests pin the
 * composition (heading, badge roll-up, the payload reaching the table, the
 * URL-named tab selected) and the two side jobs: healing a stranded `?page=`
 * via a history REPLACE, and seeding the rail cache ONLY when the bootstrap
 * payload is provably a whole category.
 *
 * The URL is the input, so `useSearchParams` is a mutable stub set per test.
 * Each render gets an ISOLATED SWR cache (`provider: () => new Map()`) with
 * mount revalidation off — the component under test must work from its
 * bootstrap payload alone, and a shared cache would bleed one test's seed
 * into the next. The cache Map is returned so the rail-seed tests can inspect
 * exactly what the component wrote into it.
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
    name: 'Paid',
    code: 'paid',
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
  const cache = new Map();
  const view = render(
    <SWRConfig value={{ provider: () => cache, revalidateOnMount: false }}>
      <BillsPageContent
        initialBills={[]}
        initialTotal={0}
        pageSize={10}
        tabs={TABS}
        countsByStatus={{}}
        search={null}
        {...props}
      />
    </SWRConfig>,
  );
  return { cache, ...view };
}

beforeEach(() => {
  mockSearch = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BillsPageContent', () => {
  it('renders the Bill Pay heading', () => {
    renderContent();
    expect(screen.getByRole('heading', { name: 'Bill Pay' })).toBeInTheDocument();
  });

  it('rolls the per-status counts up into each tab badge', () => {
    renderContent({ countsByStatus: COUNTS });
    // Overview = grand total (7), Drafts = draft+missing_info (3), Paid = paid (4).
    expect(screen.getByRole('tab', { name: /overview/i })).toHaveTextContent('7');
    expect(screen.getByRole('tab', { name: /drafts/i })).toHaveTextContent('3');
    expect(screen.getByRole('tab', { name: /paid/i })).toHaveTextContent('4');
  });

  it('passes the bootstrap bills down into the table', () => {
    mockSearch = 'tab=paid';
    renderContent({ initialBills: [makeBill({ vendor_name: 'Globex' })], initialTotal: 1 });
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

  it('renders a searched window VERBATIM — filtering is the server’s, not a client re-derivation', () => {
    // Under ?q= the bootstrap payload IS the server's filtered result. If the
    // component re-filtered client-side, 'Acme Co' (which doesn't match the
    // term) would vanish — it must not: the payload is trusted as-is.
    mockSearch = 'q=globex';
    renderContent({
      search: 'globex',
      initialBills: [
        makeBill({ id: 'a', vendor_name: 'Acme Co' }),
        makeBill({ id: 'b', vendor_name: 'Globex' }),
      ],
      initialTotal: 2,
    });
    const body = document.querySelector('tbody') as HTMLElement;
    expect(within(body).getByText('Globex')).toBeInTheDocument();
    expect(within(body).getByText('Acme Co')).toBeInTheDocument();
  });

  it('heals a ?page= past the end with a history REPLACE to the real last page', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    // The server answers an out-of-range window with no rows but the TRUE
    // total: 11 rows at page size 10 → the real last page is 2.
    mockSearch = 'page=9';
    renderContent({ initialBills: [], initialTotal: 11 });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/bills?page=2');
  });

  it('healing to page 1 drops the ?page= param entirely', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    // An empty category: any ?page= deeplink collapses to page 1 — the
    // canonical URL for page 1 carries no param at all.
    mockSearch = 'page=5';
    renderContent({ initialBills: [], initialTotal: 0 });
    expect(replaceState).toHaveBeenCalledWith(null, '', '/bills');
  });

  it('leaves the URL alone when the page is in range', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    mockSearch = 'page=2';
    renderContent({ initialBills: [makeBill()], initialTotal: 11 });
    expect(replaceState).not.toHaveBeenCalled();
  });

  it('seeds the rail cache when the bootstrap payload IS the whole category', async () => {
    mockSearch = 'tab=paid';
    const bills = [makeBill({ id: 'a' }), makeBill({ id: 'b' })];
    const { cache } = renderContent({ initialBills: bills, initialTotal: 2 });
    await waitFor(() => {
      expect((cache.get(railBillsSwrKey(['paid'])) as { data?: unknown })?.data).toEqual(bills);
    });
  });

  it('never seeds the rail from a searched or windowed payload', async () => {
    // A filtered page (search != null) and a partial window (length < total)
    // must both refuse: a rail group seeded from either would silently
    // amputate the rail's category.
    mockSearch = 'tab=paid';
    const { cache } = renderContent({
      search: 'acme',
      initialBills: [makeBill()],
      initialTotal: 1,
    });
    await act(async () => {});
    expect(cache.get(railBillsSwrKey(['paid']))).toBeUndefined();

    mockSearch = 'tab=paid&page=2';
    const { cache: windowed } = renderContent({ initialBills: [makeBill()], initialTotal: 11 });
    await act(async () => {});
    expect(windowed.get(railBillsSwrKey(['paid']))).toBeUndefined();
  });
});
