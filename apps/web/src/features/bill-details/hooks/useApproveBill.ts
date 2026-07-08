'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';
import { toSchedulePayload } from '../helpers/payment-completeness.helpers';

/**
 * useApproveBill — THE "Approve" flow: persist the whole edit form, then advance
 * the bill out of the approval queue.
 *
 * Approve is offered while the bill is still editable, so — like "Create bill" —
 * it saves the same form as part of the move (the SDK's `approve` saves then
 * transitions). The destination is decided by the shared payment slice: when it
 * projects to a complete {@link toSchedulePayload} the server books the payment
 * and lands on `scheduled`; otherwise it lands on `approved`. Either way the
 * caller passes the resolved `schedule` (or `null`) in the body.
 *
 * Unlike submit, Approve STAYS ON THE PAGE: the bill is still this screen's
 * subject, only its status/footer change. So on success it `form.reset(
 * getValues())` to clear `isDirty` (nothing more is editable once approved, and
 * a clean form keeps the unsaved-changes guard quiet), then `router.refresh()`
 * so the server component re-reads the bill's new status — the footer flips to
 * "Schedule payment" / "View schedule" — rather than showing a stale cache.
 */
export function useApproveBill() {
  const { bill, form, payment } = useBillDetail();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSubmitting(true);
    try {
      const schedule = toSchedulePayload(payment);
      await apiClient.bills.approve(bill.id, { ...form.getValues(), schedule });
      // Clear dirty state so the unsaved-changes guard stays quiet; the bill is
      // no longer editable here, so its own values are the truth to reset to.
      form.reset(form.getValues());
      router.refresh();
      return true;
    } catch {
      setError('Could not approve the bill. Your changes are not persisted yet.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, form, payment, router]);

  return { approve, submitting, error };
}
