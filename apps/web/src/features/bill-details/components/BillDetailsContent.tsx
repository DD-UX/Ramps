'use client';

import type { BillDetailRefsType } from '@ramps/schemas/bill-refs';
import type { BillDetailType } from '@ramps/schemas/bills';

import { BillDetailProvider } from '../context/BillDetail.context';
import { BillDetailsDocument } from './BillDetailsDocument';
import { BillDetailsForm } from './BillDetailsForm';
import { BillDetailsTitle } from './BillDetailsTitle';

export interface BillDetailsContentProps {
  bill: BillDetailType;
  refs: BillDetailRefsType;
  /** Public URL of the invoice PDF, resolved on the server. */
  documentUrl: string | null;
}

/**
 * BillDetailsContent — the whole `/bills/:id` surface: the title over a two-pane
 * body (the editable form on the left, the source document on the right,
 * snapshots 5–6). It opens the `BillDetailProvider` so every descendant section
 * shares the one form + bill + refs. Pure client shell — the Server Component
 * route does the data work and passes the validated models down.
 */
export function BillDetailsContent({ bill, refs, documentUrl }: BillDetailsContentProps) {
  return (
    <BillDetailProvider bill={bill} refs={refs}>
      <div className="bg-white flex flex-1 flex-col">
        <div className="gap-rui-4 px-rui-6 py-rui-6 flex flex-col">
          <BillDetailsTitle />
          <div className="gap-rui-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] grid grid-cols-1">
            <BillDetailsForm />
            <aside className="lg:sticky lg:top-rui-6 lg:self-start">
              <BillDetailsDocument documentUrl={documentUrl} invoiceNumber={bill.invoice_number} />
            </aside>
          </div>
        </div>
      </div>
    </BillDetailProvider>
  );
}
