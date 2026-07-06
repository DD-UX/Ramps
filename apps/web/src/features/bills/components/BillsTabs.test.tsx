import type { BillTabType } from '@ramps/schemas/bill-tabs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BillsTabs } from './BillsTabs';

/**
 * BillsTabs is the render layer over the tab catalog: it maps rows → kit Tabs,
 * marks the active one, and — on click — navigates via `tabHref` (default drops
 * ?tab=, everything else gets ?tab=<code>). The href math is unit-tested in
 * bill-tabs.helpers.test; here we prove the WIRING: the catalog renders, the
 * active tab is selected, counts show, and a click routes to the right URL.
 *
 * The App Router hooks have no provider under vitest, so we mock them: a stub
 * router whose push we assert, and a fixed pathname.
 */
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/bills',
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
    name: 'For approval',
    code: 'for_approval',
    statuses: ['awaiting_approval'],
    sort_order: 2,
    created_by: null,
  },
];

describe('BillsTabs', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders one tab per catalog row, in order', () => {
    render(<BillsTabs tabs={TABS} activeCode="overview" />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Overview',
      'Drafts',
      expect.stringContaining('For approval'),
    ]);
  });

  it('marks the active tab as selected (and only it)', () => {
    render(<BillsTabs tabs={TABS} activeCode="drafts" />);
    const selected = screen.getAllByRole('tab').filter((t) => t.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('Drafts');
  });

  it('renders the count badge for a tab', () => {
    render(
      <BillsTabs
        tabs={TABS}
        activeCode="overview"
        counts={{ overview: 9, drafts: 3, for_approval: 2 }}
      />,
    );
    // For approval carries a badge of 2.
    expect(screen.getByRole('tab', { name: /for approval/i })).toHaveTextContent('2');
  });

  it('navigates with ?tab=<code> when a non-default tab is clicked', async () => {
    const user = userEvent.setup();
    render(<BillsTabs tabs={TABS} activeCode="overview" />);
    await user.click(screen.getByRole('tab', { name: /drafts/i }));
    expect(push).toHaveBeenCalledExactlyOnceWith('/bills?tab=drafts');
  });

  it('drops the param when the default (first) tab is clicked', async () => {
    const user = userEvent.setup();
    render(<BillsTabs tabs={TABS} activeCode="drafts" />);
    await user.click(screen.getByRole('tab', { name: /overview/i }));
    expect(push).toHaveBeenCalledExactlyOnceWith('/bills');
  });
});
