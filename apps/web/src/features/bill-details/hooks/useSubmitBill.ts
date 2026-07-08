'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';

/**
 * Where a freshly-created bill lands: the Bill Pay list scoped to the "For
 * approval" tab (its `bill_tabs.code`, the `?tab=` slug). A submitted bill is
 * now `awaiting_approval`, which is exactly the status that tab rolls up — so
 * the author sees the bill they just created sitting in the approval queue.
 */
export const FOR_APPROVAL_HREF = '/bills?tab=for_approval';

/**
 * useSubmitBill — THE "Create bill" flow: persist the whole edit form, submit
 * the bill for approval, then land the author on the "For approval" list.
 *
 * Create bill is a strict SUPERSET of Save draft — same form persistence, plus
 * the `draft`/`missing_info` → `awaiting_approval` transition — so it's one
 * server call to `POST /api/bills/:id/submit` (the SDK's `submit` saves then
 * moves). On success it `form.reset(getValues())` to clear `isDirty` BEFORE
 * navigating: the bill has left the draft states, so nothing more is editable
 * here, and a clean form means the unsaved-changes guard won't intercept the
 * redirect. Then `router.push` to the For-approval list and `router.refresh()`
 * so the server components (the list rows, the tab counts) re-read the bill's
 * new status rather than showing a stale cache.
 *
 * The caller (the form's submit handler) has already gated on completeness, so
 * this trusts the current values are submit-ready; a server-side transition
 * guard is the backstop (a 409 surfaces as the error line).
 */
export function useSubmitBill() {
  const { bill, form } = useBillDetail();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.bills.submit(bill.id, form.getValues());
      // Clear dirty state before we leave, so the guard doesn't intercept.
      form.reset(form.getValues());
      router.push(FOR_APPROVAL_HREF);
      router.refresh();
      return true;
    } catch {
      setError('Could not create the bill. Your changes are not persisted yet.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, form, router]);

  return { submit, submitting, error };
}
