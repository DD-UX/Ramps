'use client';

import { EmptyState } from '@ramps/ui/EmptyState';
import { FileText } from '@ramps/ui/icons';
import { Tabs } from '@ramps/ui/Tabs';
import { useState } from 'react';

const DOCUMENT_TABS = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'documents', label: 'Documents' },
];

export interface BillDetailsDocumentProps {
  /** The resolved public URL of the invoice PDF, or null when none is attached. */
  documentUrl: string | null;
  invoiceNumber: string | null;
}

/**
 * The right-hand document pane (snapshots 5–6): the source invoice PDF next to
 * the form, under Invoice / Documents tabs. Falls back to an `EmptyState` when a
 * bill has no attached document. The URL is resolved on the server (SUPABASE_URL
 * is server-only) and passed in, so this stays a dumb viewer.
 */
export function BillDetailsDocument({ documentUrl, invoiceNumber }: BillDetailsDocumentProps) {
  const [tab, setTab] = useState('invoice');

  return (
    <div className="gap-rui-3 flex h-full flex-col">
      <Tabs tabs={DOCUMENT_TABS} value={tab} onValueChange={setTab} />
      <div className="rounded-square border-bone flex-1 overflow-hidden border">
        {tab === 'invoice' && documentUrl ? (
          <iframe
            src={documentUrl}
            title={invoiceNumber ? `Invoice ${invoiceNumber}` : 'Invoice document'}
            className="h-full min-h-[32rem] w-full"
          />
        ) : (
          <EmptyState
            className="h-full min-h-[32rem]"
            icon={<FileText size={28} />}
            title={tab === 'invoice' ? 'No invoice attached' : 'No documents'}
            description={
              tab === 'invoice'
                ? 'This bill has no source document to preview.'
                : 'Supporting documents will appear here once attached.'
            }
          />
        )}
      </div>
    </div>
  );
}
