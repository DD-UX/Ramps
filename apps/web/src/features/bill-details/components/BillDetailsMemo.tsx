'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { useFormContext } from 'react-hook-form';

import { BillDetailsSection } from './BillDetailsSection';

/**
 * Memo section (snapshot 10): the free-text "Memo for vendor" that rides along
 * with the payment. A plain textarea bound to the form's `memo` field.
 */
export function BillDetailsMemo() {
  const { register } = useFormContext<BillEditFormType>();

  return (
    <BillDetailsSection title="Memo for vendor">
      <textarea
        {...register('memo')}
        rows={3}
        placeholder="Add a note the vendor will see on the payment…"
        className="bg-white text-sm font-body text-ink rounded-square border-control-border px-rui-3 py-rui-2 focus:ring-control-ring w-full border focus:ring-2 focus:outline-none"
      />
    </BillDetailsSection>
  );
}
