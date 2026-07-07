'use client';

import { Select } from '@ramps/ui/Select';
import { useState } from 'react';

import { useRefOptions } from '../hooks/useRefOptions';
import { BillDetailsFormField } from './BillDetailsFormField';

/** ACH is the demo's only rail; the picker still shows it as the chosen method. */
const PAYMENT_METHOD_OPTIONS = [{ value: 'ach', label: 'ACH' }];

/**
 * The pay-from side of the payment section (snapshot 9): the rail (ACH only) and
 * the funding account. Account selection is local UI state — it isn't part of
 * the editable bill schema — so it lives here rather than in the form.
 */
export function BillDetailsPaymentAccount() {
  const { paymentAccounts } = useRefOptions();
  const [account, setAccount] = useState('');

  return (
    <div className="gap-rui-4 grid grid-cols-2">
      <BillDetailsFormField label="Payment method">
        <Select options={PAYMENT_METHOD_OPTIONS} value="ach" onValueChange={() => undefined} />
      </BillDetailsFormField>
      <BillDetailsFormField label="Pay from account">
        <Select
          options={paymentAccounts}
          placeholder="Select an account"
          value={account}
          onValueChange={setAccount}
        />
      </BillDetailsFormField>
    </div>
  );
}
