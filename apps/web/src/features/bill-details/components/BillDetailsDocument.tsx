'use client';

import { EmptyState } from '@ramps/ui/EmptyState';
import { FileText } from '@ramps/ui/icons';
import { Tabs } from '@ramps/ui/Tabs';
import { useState } from 'react';

import {
  BILL_DETAILS_DOCUMENT_TAB,
  BILL_DETAILS_DOCUMENT_TABS,
  type BillDetailsDocumentTab,
} from '../constants/tabs.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { BillDetailsPane } from './BillDetailsPane';

/**
 * The right-hand document pane (snapshots 5–6): the source invoice PDF next to
 * the form, under Invoice / Documents tabs. Falls back to an `EmptyState` when a
 * bill has no attached document. The document URL is resolved on the server
 * (SUPABASE_URL is server-only) and shared on the context, so this reads it — and
 * the invoice number, for the frame title — straight off `useBillDetail()` and
 * stays a dumb viewer with no props of its own.
 */
export function BillDetailsDocument() {
  const {
    documentUrl,
    bill: { invoice_number: invoiceNumber },
  } = useBillDetail();
  const [tab, setTab] = useState<BillDetailsDocumentTab>(BILL_DETAILS_DOCUMENT_TAB.INVOICE);

  const isInvoiceTab = tab === BILL_DETAILS_DOCUMENT_TAB.INVOICE;

  return (
    <div className="gap-rui-3 flex h-full flex-col">
      <Tabs
        className="px-rui-5"
        tabs={[...BILL_DETAILS_DOCUMENT_TABS]}
        value={tab}
        onValueChange={(value) => setTab(value as BillDetailsDocumentTab)}
      />
      <BillDetailsPane className="h-full">
        <div className="rounded-square border-bone flex-1 overflow-hidden border">
          {isInvoiceTab && documentUrl ? (
            <iframe
              src={documentUrl}
              title={invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice document'}
              className="h-full min-h-[32rem] w-full"
            />
          ) : (
            <EmptyState
              className="h-full min-h-[32rem]"
              icon={<FileText size={28} />}
              title={isInvoiceTab ? 'No invoice attached' : 'No documents'}
              description={
                isInvoiceTab
                  ? 'This bill has no source document to preview.'
                  : 'Supporting documents will appear here once attached.'
              }
            />
          )}
        </div>
      </BillDetailsPane>
    </div>
  );
}
