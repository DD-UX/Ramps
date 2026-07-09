'use client';

import { useCallback } from 'react';

import { useBillDetail } from '../context/BillDetail.context';
import { billToFormDefaults } from '../helpers/form-defaults.helpers';
import { paymentDraftFor } from '../helpers/payment-completeness.helpers';

/**
 * useCancelBillEdit — the "Cancel" companion to the footer's "Save bill". It
 * discards every in-edit change and snaps the screen back to the fetched
 * record, then leaves edit mode — the exact inverse of "Edit bill", with no
 * network write.
 *
 * It restores each place an edit could have landed, all from the SAME server
 * truth the provider seeded from:
 *   • the form fields — `form.reset(billToFormDefaults(bill))`, which also
 *     clears `formState.isDirty` so the unsaved-changes guard stops flagging;
 *   • the shared payment slice — back to `paymentDraftFor(bill)` (a booked
 *     `scheduled` bill re-reads its payment; a never-scheduled one goes blank);
 *   • the approvals route the chain editor may have staged — the
 *     `pendingApprovalStagesRef` is dropped so nothing queued survives.
 *
 * Then `toggleEditable(false)` returns the screen to its frozen, read-only
 * state. No busy/error state: the whole thing is synchronous and can't fail.
 */
export function useCancelBillEdit() {
  const { bill, form, setPayment, pendingApprovalStagesRef, toggleEditable } = useBillDetail();

  const cancelEdit = useCallback(() => {
    // Fields + line items back to the fetched values; clears isDirty.
    form.reset(billToFormDefaults(bill));
    // The shared payment slice back to what the bill persisted.
    setPayment(paymentDraftFor(bill));
    // Drop any approval route the chain editor staged but didn't save.
    pendingApprovalStagesRef.current = null;
    // Leave edit mode — back to the read-only record.
    toggleEditable(false);
  }, [bill, form, setPayment, pendingApprovalStagesRef, toggleEditable]);

  return { cancelEdit };
}
