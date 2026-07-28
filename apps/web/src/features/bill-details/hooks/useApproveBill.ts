'use client';

import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';
import { reconcileBillCaches } from '../helpers/bill-cache.helpers';
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
 * a clean form keeps the unsaved-changes guard quiet), then AWAITS
 * {@link reconcileBillCaches} — the detail entry re-read is what flips the
 * footer to "Schedule payment" / "View schedule" (and moves the rail card to
 * its new category), so the button's busy state holds until the flip lands.
 */
export function useApproveBill() {
  const { bill, form, payment } = useBillDetail();
  const { mutate } = useSWRConfig();
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
      await reconcileBillCaches(mutate, bill.id);
      return true;
    } catch {
      setError('Could not approve the bill. Your changes are not persisted yet.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, form, payment, mutate]);

  return { approve, submitting, error };
}
