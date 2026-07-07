'use client';

import { useWatch } from 'react-hook-form';

import { useBillDetail } from '../context/BillDetail.context';
import { billDetailsCompleteness } from '../helpers/section-completeness.helpers';
import { BillDetailsSection } from './BillDetailsSection';
import { BillDetailsTextField } from './BillDetailsTextField';

/**
 * Bill details section (snapshots 6–7): the identifying trio the payment run
 * needs — invoice number, invoice date, due date — plus the accounting date.
 * Completeness recomputes live from the watched values, so the header pill
 * flips green the moment the last required field is filled.
 */
export function BillDetailsInvoiceInfo() {
  const { control } = useBillDetail().form;

  const [invoiceNumber, invoiceDate, dueDate] = useWatch({
    control,
    name: ['invoice_number', 'invoice_date', 'due_date'],
  });
  const completeness = billDetailsCompleteness({
    invoice_number: invoiceNumber ?? '',
    invoice_date: invoiceDate ?? null,
    due_date: dueDate ?? null,
  });

  return (
    <BillDetailsSection title="Bill details" completeness={completeness}>
      <div className="gap-rui-4 grid grid-cols-2">
        <span className="col-span-full">
          <BillDetailsTextField name="invoice_number" label="Invoice number" />
        </span>
        <BillDetailsTextField name="invoice_date" label="Invoice date" type="date" />
        <BillDetailsTextField name="due_date" label="Due date" type="date" />
        {/* This field will be changed to be a text under last field, with a change text link
        <span className="col-span-full">
          <BillDetailsTextField name="accounting_date" label="Accounting date" type="date" />
        </span>
          */}
      </div>
    </BillDetailsSection>
  );
}
