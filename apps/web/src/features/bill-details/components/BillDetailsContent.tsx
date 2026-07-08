'use client';

import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillDetailType } from '@ramps/schemas/bills';
import type { UserType } from '@ramps/schemas/users';
import { DraggablePanel } from '@ramps/ui/DraggablePanel';

import { BillDetailProvider, useBillDetail } from '../context/BillDetail.context';
import { BillDetailsDocument } from './BillDetailsDocument';
import { BillDetailsForm } from './BillDetailsForm';

export interface BillDetailsContentProps {
  bill: BillDetailType;
  refs: BillDetailRefsType;
  /** The approver catalog for the ApprovalsWorkflow (by-role groups + picker). */
  users: UserType[];
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
export function BillDetailsContent({ bill, refs, users, documentUrl }: BillDetailsContentProps) {
  return (
    <BillDetailProvider bill={bill} refs={refs} users={users} documentUrl={documentUrl}>
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
 */
function BillDetailsBody() {
  const { leftPaneRef } = useBillDetail();

  return (
    <div className="bg-white flex flex-1 flex-col">
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
