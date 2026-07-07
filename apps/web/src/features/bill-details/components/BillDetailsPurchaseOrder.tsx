'use client';

import { useWatch } from 'react-hook-form';

import { useBillDetail } from '../context/BillDetail.context';
import { purchaseOrderCompleteness } from '../helpers/section-completeness.helpers';
import { BillDetailsSection } from './BillDetailsSection';
import { BillDetailsTextField } from './BillDetailsTextField';

/**
 * Purchase order section (snapshot 7): genuinely optional. Reads `Optional` when
 * blank and `Complete` once a PO number is entered — the pill is the whole cue.
 */
export function BillDetailsPurchaseOrder() {
  const { control } = useBillDetail().form;
  const poNumber = useWatch({ control, name: 'po_number' });
  const completeness = purchaseOrderCompleteness({ po_number: poNumber ?? '' });

  return (
    <BillDetailsSection title="Purchase order" completeness={completeness}>
      <BillDetailsTextField name="po_number" label="PO number" placeholder="e.g. PO-5521" />
    </BillDetailsSection>
  );
}
