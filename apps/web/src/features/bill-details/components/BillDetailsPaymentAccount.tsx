'use client';

import { Select } from '@ramps/ui/Select';

import { useBillDetail } from '../context/BillDetail.context';
import { useRefOptions } from '../hooks/useRefOptions';
import { BillDetailsFormField } from './BillDetailsFormField';

/** ACH is the demo's only rail; the picker still shows it as the chosen method. */
const PAYMENT_METHOD_OPTIONS = [{ value: 'ach', label: 'ACH' }];

/**
 * The pay-from side of the payment section (snapshot 9): the rail (ACH only) and
 * the funding account. The account is SHARED state on the detail context (not
 * the bill's edit form — a payment is separate from the obligation) so Approve
 * can gate on it and the Schedule-payment modal edits the same value.
 */
export function BillDetailsPaymentAccount() {
  const { paymentAccounts } = useRefOptions();
  const { payment, setPayment } = useBillDetail();

  return (
    <div className="gap-rui-4 grid grid-cols-2">
      <BillDetailsFormField label="Payment method">
        <Select options={PAYMENT_METHOD_OPTIONS} value="ach" onValueChange={() => undefined} />
      </BillDetailsFormField>
      <BillDetailsFormField label="Pay from account">
        <Select
          options={paymentAccounts}
          placeholder="Select an account"
          value={payment.accountId}
          onValueChange={(accountId) => setPayment({ accountId })}
        />
      </BillDetailsFormField>
    </div>
  );
}
