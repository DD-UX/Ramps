'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Skeleton } from '@ramps/ui/Skeleton';
import { useFormContext } from 'react-hook-form';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { BillDetailsSection } from './BillDetailsSection';

/**
 * Memo section (snapshot 10): the free-text "Memo for vendor" that rides along
 * with the payment. A plain textarea bound to the form's `memo` field.
 *
 * A HEADER concern (`memo` rides the rail item), so it needs `seed`: below it,
 * the real title frames one textarea-height (h-20 ≈ rows=3) bar.
 */
export function BillDetailsMemo() {
  const { dataLevel } = useBillDetail();
  if (!dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.SEED)) {
    return (
      <BillDetailsSection title="Memo for vendor">
        <Skeleton className="h-20 w-full" />
      </BillDetailsSection>
    );
  }
  return <BillDetailsMemoLoaded />;
}

function BillDetailsMemoLoaded() {
  const { register } = useFormContext<BillEditFormType>();

  return (
    <BillDetailsSection title="Memo for vendor">
      <textarea
        {...register('memo')}
        rows={3}
        placeholder="Add a note the vendor will see on the payment…"
        // The disabled: trio mirrors the DS's shared inert treatment (stone
        // surface, hushed text, not-allowed cursor) — this textarea is bare,
        // so it must carry the contract itself when the read-only fieldset
        // disables it.
        className="bg-white text-sm font-body text-ink rounded-square border-control-border px-rui-3 py-rui-2 focus:ring-control-ring disabled:bg-stone disabled:text-hushed disabled:bg-stone disabled:text-hushed disabled:hover:bg-stone disabled:hover:text-hushed w-full border focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:border-transparent disabled:opacity-60"
      />
    </BillDetailsSection>
  );
}
