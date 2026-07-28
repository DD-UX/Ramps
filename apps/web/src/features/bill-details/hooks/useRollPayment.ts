'use client';

import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';
import { reconcileBillCaches } from '../helpers/bill-cache.helpers';

/**
 * useRollPayment — THE "Complete payment" flow for a `scheduled` bill: release
 * its already-booked payment NOW instead of waiting for the scheduled date.
 *
 * There's nothing to collect — the pay-from account + amount already live on the
 * payment row — so this is a bodyless POST that settles the payment and moves
 * `scheduled → paid`. On success it AWAITS {@link reconcileBillCaches}: the
 * detail entry's re-read carries the now-`paid` bill, so the footer/modal fall
 * to their terminal state (the primary goes inert; no more schedule to view)
 * and the rail card moves to its new category — the button's busy state holds
 * until that lands. The bill's edit form is untouched, so — like scheduling —
 * there's no `form.reset` here.
 */
export function useRollPayment() {
  const { bill } = useBillDetail();
  const { mutate } = useSWRConfig();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roll = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.bills.rollPaymentNow(bill.id);
      await reconcileBillCaches(mutate, bill.id);
      return true;
    } catch {
      setError('Could not complete the payment. Please try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, mutate]);

  return { roll, submitting, error };
}
