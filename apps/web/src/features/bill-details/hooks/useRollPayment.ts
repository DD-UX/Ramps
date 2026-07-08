'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';

/**
 * useRollPayment — THE "Complete payment" flow for a `scheduled` bill: release
 * its already-booked payment NOW instead of waiting for the scheduled date.
 *
 * There's nothing to collect — the pay-from account + amount already live on the
 * payment row — so this is a bodyless POST that settles the payment and moves
 * `scheduled → paid`. On success it `router.refresh()` so the server component
 * re-reads the now-`paid` bill and the footer/modal fall to their terminal
 * state (the primary goes inert; no more schedule to view). The bill's edit form
 * is untouched, so — like scheduling — there's no `form.reset` here.
 */
export function useRollPayment() {
  const { bill } = useBillDetail();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roll = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.bills.rollPaymentNow(bill.id);
      router.refresh();
      return true;
    } catch {
      setError('Could not complete the payment. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, router]);

  return { roll, submitting, error };
}
