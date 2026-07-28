'use client';

import { EmptyState } from '@ramps/ui/EmptyState';
import { FileText } from '@ramps/ui/icons';
import { Skeleton } from '@ramps/ui/Skeleton';
import { Tabs } from '@ramps/ui/Tabs';
import { useState } from 'react';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
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
 *
 * The URL is DETAIL-ONLY (it rides the fetched envelope, not the rail item),
 * so the viewer body needs `full` — below it, "No invoice attached" would be
 * a lie about a bill whose PDF simply hasn't landed. The Tabs stay real and
 * clickable either way: they're chrome, not data.
 */
export function BillDetailsDocument() {
  const {
    documentUrl,
    dataLevel,
    bill: { invoice_number: invoiceNumber },
  } = useBillDetail();
  const [tab, setTab] = useState<BillDetailsDocumentTab>(BILL_DETAILS_DOCUMENT_TAB.INVOICE);

  const isInvoiceTab = tab === BILL_DETAILS_DOCUMENT_TAB.INVOICE;
  const full = dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.FULL);

  return (
    <div className="gap-rui-3 flex h-full flex-col">
      {/* h-12 levels this bar with the form pane's pinned header across the
          divider; items-stretch makes the tab buttons fill the band so their
          underline stays glued to the bar's border-b. */}
      <Tabs
        className="px-rui-5 h-12 shrink-0 items-stretch"
        tabs={[...BILL_DETAILS_DOCUMENT_TABS]}
        value={tab}
        onValueChange={(value) => setTab(value as BillDetailsDocumentTab)}
      />
      <BillDetailsPane className="h-full">
        <div className="rounded-square border-bone flex-1 overflow-hidden border">
          {!full ? (
            <Skeleton className="h-full min-h-[32rem] w-full rounded-none" />
          ) : isInvoiceTab && documentUrl ? (
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
