'use client';

import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillDetailType } from '@ramps/schemas/bills';
import type { UserType } from '@ramps/schemas/users';
import { DraggablePanel } from '@ramps/ui/DraggablePanel';
import { EmptyState } from '@ramps/ui/EmptyState';
import { Activity as ActivityIcon } from '@ramps/ui/icons';
import { Activity, useState } from 'react';

import { BillDetailProvider } from '../context/BillDetail.context';
import type { BillDetailsTab } from '../constants/tabs.constants';
import { BillDetailsDocument } from './BillDetailsDocument';
import { BillDetailsForm } from './BillDetailsForm';
import { BillDetailsTitle } from './BillDetailsTitle';

export interface BillDetailsContentProps {
  bill: BillDetailType;
  refs: BillDetailRefsType;
  /** The approver catalog for the ApprovalsWorkflow (by-role groups + picker). */
  users: UserType[];
  /** Public URL of the invoice PDF, resolved on the server. */
  documentUrl: string | null;
}

/**
 * BillDetailsContent — the whole `/bills/:id` surface: the title over a two-pane
 * body (the editable form on the left, the source document on the right,
 * snapshots 5–6). The two panes are parted by the design system's
 * {@link DraggablePanel} — the ⋮⋮ grip you drag to re-apportion the coding form
 * against the invoice preview (frames 7/8/10). It opens the `BillDetailProvider`
 * so every descendant section shares the one form + bill + refs. Pure client
 * shell — the Server Component route does the data work and passes the validated
 * models down.
 *
 * The two tab bodies are each wrapped in React 19's `<Activity>` rather than a
 * conditional mount: the inactive tab is `mode="hidden"` (kept mounted, its DOM
 * hidden, its effects torn down) instead of unmounted. So flipping between
 * Overview and Activity preserves each panel's own state — the drag split's
 * width, the document sub-tab, scroll — and, once Activity grows real content,
 * it will keep that state for free too.
 */
export function BillDetailsContent({ bill, refs, users, documentUrl }: BillDetailsContentProps) {
  const [tab, setTab] = useState<BillDetailsTab>('overview');

  return (
    <BillDetailProvider bill={bill} refs={refs} users={users}>
      <div className="bg-white flex flex-1 flex-col">
        <div className="gap-rui-4 px-rui-6 py-rui-6 min-h-0 flex flex-1 flex-col">
          <BillDetailsTitle tab={tab} onTabChange={setTab} />

          {/* Overview holds the resizable split: form on the white left pane,
              invoice preview on the warm limestone right pane. The panel supplies
              each pane's surface + framing, so children only bring padding. */}
          <Activity mode={tab === 'overview' ? 'visible' : 'hidden'}>
            <DraggablePanel
              className="min-h-0 flex-1"
              defaultSplit={60}
              left={
                <div className="px-rui-5 py-rui-5">
                  <BillDetailsForm />
                </div>
              }
              right={
                <div className="px-rui-5 py-rui-5 h-full">
                  <BillDetailsDocument
                    documentUrl={documentUrl}
                    invoiceNumber={bill.invoice_number}
                  />
                </div>
              }
            />
          </Activity>

          {/* Activity — no audit trail yet, so the same empty-state treatment as
              the document pane's "No documents" tab. */}
          <Activity mode={tab === 'activity' ? 'visible' : 'hidden'}>
            <EmptyState
              className="min-h-0 flex-1"
              icon={<ActivityIcon size={28} />}
              title="No activity yet"
              description="Approvals, edits and payment events for this bill will appear here."
            />
          </Activity>
        </div>
      </div>
    </BillDetailProvider>
  );
}
