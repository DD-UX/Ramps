'use client';

import { Badge } from '@ramps/ui/Badge';
import { Button } from '@ramps/ui/Button';
import { useState } from 'react';

import { addBusinessDays } from '../helpers/arrival-date.helpers';
import { BillDetailsFormField } from './BillDetailsFormField';

type Schedule = 'now' | 'later';

/** The two schedule choices, rendered as a segmented pair of toggle buttons. */
const SCHEDULE_OPTIONS: ReadonlyArray<{ value: Schedule; label: string }> = [
  { value: 'now', label: 'Schedule now' },
  { value: 'later', label: 'Schedule later' },
];

/**
 * The scheduling side of the payment section (snapshot 9): pay now vs. later.
 * "Later" reveals a payment date whose arrival date derives from
 * {@link addBusinessDays} ("2 business days"). Schedule and date are local UI
 * state — not part of the editable bill schema.
 */
export function BillDetailsPaymentSchedule() {
  const [schedule, setSchedule] = useState<Schedule>('now');
  const [payDate, setPayDate] = useState('');

  const scheduledDate =
    schedule === 'later' ? payDate || null : new Date().toISOString().slice(0, 10);
  const arrival = addBusinessDays(scheduledDate);

  return (
    <>
      <BillDetailsFormField label="Payment schedule">
        <div className="gap-rui-2 flex items-center">
          {SCHEDULE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={schedule === option.value ? 'ink' : 'secondary'}
              onClick={() => setSchedule(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </BillDetailsFormField>

      {schedule === 'later' && (
        <BillDetailsPaymentDate payDate={payDate} onPayDateChange={setPayDate} arrival={arrival} />
      )}
    </>
  );
}

interface BillDetailsPaymentDateProps {
  payDate: string;
  onPayDateChange: (value: string) => void;
  arrival: string | null;
}

/** Pay-date input paired with its derived "2 business days" arrival readout. */
function BillDetailsPaymentDate({
  payDate,
  onPayDateChange,
  arrival,
}: BillDetailsPaymentDateProps) {
  return (
    <div className="gap-rui-4 grid grid-cols-2 items-end">
      <BillDetailsFormField label="Payment date" htmlFor="payment-date">
        <input
          id="payment-date"
          type="date"
          value={payDate}
          onChange={(event) => onPayDateChange(event.target.value)}
          className="bg-white text-sm font-body text-ink rounded-square border-control-border h-10 px-rui-3 w-full border"
        />
      </BillDetailsFormField>
      <BillDetailsFormField label="Arrival date">
        <div className="gap-rui-2 h-10 flex items-center">
          <span className="text-sm font-body text-ink">{arrival ?? '—'}</span>
          {arrival && <Badge tone="neutral">2 business days</Badge>}
        </div>
      </BillDetailsFormField>
    </div>
  );
}
