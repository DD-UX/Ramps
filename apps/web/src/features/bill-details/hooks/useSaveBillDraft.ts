'use client';

import { useCallback, useState } from 'react';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';

/**
 * useSaveBillDraft — THE "Save draft" flow for the bill screen, shared by its
 * two triggers: the footer's explicit button and the unsaved-changes guard's
 * "Save draft" exit. One definition of what saving a draft means, two doors.
 *
 * What it persists today: the approvals route staged on the context's
 * `pendingApprovalStagesRef` (the rest of the form's persistence is still
 * stubbed). Nothing staged → resolves `true` without a network call, so a
 * caller can treat "nothing to do" as success and proceed (navigate, etc.).
 * The ref clears only after the PUT lands, so retrying after a failure
 * re-sends the same staged route.
 *
 * Each call site gets its OWN `saving` / `error` state (the footer's inline
 * error and the guard's modal line render in different places), but the same
 * save semantics.
 */
export function useSaveBillDraft() {
  const { bill, pendingApprovalStagesRef } = useBillDetail();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Persist staged work. Resolves `true` on success (or nothing to save). */
  const saveDraft = useCallback(async (): Promise<boolean> => {
    setError(null);
    const pending = pendingApprovalStagesRef.current;
    if (!pending) return true; // Nothing staged — the rest of the form save is stubbed.
    setSaving(true);
    try {
      await apiClient.bills.saveApprovalStages(bill.id, pending);
      pendingApprovalStagesRef.current = null;
      return true;
    } catch {
      setError('Could not save the approval route. Your changes are not persisted yet.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [bill.id, pendingApprovalStagesRef]);

  return { saveDraft, saving, error };
}
