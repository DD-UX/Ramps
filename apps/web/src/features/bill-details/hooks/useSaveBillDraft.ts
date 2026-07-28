'use client';

import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';
import { reconcileBillCaches } from '../helpers/bill-cache.helpers';

/**
 * useSaveBillDraft — THE "Save draft" flow for the bill screen, shared by its
 * two triggers: the footer's explicit button and the unsaved-changes guard's
 * "Save draft" exit. One definition of what saving a draft means, two doors.
 *
 * What it persists: the WHOLE edit form — every header field plus the
 * line-items grid — via `PUT /api/bills/:id` (the SDK does a header UPDATE + a
 * line replace-all), AND the approvals route staged on the context's
 * `pendingApprovalStagesRef`. The two writes are independent (different tables,
 * different endpoints); the form write always runs, the stages write only when
 * the chain editor has staged something.
 *
 * On success it `form.reset(getValues())` — the just-saved values become the
 * new baseline, so `formState.isDirty` clears. That's load-bearing twice over:
 * a second Save is a no-op until the user edits again, and the unsaved-changes
 * guard (which reads `isDirty`) stops flagging a bill whose edits are now
 * persisted. The stages ref clears only after ITS PUT lands, so a retry after a
 * partial failure re-sends the same staged route.
 *
 * Resolves `true` only when BOTH writes succeed (or had nothing to do), so a
 * caller can treat the boolean as "safe to proceed" (navigate, exit edit mode).
 *
 * Each call site gets its OWN `saving` / `error` state (the footer's inline
 * error and the guard's modal line render in different places), but the same
 * save semantics.
 */
export function useSaveBillDraft() {
  const { bill, form, pendingApprovalStagesRef } = useBillDetail();
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Persist the whole form (+ any staged route). Resolves `true` on success. */
  const saveDraft = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSaving(true);
    try {
      // 1) The form itself — header + line items — always persists.
      await apiClient.bills.save(bill.id, form.getValues());

      // 2) The staged approval route, only if the chain editor queued one.
      const pending = pendingApprovalStagesRef.current;
      if (pending) {
        await apiClient.bills.saveApprovalStages(bill.id, pending);
        pendingApprovalStagesRef.current = null;
      }

      // The saved values are the new clean baseline — clears `isDirty` so a
      // repeat save is a no-op and the unsaved-changes guard stops flagging.
      form.reset(form.getValues());
      // Fire-and-forget: the rail card mirrors saved fields (vendor, amount,
      // due date), so its list revalidates alongside the detail entry. Not
      // awaited — the save already succeeded, and a same-level detail refresh
      // never resets the form (see the provider's ladder contract).
      void reconcileBillCaches(mutate, bill.id);
      return true;
    } catch {
      setError('Could not save your changes. They are not persisted yet.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [bill.id, form, pendingApprovalStagesRef, mutate]);

  return { saveDraft, saving, error };
}
