import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillListItemType } from '@ramps/schemas/bills';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as billCacheHelpers from '../helpers/bill-cache.helpers';
import { BillRailProvider, useBillRail } from './BillRail.context';

/**
 * The rail provider's contracts, pinned at the hook boundary:
 *
 * - STATUS RESOLUTION rung 3 — with no detail entry and no active list, a
 *   WARMED neighbor list that knows the active id resolves the category (the
 *   chevron hop / guard-modal landing path).
 * - CHEVRON STATES — the warmers feed `resolveChevronState`, so each side
 *   settles on the neighbor's head bill.
 * - `seedFor` — reaches into warmed neighbors, so a hop's landing bill seeds
 *   before its category is active.
 * - `flipCategory` — the shown category flips SYNCHRONOUSLY to the target
 *   (the optimistic frame), and the flip retires once the landed id's
 *   resolution catches up — the rail is then simply showing the resolved
 *   category, indistinguishable from a plain hop.
 *
 * Network is faked at the `fetchRailBills` seam (hoisted map keyed like
 * `railBillsSwrKey`); `useParams` is a hoisted slot the tests move between
 * renders, exactly how the router hands the provider a new `[id]`.
 */
const { params, billsByKey } = vi.hoisted(() => ({
  params: { id: 'a1' },
  billsByKey: new Map<string, unknown>(),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: params.id }),
}));

vi.mock('../helpers/bill-cache.helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof billCacheHelpers>();
  return {
    ...actual,
    fetchRailBills: (statuses: readonly string[]) =>
      Promise.resolve(billsByKey.get(statuses.join(',')) ?? []),
  };
});

/** The seeded catalog shape — same fixture family as the tab/chevron tests. */
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
  {
    id: '4',
    name: 'For payment',
    code: 'for_payment',
    statuses: ['approved', 'scheduled', 'partially_paid'],
    sort_order: 3,
    created_by: null,
  },
];

const paymentTab = TABS[3]!;

/** The provider reads only `id` + `status` off rail items — cast keeps fixtures small. */
const bill = (id: string, status: string) => ({ id, status }) as BillListItemType;

beforeEach(() => {
  params.id = 'a1';
  billsByKey.clear();
  billsByKey.set('draft,missing_info', [bill('d1', 'draft'), bill('d2', 'missing_info')]);
  billsByKey.set('awaiting_approval', [bill('a1', 'awaiting_approval')]);
  billsByKey.set('approved,scheduled,partially_paid', [bill('p1', 'approved')]);
});

function Wrapper({ children }: { children: ReactNode }) {
  return (
    // A fresh Map per mount — no cache bleed between tests; dedupe off so a
    // re-keyed subscription fetches immediately.
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <BillRailProvider tabs={TABS} refs={{} as BillDetailRefsType}>
        {children}
      </BillRailProvider>
    </SWRConfig>
  );
}

function mountRail() {
  return renderHook(() => useBillRail(), { wrapper: Wrapper });
}

