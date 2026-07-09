import type { BillDetailType } from '@ramps/schemas/bills';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCancelBillEdit } from './useCancelBillEdit';

/**
 * useCancelBillEdit is the "Cancel" inverse of "Edit bill": a synchronous,
 * write-free restore that snaps every place an edit could have landed back to
 * the fetched record, then leaves edit mode. These tests pin that contract by
 * asserting each restore call fires with server truth — the form resets to the
 * bill's defaults, the payment slice resets, the staged approval route is
 * dropped, and edit mode flips off.
 *
 * The context is mocked to spies; the two projection helpers are mocked to
 * marker returns so we can assert the hook feeds `reset`/`setPayment` the
 * bill-derived value (not that we re-test the helpers themselves).
 */
const reset = vi.fn();
const setPayment = vi.fn();
const toggleEditable = vi.fn();
const pendingApprovalStagesRef = { current: { some: 'staged-route' } as unknown };

const bill = { id: 'b-1', status: 'awaiting_approval' } as unknown as BillDetailType;

vi.mock('../context/BillDetail.context', () => ({
  useBillDetail: () => ({
    bill,
    form: { reset },
    setPayment,
    pendingApprovalStagesRef,
    toggleEditable,
  }),
}));

// Projection helpers → markers, so we can prove the hook routes the bill's
// derived value into reset/setPayment without re-testing the helpers.
vi.mock('../helpers/form-defaults.helpers', () => ({
  billToFormDefaults: (b: unknown) => ({ defaultsFor: b }),
}));
vi.mock('../helpers/payment-completeness.helpers', () => ({
  paymentDraftFor: (b: unknown) => ({ paymentFor: b }),
}));

beforeEach(() => {
  reset.mockReset();
  setPayment.mockReset();
  toggleEditable.mockReset();
  pendingApprovalStagesRef.current = { some: 'staged-route' } as unknown;
});

describe('useCancelBillEdit', () => {
  it('restores the form, payment, staged route, and exits edit mode', () => {
    const { result } = renderHook(() => useCancelBillEdit());

    act(() => result.current.cancelEdit());

    // Form resets to the bill's defaults (clears isDirty downstream).
    expect(reset).toHaveBeenCalledWith({ defaultsFor: bill });
    // Payment slice resets to the bill's persisted draft.
    expect(setPayment).toHaveBeenCalledWith({ paymentFor: bill });
    // Any staged-but-unsaved approval route is dropped.
    expect(pendingApprovalStagesRef.current).toBeNull();
    // Edit mode flips off — back to the read-only record.
    expect(toggleEditable).toHaveBeenCalledWith(false);
  });
});
