'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useSWRConfig } from 'swr';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import { useBillDetail } from '../context/BillDetail.context';
import { reconcileBillCaches } from '../helpers/bill-cache.helpers';

/**
 * useSubmitBill — THE "Create bill" flow: persist the whole edit form, then
 * submit the bill for approval.
 *
 * Create bill is a strict SUPERSET of Save draft — same form persistence, plus
 * the `draft`/`missing_info` → `awaiting_approval` transition — so it's one
 * server call to `POST /api/bills/:id/submit` (the SDK's `submit` saves then
 * moves).
 *
 * Like every other status move on this screen (approve, schedule, archive…),
 * submit STAYS ON THE BILL — no redirect out. The bill is still the screen's
 * subject; what changes is its status, and the page reconciles around it:
 * on success it `form.reset(getValues())` to clear `isDirty` (the bill has
 * left the draft states, nothing more is editable, and a clean form keeps the
 * unsaved-changes guard quiet), then AWAITS {@link reconcileBillCaches} WITH
 * the re-read bill the POST returned. Seeding the detail entry in place flips
 * the status pill and the footer primary the moment the response lands (no
 * second roundtrip), and the rail revalidation + the status-derived category
 * (`railStatusesFor` reads the seeded status) flip the rail to the bill's NEW
 * category — the card now sits in For approval, chevrons re-rung around it.
 * `router.refresh()` still runs because the Bill Pay list and its tab counts
 * are RSC surfaces: a later hop back must read the new status, not the router
 * cache's stale rows.
 *
 * One more flip on success: `toggleEditable(false)`. The context's edit-mode
 * flag only re-derives on remount or a data-level RISE — a same-level seeded
 * reconcile leaves it alone — and it initialized `true` for the pre-submit
 * draft. Left stale, the now-`awaiting_approval` bill would render mid-edit
 * (Save bill footer, unlocked fieldset, kebab locked out) instead of the
 * read-only rest state an awaiting bill opens in (Edit bill ⇄ Approve). Same
 * exit the post-submit "Save bill" takes.
 *
 * The STAGED APPROVAL ROUTE flushes first: the chain editor parks its edits on
 * `pendingApprovalStagesRef` (nothing PUTs per change), and the submit
 * transition CLOSES the stages route (editable only pre-submit) — so any
 * staged route must land via its own PUT before the status moves, exactly as
 * "Save draft" would have sent it. The server then enforces approvers-required
 * against the persisted truth (an approver-less submit is a 422).
 *
 * The caller (the form's submit handler) has already gated on completeness —
 * including the approvals leg, so a reachable submit has a route to flush or
 * one already persisted; the SDK's transition + approvers guards are the
 * backstop (a 409/422 surfaces as the error line).
 */
export function useSubmitBill() {
  const { bill, form, toggleEditable, pendingApprovalStagesRef } = useBillDetail();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (): Promise<boolean> => {
    setError(null);
    setSubmitting(true);
    try {
      // 1) Flush the staged route, if any — its PUT is only legal PRE-submit,
      //    so it must land before the transition. The ref clears only after
      //    the PUT succeeds, so a failed flush leaves the route re-sendable.
      const pending = pendingApprovalStagesRef.current;
      if (pending) {
        await apiClient.bills.saveApprovalStages(bill.id, pending);
        pendingApprovalStagesRef.current = null;
      }

      // 2) Save + transition in one call; the server re-checks the route.
      const { bill: submitted } = await apiClient.bills.submit(bill.id, form.getValues());
      // Clear dirty state so the unsaved-changes guard stays quiet; the bill
      // has left the editable draft states, so its values are the truth.
      form.reset(form.getValues());
      // Leave edit mode — the awaiting bill's rest state is read-only
      // (Edit bill ⇄ Approve); the stale pre-submit flag must not linger.
      toggleEditable(false);
      // Seed the detail entry with the re-read bill + revalidate the rails:
      // the status UX and the rail's category both re-derive from the seed.
      await reconcileBillCaches(mutate, bill.id, submitted);
      // The Bill Pay tables and tab counts are RSC — refresh them behind us
      // so leaving later shows the new status, while WE stay on the bill.
      router.refresh();
      return true;
    } catch {
      setError('Could not create the bill. Your changes are not persisted yet.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [bill.id, form, toggleEditable, pendingApprovalStagesRef, router, mutate]);

  return { submit, submitting, error };
}
