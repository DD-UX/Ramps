'use client';

import { Banner } from '@ramps/ui/Banner';
import { useWatch } from 'react-hook-form';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { daysOverdue } from '../helpers/arrival-date.helpers';
import { BillDetailsFieldSkeleton } from './BillDetailsFieldSkeleton';
import { BillDetailsPaymentAccount } from './BillDetailsPaymentAccount';
import { BillDetailsPaymentSchedule } from './BillDetailsPaymentSchedule';
import { BillDetailsSection } from './BillDetailsSection';

/**
 * Payment section (snapshot 9): the overdue cue plus the two payment concerns —
 * the pay-from account ({@link BillDetailsPaymentAccount}) and the schedule
 * ({@link BillDetailsPaymentSchedule}). If the bill's due date has passed the
 * amber overdue banner appears ("This bill is N days overdue"). The section
 * watches the due date; each child owns its own local scheduling state.
 *
 * A DETAIL-ONLY concern — the rail item carries no payment slice, so this
 * needs `full`: below it the seeded `payment: null` would paint an empty
 * schedule as if none were booked. Four field bars in the children's
 * two-column grid stand in.
 */
export function BillDetailsPayment() {
  const { dataLevel } = useBillDetail();
  if (!dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.FULL)) {
    return (
      <BillDetailsSection title="Payment details">
        <div className="gap-rui-4 grid grid-cols-2">
          <BillDetailsFieldSkeleton />
          <BillDetailsFieldSkeleton />
          <BillDetailsFieldSkeleton />
          <BillDetailsFieldSkeleton />
        </div>
      </BillDetailsSection>
    );
  }
  return <BillDetailsPaymentLoaded />;
}

function BillDetailsPaymentLoaded() {
  const { control } = useBillDetail().form;
  const dueDate = useWatch({ control, name: 'due_date' });
  const overdueDays = daysOverdue(dueDate ?? null);

  return (
    <BillDetailsSection title="Payment details" completeness="optional">
      {overdueDays > 0 && (
        <Banner
          tone="warning"
          title={`This bill is ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'} overdue`}
          description="Get it approved and scheduled to avoid a late payment."
        />
      )}

      <BillDetailsPaymentAccount />
      <BillDetailsPaymentSchedule />
    </BillDetailsSection>
  );
}