describe('BillRailProvider', () => {
  it('resolves the category from a warmed list (rung 3) and loads its bills', async () => {
    const view = mountRail();
    // Cold: no detail entry, no list — unknown, honestly loading.
    expect(view.result.current.statuses).toBeNull();
    expect(view.result.current.loading).toBe(true);

    await waitFor(() => {
      expect(view.result.current.statuses).toEqual(['awaiting_approval']);
      expect(view.result.current.loading).toBe(false);
    });
    expect(view.result.current.bills?.map((b) => b.id)).toEqual(['a1']);
  });

  it('settles both chevrons on the warmed neighbors’ head bills', async () => {
    const view = mountRail();
    await waitFor(() => {
      expect(view.result.current.chevronPrev.settled).toBe(true);
      expect(view.result.current.chevronNext.settled).toBe(true);
    });
    expect(view.result.current.chevronPrev.target).toMatchObject({
      billId: 'd1',
      tab: { code: 'drafts' },
    });
    expect(view.result.current.chevronNext.target).toMatchObject({
      billId: 'p1',
      tab: { code: 'for_payment' },
    });
  });

  /**
   * The Closed category, end to end through the provider — the seam the pure
   * helper tests can't reach. Note what the fixture does NOT have: a catalog
   * tab for rejected/archived. `CLOSED_TAB` supplies it, which means the
   * provider must (a) resolve a rejected bill's category to the pair, (b) warm
   * that pair under a key the rail's OWN subscription agrees with — a
   * mismatch there would warm one entry and read another, and the rail would
   * sit on skeletons forever — and (c) hand the bill a way out.
   */
  describe('the Closed category (rejected + archived)', () => {
    beforeEach(() => {
      // Archived FIRST in the raw list: the wire order is due-date across
      // statuses, so this also proves the landing respects the rail's grouping.
      billsByKey.set('rejected,archived', [bill('x1', 'archived'), bill('r1', 'rejected')]);
    });

    it('rails a rejected bill with its archived neighbors, and `next` walks out to Drafts', async () => {
      params.id = 'r1';
      const view = mountRail();

      await waitFor(() => expect(view.result.current.loading).toBe(false));
      expect(view.result.current.statuses).toEqual(['rejected', 'archived']);
      // Both states in one rail — not the rail of one this used to be.
      expect(view.result.current.bills?.map((b) => b.id)).toEqual(['x1', 'r1']);

      await waitFor(() => expect(view.result.current.chevronNext.settled).toBe(true));
      expect(view.result.current.chevronNext.target).toMatchObject({
        billId: 'd1',
        tab: { code: 'drafts' },
      });
    });

    it('wraps `prev` round the seam — Closed opens the ring, so `←` exits at the far end', async () => {
      params.id = 'r1';
      const view = mountRail();

      // The ring is a loop, so index 0 is not a dead end: `←` continues from
      // the tail. This fixture's catalog stops at For payment (no Paid tab),
      // so the far end IS For payment — the wrap lands on its head bill
      // rather than reporting a clamp.
      await waitFor(() => expect(view.result.current.chevronPrev.settled).toBe(true));
      expect(view.result.current.chevronPrev.target).toMatchObject({
        billId: 'p1',
        tab: { code: 'for_payment' },
      });
    });

    it('is reachable BACK from Drafts, landing on the rail’s first card', async () => {
      params.id = 'd1';
      const view = mountRail();

      await waitFor(() => expect(view.result.current.chevronPrev.settled).toBe(true));
      // 'x1' heads the raw list, but the rail sections Rejected above
      // Archived — so the hop selects 'r1', the first card you actually see.
      expect(view.result.current.chevronPrev.target).toMatchObject({
        billId: 'r1',
        tab: { code: 'closed', name: 'Closed' },
      });
    });
  });

  it('seedFor reaches warmed neighbors — a hop’s landing bill seeds pre-flip', async () => {
    const view = mountRail();
    await waitFor(() => expect(view.result.current.loading).toBe(false));
    expect(view.result.current.seedFor('p1')?.id).toBe('p1');
  });

  it('flipCategory flips the shown category NOW and retires once the landing resolves', async () => {
    const view = mountRail();
    await waitFor(() => expect(view.result.current.chevronNext.settled).toBe(true));

    // The optimistic half: same act(), no awaits — the flip must be sync.
    act(() => {
      view.result.current.flipCategory({ tab: paymentTab, billId: 'p1' });
    });
    expect(view.result.current.statuses).toEqual(paymentTab.statuses);
    // The warm list backs the flip — the flipped rail paints bills, not bars.
    await waitFor(() => {
      expect(view.result.current.bills?.map((b) => b.id)).toEqual(['p1']);
    });

    // The navigation lands: the route's [id] becomes the landing bill. The
    // sticky resolution catches up (rung 3 again) and the flip retires — the
    // shown category is now the RESOLVED one, same arrangement.
    params.id = 'p1';
    view.rerender();
    await waitFor(() => {
      expect(view.result.current.activeId).toBe('p1');
      expect(view.result.current.statuses).toEqual(paymentTab.statuses);
      expect(view.result.current.loading).toBe(false);
    });
  });
});
