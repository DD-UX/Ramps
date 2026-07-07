'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Button } from '@ramps/ui/Button';
import { Checkbox } from '@ramps/ui/Checkbox';
import { Trash2 } from '@ramps/ui/icons';

import { useBillDetail } from '../context/BillDetail.context';
import { useRefOptions } from '../hooks/useRefOptions';
import { BillDetailsSelectField } from './BillDetailsSelectField';
import { BillDetailsTextField } from './BillDetailsTextField';

/** A fresh, uncoded line — the shape "Add line item" appends (snapshot 7). */
export const EMPTY_LINE: BillEditFormType['line_items'][number] = {
  id: null,
  kind: 'expense',
  description: '',
  qty: null,
  unit_price_cents: null,
  amount_cents: 0,
  gl_account_id: null,
  department_id: null,
  class_id: null,
  location_id: null,
  tax_code_id: null,
  custom_dimension_id: null,
  billable: false,
};

export interface BillDetailsLineItemRowProps {
  index: number;
  onRemove: () => void;
}

/**
 * One coding row (snapshot 7): an amount coded to a GL account (QuickBooks
 * "Category") plus the accounting dimensions, a billable flag, and a remove
 * action. Field names are indexed into the parent `useFieldArray`, so the row
 * stays a dumb presentational leaf — it only needs its index and a remove
 * handler.
 */
export function BillDetailsLineItemRow({ index, onRemove }: BillDetailsLineItemRowProps) {
  const { register } = useBillDetail().form;
  const { glAccounts, departments, classes, locations, taxCodes } = useRefOptions();

  return (
    <div className="gap-rui-3 rounded-square border-bone p-rui-3 flex flex-col border">
      <div className="gap-rui-3 grid grid-cols-2">
        <BillDetailsTextField name={`line_items.${index}.description`} label="Description" />
        <BillDetailsSelectField
          name={`line_items.${index}.gl_account_id`}
          label="Category"
          options={glAccounts}
          placeholder="Select a GL account"
        />
      </div>
      <div className="gap-rui-3 grid grid-cols-4">
        <BillDetailsSelectField
          name={`line_items.${index}.department_id`}
          label="Department"
          options={departments}
          placeholder="—"
        />
        <BillDetailsSelectField
          name={`line_items.${index}.class_id`}
          label="Class"
          options={classes}
          placeholder="—"
        />
        <BillDetailsSelectField
          name={`line_items.${index}.location_id`}
          label="Location"
          options={locations}
          placeholder="—"
        />
        <BillDetailsSelectField
          name={`line_items.${index}.tax_code_id`}
          label="Tax code"
          options={taxCodes}
          placeholder="—"
        />
      </div>
      <div className="gap-rui-3 flex items-end justify-between">
        <div className="w-40">
          <BillDetailsTextField
            name={`line_items.${index}.amount_cents`}
            label="Amount (cents)"
            type="number"
            numeric
          />
        </div>
        <Checkbox label="Billable" {...register(`line_items.${index}.billable`)} />
        <Button
          variant="subtle"
          size="sm"
          type="button"
          leadingIcon={<Trash2 size={14} />}
          onClick={onRemove}
          aria-label={`Remove line ${index + 1}`}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
