'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';
import { toSchedulePayload } from '../helpers/payment-completeness.helpers';

/**
 * useSchedulePayment — THE "Schedule payment" flow for an already-`approved`
 * bill: book the money movement from the shared payment slice, then move
 * `approved → scheduled`.
 *
 * This is the schedule modal's Save. It reads the same payment slice the modal
 * edits, projects it to the wire payload via {@link toSchedulePayload}, and — a
 * payment can't be booked without a source — bails (surfacing the error line)
 * when the slice is incomplete rather than calling the server with a null body.
 *
 * On success it `router.refresh()` so the server component re-reads the now
 * `scheduled` bill (carrying its `payment`): the footer flips to a read-only
 * "View schedule". No `form.reset` — the schedule lives on the payment slice,
 * not the bill's edit form, so the form's dirty state is unaffected.
 */
export function useSchedulePayment() {
  const { bill, payment } = useBillDetail();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schedule = useCallback(async (): Promise<boolean> => {
    setError(null);
    const payload = toSchedulePayload(payment);
    if (!payload) {
      setError('Pick a pay-from account and a date before scheduling.');
      return false;
    }
    setSubmitting(true);
    try {
      await apiClient.bills.schedulePayment(bill.id, payload);
      router.refresh();
      return true;
    } catch {
      setError('Could not schedule the payment. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, payment, router]);

  return { schedule, submitting, error };
}
