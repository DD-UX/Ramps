import type { BillListItemType, BillListResponseType } from '@ramps/schemas/bills';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CommandPaletteProvider } from '../context/CommandPalette.context';
import { CommandPaletteHost } from './CommandPaletteHost';
import { CommandPaletteTrigger } from './CommandPaletteTrigger';

/**
 * The ⌘K palette's app wiring — the promises the primitive can't keep alone:
 *
 * - it is CLOSED until asked, and the chord that opens it also closes it;
 * - at rest it is a menu of the destinations that actually EXIST (a disabled
 *   nav entry must never appear — the palette can't rebuild the dead-links
 *   problem it was built to make up for);
 * - a real term searches the SERVER with NO status filter, so one query
 *   reaches every category rather than whichever tab is on screen;
 * - a truncated result set SAYS so and hands the query to the real table,
 *   instead of quietly passing six rows off as all of them;
 * - rows are anchors to the bill, which is what lets the unsaved-changes
 *   guard veto a jump.
 *
 * The fetcher is mocked at the cache-helper seam (not at `fetch`) so the
 * arguments themselves — `[]` statuses, the page size — are assertable.
 * `next/link` flattens to a plain anchor; there's no app router in jsdom.
 */
const fetchBillsList = vi.hoisted(() => vi.fn());
vi.mock('@/features/bill-details/helpers/bill-cache.helpers', () => ({ fetchBillsList }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/bills',
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    prefetch: _prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
}));

function bill(overrides: Partial<BillListItemType>): BillListItemType {
  return {
    id: 'bill-1',
    vendor_name: 'Acme Supply',
    invoice_number: 'INV-2042',
    due_date: '2026-03-03',
    amount_cents: 125_000,
    currency: 'USD',
    status: 'awaiting_approval',
    ...overrides,
  } as BillListItemType;
}

function respond(bills: BillListItemType[], total = bills.length): BillListResponseType {
  return { bills, total };
}

/** A fresh SWR cache per render, so one test's results can't seed the next. */
function renderPalette() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CommandPaletteProvider>
        <CommandPaletteTrigger />
        <CommandPaletteHost />
      </CommandPaletteProvider>
    </SWRConfig>,
  );
}

function pressCommandK() {
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    metaKey: true,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

beforeAll(() => {
  // jsdom has no layout, so no scrollIntoView. The palette keeps its active
  // row on screen with it; a no-op is the honest stand-in.
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  fetchBillsList.mockReset();
  fetchBillsList.mockResolvedValue(respond([]));
});

describe('CommandPaletteHost', () => {
  it('stays closed until it is asked for', () => {
    renderPalette();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on ⌘/Ctrl + K, and swallows the browser default', async () => {
    renderPalette();

    const event = pressCommandK();
    expect(event.defaultPrevented).toBe(true);
    await screen.findByRole('dialog', { name: /command palette/i });
  });

  it('closes on a second ⌘/Ctrl + K', async () => {
    renderPalette();

    pressCommandK();
    await screen.findByRole('dialog');

    pressCommandK();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens from the top bar trigger', async () => {
    const user = userEvent.setup();
    renderPalette();

    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('dialog');
  });

  it('offers only built destinations at rest, and searches nothing', async () => {
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    expect(screen.getByRole('option', { name: /bill pay/i })).toHaveAttribute('href', '/bills');
    expect(screen.getByRole('option', { name: /vendors/i })).toHaveAttribute('href', '/vendors');
    // Part of the IA, but not a place you can go — so not a result.
    expect(screen.queryByRole('option', { name: /insights/i })).not.toBeInTheDocument();
    expect(fetchBillsList).not.toHaveBeenCalled();
  });

  it('does not query the server for a one-character term', async () => {
    const user = userEvent.setup();
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'a');
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('a'));
    expect(fetchBillsList).not.toHaveBeenCalled();
  });

  it('searches every category — no status filter — and lists the bills it finds', async () => {
    const user = userEvent.setup();
    fetchBillsList.mockResolvedValue(respond([bill({})]));
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'acme');

    await waitFor(() => expect(fetchBillsList).toHaveBeenCalled());
    // Empty statuses = unfiltered, which is the whole point: a palette that
    // only found rows from the current tab would be another half-truth.
    expect(fetchBillsList).toHaveBeenLastCalledWith([], 'acme', 1, expect.any(Number));

    const row = await screen.findByRole('option', { name: /acme supply/i });
    expect(row).toHaveAttribute('href', '/bills/bill-1');
    expect(row).toHaveTextContent('INV-2042');
  });

  it('debounces a burst of keystrokes into a single query', async () => {
    const user = userEvent.setup();
    fetchBillsList.mockResolvedValue(respond([bill({})]));
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'acme');
    await waitFor(() => expect(fetchBillsList).toHaveBeenCalled());
    expect(fetchBillsList).toHaveBeenCalledTimes(1);
  });

  it('admits when the results are truncated, and hands the query to the table', async () => {
    const user = userEvent.setup();
    fetchBillsList.mockResolvedValue(respond([bill({})], 41));
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'acme');

    const overflow = await screen.findByRole('option', { name: /see all 41 matches/i });
    expect(overflow).toHaveAttribute('href', '/bills?q=acme');
  });

  it('shows no overflow row when the window already holds every match', async () => {
    const user = userEvent.setup();
    fetchBillsList.mockResolvedValue(respond([bill({})]));
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'acme');
    await screen.findByRole('option', { name: /acme supply/i });
    expect(screen.queryByRole('option', { name: /see all/i })).not.toBeInTheDocument();
  });

  it('walks the list with ↑/↓ and opens the ACTIVE row with Enter', async () => {
    const user = userEvent.setup();
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    const field = screen.getByRole('combobox', { name: 'Search' });
    const [first, second] = screen.getAllByRole('option');
    // Focus never leaves the field — the active row is pointed at instead.
    expect(field).toHaveAttribute('aria-activedescendant', first?.id);

    await user.keyboard('{ArrowDown}');
    expect(field).toHaveAttribute('aria-activedescendant', second?.id);
    await user.keyboard('{ArrowUp}');
    expect(field).toHaveAttribute('aria-activedescendant', first?.id);

    // Enter CLICKS the row's own anchor rather than calling a handler, so the
    // keyboard and the mouse take one path through the navigation guard.
    const clicked: EventTarget[] = [];
    document.addEventListener('click', (event) => {
      event.preventDefault();
      if (event.target) clicked.push(event.target);
    });
    await user.keyboard('{ArrowDown}{Enter}');
    expect(clicked.at(0)).toBe(second);
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('forgets the previous term when reopened', async () => {
    const user = userEvent.setup();
    renderPalette();
    pressCommandK();
    await screen.findByRole('dialog');

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'acme');
    pressCommandK();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    pressCommandK();
    await screen.findByRole('dialog');
    expect(screen.getByRole('combobox', { name: 'Search' })).toHaveValue('');
  });
});
