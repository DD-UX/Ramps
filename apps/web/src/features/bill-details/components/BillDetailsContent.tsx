'use client';

import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillDetailType } from '@ramps/schemas/bills';
import { DraggablePanel } from '@ramps/ui/DraggablePanel';
import { useFormState } from 'react-hook-form';

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
 * dirtiness on this screen is TWO sources: the form's own `isDirty` and the
 * staged-but-unsaved approvals route on `pendingApprovalStagesRef` (a ref, so
 * the guard's click-time callback reads it fresh). Saving from the modal is the
 * same {@link useSaveBillDraft} flow as the footer button.
 *
 * `isDirty` comes from `useFormState({ control })`, NOT `form.formState`: the
 * form is created in the provider, so its formState proxy subscribes to what
 * the PROVIDER renders — reading `form.formState.isDirty` here (a context
 * consumer that never called a form hook) opens no subscription, so this body
 * wouldn't re-render when the form goes dirty and the guard would mirror a
 * stale `false`. `useFormState` subscribes THIS component to the control, the
 * same fix `BillDetailsForm` uses for `isValid`.
 */
function BillDetailsBody() {
  const { form, leftPaneRef, pendingApprovalStagesRef } = useBillDetail();
  const { saveDraft } = useSaveBillDraft();
  // Subscribe THIS component to dirtiness via the control (see note above);
  // `form.formState.isDirty` would read stale because the proxy subscribes the
  // provider, not this child.
  const { isDirty } = useFormState({ control: form.control });

  return (
    // min-h-0 is load-bearing: as a flex item this div's default min-height is
    // auto (its content), so the tall form/PDF would inflate it past the grid
    // cell and scroll the page. Shrinkable, the panes scroll themselves instead.
    <div className="bg-white min-h-0 flex flex-1 flex-col">
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
