import type { BillDetailType } from '@ramps/schemas/bills';
import type { ScopedMutator } from 'swr';
import { describe, expect, it, vi } from 'vitest';

import { billDetailSwrKey, railBillsSwrKey, reconcileBillCaches } from './bill-cache.helpers';

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
});

describe('reconcileBillCaches', () => {
  it("revalidates the bill's detail entry and every rail category entry", async () => {
    const mutate = vi.fn().mockResolvedValue(undefined);
    await reconcileBillCaches(mutate as unknown as ScopedMutator, BILL_ID);

    expect(mutate).toHaveBeenCalledTimes(2);
    expect(mutate).toHaveBeenCalledWith(billDetailSwrKey(BILL_ID));

    // The second call is the key-filter over rail entries: it must match every
    // category's key (a status move stales two groups — which two isn't this
    // helper's business) and nothing else.
    const filter = mutate.mock.calls.find(([arg]) => typeof arg === 'function')?.[0] as (
      key: unknown,
    ) => boolean;
    expect(filter).toBeTypeOf('function');
    expect(filter(railBillsSwrKey(['missing_info', 'draft']))).toBe(true);
    expect(filter(railBillsSwrKey(['paid']))).toBe(true);
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
    expect(filter(billDetailSwrKey(BILL_ID))).toBe(false);
  });
});
