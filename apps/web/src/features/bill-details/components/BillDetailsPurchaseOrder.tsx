'use client';

import { useWatch } from 'react-hook-form';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { purchaseOrderCompleteness } from '../helpers/section-completeness.helpers';
import { BillDetailsFieldSkeleton } from './BillDetailsFieldSkeleton';
import { BillDetailsSection } from './BillDetailsSection';
import { BillDetailsTextField } from './BillDetailsTextField';

/**
 * Purchase order section (snapshot 7): genuinely optional. Reads `Optional` when
 * blank and `Complete` once a PO number is entered — the pill is the whole cue.
 *
 * A HEADER concern (`po_number` rides the rail item), so it needs `seed`:
 * below it, the real title frames one field bar, no pill.
 */
export function BillDetailsPurchaseOrder() {
  const { dataLevel } = useBillDetail();
  if (!dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.SEED)) {
    return (
      <BillDetailsSection title="Purchase order">
        <BillDetailsFieldSkeleton />
      </BillDetailsSection>
    );
  }
  return <BillDetailsPurchaseOrderLoaded />;
}

function BillDetailsPurchaseOrderLoaded() {
  const { control } = useBillDetail().form;
  const poNumber = useWatch({ control, name: 'po_number' });
  const completeness = purchaseOrderCompleteness({ po_number: poNumber ?? '' });

  return (
    <BillDetailsSection title="Purchase order" completeness={completeness}>
      <BillDetailsTextField name="po_number" label="PO number" />
    </BillDetailsSection>
  );
}
