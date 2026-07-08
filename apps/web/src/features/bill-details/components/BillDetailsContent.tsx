'use client';

import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillDetailType } from '@ramps/schemas/bills';
import { DraggablePanel } from '@ramps/ui/DraggablePanel';

import { CommonUnsavedChangesGuard } from '@/features/common/components/CommonUnsavedChangesGuard';

import { BillDetailProvider, useBillDetail } from '../context/BillDetail.context';
import { useSaveBillDraft } from '../hooks/useSaveBillDraft';
import { BillDetailsDocument } from './BillDetailsDocument';
import { BillDetailsForm } from './BillDetailsForm';

export interface BillDetailsContentProps {
  bill: BillDetailType;
  refs: BillDetailRefsType;
  /** Public URL of the invoice PDF, resolved on the server. */
  documentUrl: string | null;
}

/**
 * BillDetailsContent — the whole `/bills/:id` surface: a two-pane body (the
 * editable form on the left, the source document on the right, snapshots 5–6).
 * The two panes are parted by the design system's {@link DraggablePanel} — the
 * ⋮⋮ grip you drag to re-apportion the coding form against the invoice preview
 * (frames 7/8/10). It opens the `BillDetailProvider` so every descendant section
 * shares the one form + bill + refs. Pure client shell — the Server Component
 * route does the data work and passes the validated models down.
 *
 * The header, the Overview / Activity tabs, and the two `<Activity>` tab bodies
 * live inside the left pane's {@link BillDetailsForm}; this surface just frames
 * the split.
 */
export function BillDetailsContent({ bill, refs, documentUrl }: BillDetailsContentProps) {
  return (
    <BillDetailProvider bill={bill} refs={refs} documentUrl={documentUrl}>
      <BillDetailsBody />
    </BillDetailProvider>
  );
}

/**
 * The split body — rendered inside the provider so it can hand the DraggablePanel
 * the shared `leftPaneRef`. That ref is what the approver popovers reframe within,
 * so their cards stay inside the left pane instead of spilling into the preview.
 * The two panes read whatever they need off the context, so this frame drills
 * nothing through.
 *
 * It also mounts the {@link CommonUnsavedChangesGuard} — outside the `<form>`
 * (its buttons must never look like submits) but inside the provider, because
 * dirtiness on this screen is TWO sources: the form's own `formState.isDirty`
 * (read during render — RHF's proxy only subscribes to what render touches)
 * and the staged-but-unsaved approvals route on `pendingApprovalStagesRef`
 * (a ref, so the guard's click-time callback reads it fresh). Saving from the
 * modal is the same {@link useSaveBillDraft} flow as the footer button.
 */
function BillDetailsBody() {
  const { form, leftPaneRef, pendingApprovalStagesRef } = useBillDetail();
  const { saveDraft } = useSaveBillDraft();
  // Destructure during render: RHF's formState is a lazy proxy — touching
  // `isDirty` here is what subscribes this component to dirtiness changes.
  const { isDirty } = form.formState;

  return (
    <div className="bg-white flex flex-1 flex-col">
      <CommonUnsavedChangesGuard
        isDirty={() => isDirty || pendingApprovalStagesRef.current != null}
        onSave={saveDraft}
      />
      <div className="gap-rui-4 min-h-0 flex flex-1 flex-col">
        <DraggablePanel
          className="min-h-0 flex-1"
          defaultSplit={60}
          leftPaneRef={leftPaneRef}
          left={<BillDetailsForm />}
          right={<BillDetailsDocument />}
        />
      </div>
    </div>
  );
}
