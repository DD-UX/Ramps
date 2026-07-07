'use client';

import { Banner } from '@ramps/ui/Banner';
import { useWatch } from 'react-hook-form';

import { useBillDetail } from '../context/BillDetail.context';
import { daysOverdue } from '../helpers/arrival-date.helpers';
import { BillDetailsPaymentAccount } from './BillDetailsPaymentAccount';
import { BillDetailsPaymentSchedule } from './BillDetailsPaymentSchedule';
import { BillDetailsSection } from './BillDetailsSection';

/**
 * Payment section (snapshot 9): the overdue cue plus the two payment concerns —
 * the pay-from account ({@link BillDetailsPaymentAccount}) and the schedule
 * ({@link BillDetailsPaymentSchedule}). If the bill's due date has passed the
 * amber overdue banner appears ("This bill is N days overdue"). The section
 * watches the due date; each child owns its own local scheduling state.
 */
export function BillDetailsPayment() {
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
