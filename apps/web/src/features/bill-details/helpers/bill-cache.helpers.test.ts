import type { BillDetailType } from '@ramps/schemas/bills';
import type { ScopedMutator } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  billDetailSwrKey,
  billsListSwrKey,
  fetchBillsList,
  railBillsSwrKey,
  reconcileBillCaches,
} from './bill-cache.helpers';

const BILL_ID = 'b0000000-0000-0000-0000-00000000d001';

/** A minimal detail-shaped bill — the seeded path only forwards it, never reads into it. */
const RE_READ_BILL = { id: BILL_ID, status: 'approved' } as unknown as BillDetailType;

describe('SWR keys', () => {
  it('rail key is per CATEGORY — same statuses, same key, whatever the active bill', () => {
    expect(railBillsSwrKey(['missing_info', 'draft'])).toBe(
      railBillsSwrKey(['missing_info', 'draft']),
    );
    // Order is part of the identity: the arrangement IS the category.
    expect(railBillsSwrKey(['draft', 'missing_info'])).not.toBe(
      railBillsSwrKey(['missing_info', 'draft']),
    );
  });

  it('detail key is per bill', () => {
    expect(billDetailSwrKey(BILL_ID)).toContain(BILL_ID);
    expect(billDetailSwrKey(BILL_ID)).not.toBe(billDetailSwrKey('other'));
  });

  it('list key carries the WHOLE query — statuses, term and page each re-key', () => {
    const base = billsListSwrKey(['paid'], null, 1);
    expect(billsListSwrKey(['paid'], null, 1)).toBe(base);
    // Each axis names a DIFFERENT server result, so each changes the identity.
    expect(billsListSwrKey(['draft'], null, 1)).not.toBe(base);
    expect(billsListSwrKey(['paid'], 'acme', 1)).not.toBe(base);
    expect(billsListSwrKey(['paid'], null, 2)).not.toBe(base);
    // A window key is never a rail key — the namespaces must not collide.
    expect(base).not.toBe(railBillsSwrKey(['paid']));
  });
});

describe('reconcileBillCaches', () => {
  it("revalidates the bill's detail entry and every rail category entry", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    await reconcileBillCaches(mutate as unknown as ScopedMutator, BILL_ID);

    expect(mutate).toHaveBeenCalledTimes(2);
    expect(mutate).toHaveBeenCalledWith(billDetailSwrKey(BILL_ID));

    // The second call is the key-filter over LIST entries — every rail
    // category AND every table window (a status move stales the groups it
    // left/joined and shifts the windows/counts of both tabs — which ones
    // isn't this helper's business) and nothing else.
    const filter = mutate.mock.calls.find(([arg]) => typeof arg === 'function')?.[0] as (
      key: unknown,
    ) => boolean;
    expect(filter).toBeTypeOf('function');
    expect(filter(railBillsSwrKey(['missing_info', 'draft']))).toBe(true);
    expect(filter(railBillsSwrKey(['paid']))).toBe(true);
    expect(filter(billsListSwrKey(['paid'], null, 1))).toBe(true);
    expect(filter(billsListSwrKey(['draft', 'missing_info'], 'acme', 3))).toBe(true);
    expect(filter(billDetailSwrKey(BILL_ID))).toBe(false);
    expect(filter(undefined)).toBe(false);
  });

  it("never rejects — a failed revalidation must not turn a succeeded write's UI into an error", async () => {
    const mutate = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(
      reconcileBillCaches(mutate as unknown as ScopedMutator, BILL_ID),
    ).resolves.toBeUndefined();
  });

  it('given the re-read bill, SEEDS the detail entry (no revalidate) and keeps the cached documentUrl', async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    await reconcileBillCaches(mutate as unknown as ScopedMutator, BILL_ID, RE_READ_BILL);

    const seedCall = mutate.mock.calls.find(([key]) => key === billDetailSwrKey(BILL_ID));
    expect(seedCall).toBeDefined();
    const [, updater, options] = seedCall as [string, unknown, unknown];
    // No refetch behind the seed — the POST's re-read IS the post-write truth.
    expect(options).toEqual({ revalidate: false });

    // The updater preserves the entry's server-resolved documentUrl…
    const next = (updater as (current: unknown) => unknown)({
      bill: { id: BILL_ID, status: 'awaiting_approval' },
      documentUrl: 'https://signed.example/doc.pdf',
    });
    expect(next).toEqual({ bill: RE_READ_BILL, documentUrl: 'https://signed.example/doc.pdf' });
    // …and degrades to null when there was no cached entry to inherit from.
    expect((updater as (current: unknown) => unknown)(undefined)).toEqual({
      bill: RE_READ_BILL,
      documentUrl: null,
    });
  });

  it('the seeded path still revalidates every rail category — the safety net stays on', async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    await reconcileBillCaches(mutate as unknown as ScopedMutator, BILL_ID, RE_READ_BILL);

    const filter = mutate.mock.calls.find(([arg]) => typeof arg === 'function')?.[0] as (
      key: unknown,
    ) => boolean;
    expect(filter).toBeTypeOf('function');
    expect(filter(railBillsSwrKey(['approved']))).toBe(true);
    expect(filter(billsListSwrKey(['approved'], null, 2))).toBe(true);
    expect(filter(billDetailSwrKey(BILL_ID))).toBe(false);
  });
});

describe('fetchBillsList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks /api/bills for the exact window — statuses, q, page, pageSize — and parses the envelope', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ bills: [], total: 42 }) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchBillsList(['draft', 'missing_info'], 'acme', 3, 10);

    // `total` rides through untouched — the footer's "of N" is the server's
    // FULL filtered count, never the window's length.
    expect(result).toEqual({ bills: [], total: 42 });
    const url = new URL(fetchMock.mock.calls[0]?.[0] as string, 'http://localhost');
    expect(url.pathname).toBe('/api/bills');
    expect(url.searchParams.get('statuses')).toBe('draft,missing_info');
    expect(url.searchParams.get('q')).toBe('acme');
    expect(url.searchParams.get('page')).toBe('3');
    expect(url.searchParams.get('pageSize')).toBe('10');
  });

  it('omits ?q= and ?page= at their defaults — an unsearched first window names itself minimally', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ bills: [], total: 0 }) });
    vi.stubGlobal('fetch', fetchMock);

    await fetchBillsList(['paid'], null, 1, 10);

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string, 'http://localhost');
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.has('page')).toBe(false);
    // But pageSize ALWAYS travels — it's what tells the endpoint "window this",
    // versus the rail's unwindowed statuses-only read.
    expect(url.searchParams.get('pageSize')).toBe('10');
  });

  it('throws on a non-OK response so SWR surfaces the failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(fetchBillsList(['paid'], null, 1, 10)).rejects.toThrow(/500/);
  });
});
