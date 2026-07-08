'use client';

import { Badge } from '@ramps/ui/Badge';
import { FieldInput } from '@ramps/ui/FieldInput';
import { SegmentedArea } from '@ramps/ui/SegmentedArea';

import { useBillDetail } from '../context/BillDetail.context';
import { addBusinessDays } from '../helpers/arrival-date.helpers';
import { resolveScheduledDate } from '../helpers/payment-completeness.helpers';
import { BillDetailsFormField } from './BillDetailsFormField';

type Schedule = 'now' | 'later';

/**
 * The bare "Schedule now / Schedule later" segmented control — the schedule
 * side of the payment section (snapshot 9), built on the design system's
 * {@link SegmentedArea}. "Now" shows the immediate arrival read-out; "Later"
 * reveals the payment-date field whose arrival derives from
 * {@link addBusinessDays} ("2 business days").
 *
 * PRESENTATIONAL: it takes its value + change handlers rather than owning them,
 * so it renders identically in the inline Payment section (bound to the detail
 * context's payment slice) and in the Schedule-payment modal (bound to the same
 * slice, or frozen when the modal is read-only "View schedule").
 */
export interface PaymentScheduleControlProps {
  schedule: Schedule;
  payDate: string;
  onScheduleChange: (schedule: Schedule) => void;
  onPayDateChange: (payDate: string) => void;
  /** Freeze inputs for the read-only "View schedule" modal. */
  readOnly?: boolean;
}

export function PaymentScheduleControl({
  schedule,
  payDate,
  onScheduleChange,
  onPayDateChange,
  readOnly = false,
}: PaymentScheduleControlProps) {
  const scheduledDate = resolveScheduledDate({ method: 'ach', accountId: '', schedule, payDate });
  const arrival = addBusinessDays(scheduledDate);

  return (
    <SegmentedArea
      value={schedule}
      onValueChange={(value) => !readOnly && onScheduleChange(value as Schedule)}
      tabs={[
        {
          value: 'now',
          label: 'Schedule now',
          content: <ArrivalReadout arrival={arrival} />,
        },
        {
          value: 'later',
          label: 'Schedule later',
          content: (
            <BillDetailsPaymentDate
              payDate={payDate}
              onPayDateChange={onPayDateChange}
              arrival={arrival}
              readOnly={readOnly}
            />
          ),
        },
      ]}
    />
  );
}

/**
 * The inline Payment section's schedule field — the {@link PaymentScheduleControl}
 * bound to the shared payment slice on the detail context. Schedule and date
 * live there (not in the bill's edit form) so Approve can read them and the
 * modal edits the same values.
 */
export function BillDetailsPaymentSchedule() {
  const { payment, setPayment } = useBillDetail();

  return (
    <BillDetailsFormField label="Payment schedule">
      <PaymentScheduleControl
        schedule={payment.schedule}
        payDate={payment.payDate}
        onScheduleChange={(schedule) => setPayment({ schedule })}
        onPayDateChange={(payDate) => setPayment({ payDate })}
      />
    </BillDetailsFormField>
  );
}

/** The bare arrival read-out shown for "Schedule now" (no date to pick). */
function ArrivalReadout({ arrival }: { arrival: string | null }) {
  return (
    <div className="gap-rui-2 flex items-center">
      <span className="text-sm font-body text-ink">Arrives {arrival ?? '—'}</span>
      {arrival && <Badge tone="neutral">2 business days</Badge>}
    </div>
  );
}

interface BillDetailsPaymentDateProps {
  payDate: string;
  onPayDateChange: (value: string) => void;
  arrival: string | null;
  readOnly?: boolean;
}

/** Pay-date field paired with its derived "2 business days" arrival read-out. */
function BillDetailsPaymentDate({
  payDate,
  onPayDateChange,
  arrival,
  readOnly = false,
}: BillDetailsPaymentDateProps) {
  return (
    <div className="gap-rui-4 grid grid-cols-2 items-end">
      <FieldInput
        label="Payment date"
        type="date"
        value={payDate}
        disabled={readOnly}
        onChange={(event) => onPayDateChange(event.target.value)}
      />
      <BillDetailsFormField label="Arrival date">
        <div className="gap-rui-2 h-12 flex items-center">
          <span className="text-sm font-body text-ink">{arrival ?? '—'}</span>
          {arrival && <Badge tone="neutral">2 business days</Badge>}
        </div>
      </BillDetailsFormField>
    </div>
  );
}
