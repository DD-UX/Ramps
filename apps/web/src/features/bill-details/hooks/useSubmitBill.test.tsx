import type { BillDetailType } from '@ramps/schemas/bills';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSubmitBill } from './useSubmitBill';

/**
 * useSubmitBill is the "Create bill" flow, and its contract since the
 * stay-on-bill change is the point of these tests: submitting NEVER navigates
 * away. The screen keeps the bill as its subject and reconciles around it —
 * the form's dirty state clears, edit mode flips OFF (the context's flag is
 * initializer-only, so without the explicit flip the now-awaiting bill would
 * render mid-edit), the caches reconcile WITH the re-read bill the POST
 * returned (awaited, so the status UX and the rail flip together), and only
 * `router.refresh()` runs — for the RSC list surfaces — never `push`.
 *
 * The context and the cache helper are mocked at their seams; the failure
 * path pins that NO reconciliation side effect fires on a failed submit.
 */
const values = { invoice_number: 'INV-1' };
const getValues = vi.fn(() => values);
const reset = vi.fn();
const toggleEditable = vi.fn();
const push = vi.fn();
const refresh = vi.fn();
const mutate = vi.fn();
const submitApi = vi.fn();
const reconcileBillCaches = vi.fn((..._args: unknown[]) => Promise.resolve());

const bill = { id: 'b-1', status: 'draft' } as unknown as BillDetailType;
const submitted = { id: 'b-1', status: 'awaiting_approval' };

vi.mock('../context/BillDetail.context', () => ({
  useBillDetail: () => ({ bill, form: { getValues, reset }, toggleEditable }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock('swr', () => ({
  useSWRConfig: () => ({ mutate }),
}));

vi.mock('@/features/common/helpers/api-client.helpers', () => ({
  apiClient: { bills: { submit: (id: unknown, body: unknown) => submitApi(id, body) } },
}));

vi.mock('../helpers/bill-cache.helpers', () => ({
  reconcileBillCaches: (m: unknown, id: unknown, b: unknown) => reconcileBillCaches(m, id, b),
}));

beforeEach(() => {
  vi.clearAllMocks();
  submitApi.mockResolvedValue({ bill: submitted });
});

describe('useSubmitBill', () => {
  it('stays on the bill: reconciles caches with the re-read bill, exits edit mode, never pushes', async () => {
    const { result } = renderHook(() => useSubmitBill());

    let ok = false;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(true);
    // One server call: save + transition ride together.
    expect(submitApi).toHaveBeenCalledWith('b-1', values);
    // Dirty state clears so the unsaved-changes guard stays quiet.
    expect(reset).toHaveBeenCalledWith(values);
    // Edit mode flips OFF — the awaiting bill's rest state is read-only.
    expect(toggleEditable).toHaveBeenCalledWith(false);
    // The caches seed from the POST's re-read bill — status UX + rail flip.
    expect(reconcileBillCaches).toHaveBeenCalledWith(mutate, 'b-1', submitted);
    // RSC surfaces refresh behind us; WE stay — no redirect out.
    expect(refresh).toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('a failed submit surfaces the error and fires NO reconciliation side effects', async () => {
    submitApi.mockRejectedValue(new Error('409'));
    const { result } = renderHook(() => useSubmitBill());

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(result.current.error).toMatch(/not persisted/);
    expect(reset).not.toHaveBeenCalled();
    expect(toggleEditable).not.toHaveBeenCalled();
    expect(reconcileBillCaches).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
