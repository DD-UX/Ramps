'use client';

import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';
import { reconcileBillCaches } from '../helpers/bill-cache.helpers';
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
 * On success it AWAITS {@link reconcileBillCaches}: the detail entry's re-read
 * is what carries the now-`scheduled` bill (and its `payment`) to the screen —
 * the footer flips to a read-only "View schedule", and the rail card moves to
 * its new category — so the modal's busy state holds until the flip lands. No
 * `form.reset` — the schedule lives on the payment slice, not the bill's edit
 * form, so the form's dirty state is unaffected.
 */
export function useSchedulePayment() {
  const { bill, payment } = useBillDetail();
  const { mutate } = useSWRConfig();
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
      const { bill: scheduled } = await apiClient.bills.schedulePayment(bill.id, payload);
      await reconcileBillCaches(mutate, bill.id, scheduled);
      return true;
    } catch {
      setError('Could not schedule the payment. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, payment, mutate]);

  return { schedule, submitting, error };
}
