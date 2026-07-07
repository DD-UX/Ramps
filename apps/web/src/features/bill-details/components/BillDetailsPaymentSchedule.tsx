'use client';

import { Badge } from '@ramps/ui/Badge';
import { FieldInput } from '@ramps/ui/FieldInput';
import { SegmentedArea } from '@ramps/ui/SegmentedArea';
import { useState } from 'react';

import { addBusinessDays } from '../helpers/arrival-date.helpers';
import { BillDetailsFormField } from './BillDetailsFormField';

type Schedule = 'now' | 'later';

/**
 * The scheduling side of the payment section (snapshot 9): pay now vs. later,
 * built on the design system's {@link SegmentedArea} — the "Schedule now /
 * Schedule later" strip sits on top and the panel beneath swaps its content
 * with the segment. "Now" shows the immediate arrival read-out; "Later" reveals
 * the payment-date field whose arrival derives from {@link addBusinessDays}
 * ("2 business days"). Schedule and date are local UI state — not part of the
 * editable bill schema.
 */
export function BillDetailsPaymentSchedule() {
  const [schedule, setSchedule] = useState<Schedule>('now');
  const [payDate, setPayDate] = useState('');

  const scheduledDate = schedule === 'later' ? payDate || null : todayIso();
  const arrival = addBusinessDays(scheduledDate);

  return (
    <BillDetailsFormField label="Payment schedule">
      <SegmentedArea
        value={schedule}
        onValueChange={(value) => setSchedule(value as Schedule)}
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
                onPayDateChange={setPayDate}
                arrival={arrival}
              />
            ),
          },
        ]}
      />
    </BillDetailsFormField>
  );
}

/** Today as an ISO `yyyy-mm-dd` date string (the "Schedule now" baseline). */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
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
}

/** Pay-date field paired with its derived "2 business days" arrival read-out. */
function BillDetailsPaymentDate({
  payDate,
  onPayDateChange,
  arrival,
}: BillDetailsPaymentDateProps) {
  return (
    <div className="gap-rui-4 grid grid-cols-2 items-end">
      <FieldInput
        label="Payment date"
        type="date"
        value={payDate}
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
