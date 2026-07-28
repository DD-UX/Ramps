import type { ScopedMutator } from 'swr';
import { describe, expect, it, vi } from 'vitest';

import { billDetailSwrKey, railBillsSwrKey, reconcileBillCaches } from './bill-cache.helpers';

const BILL_ID = 'b0000000-0000-0000-0000-00000000d001';

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
});
