'use client';

import type { BillEditFormType } from '@ramps/schemas/bills';
import { Checkbox } from '@ramps/ui/Checkbox';
import { Trash2 } from '@ramps/ui/icons';
import { Menu } from '@ramps/ui/Menu';

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
 * One coding row, shaped after the Ramp line-item grid (does-ramp-live-up §07 at
 * ~7:28). A monospace **index** (`01`) sits in a left gutter; everything else
 * slots into a single **three-column grid** so every field lands in its own
 * place and columns align across rows:
 *
 *   - **Description** spans the first two columns; the third column pairs the
 *     right-aligned monospace **amount** with the `⋮` overflow that carries Remove.
 *   - The accounting coding (our NetSuite dimensions — GL account, department,
 *     class, location, tax code) flows into the same grid beneath.
 *   - **Billable** spans all three columns on its own line, like the frame's
 *     "Save as default coding" checkbox.
 *
 * Field names are indexed into the parent `useFieldArray`, so the row stays a
 * dumb presentational leaf — it only needs its index and a remove handler.
 */
export function BillDetailsLineItemRow({ index, onRemove }: BillDetailsLineItemRowProps) {
  const { register } = useBillDetail().form;
  const { glAccounts, departments, classes, locations, taxCodes } = useRefOptions();

  const humanIndex = String(index + 1).padStart(2, '0');

  return (
    <div className="gap-rui-3 border-bone p-rui-3 flex items-start border-b last:border-b-0">
      {/*
       * Left gutter, outside the grid: the monospace index anchors the primary
       * line and the `↳` elbow marks where the subordinate coding block begins —
       * both gutter cues, so the 3-column grid to their right stays clean.
       */}
      <div className="gap-rui-3 flex flex-col text-hushed">
        <span aria-hidden className="pt-3 font-mono text-sm tabular-nums select-none">
          {humanIndex}
        </span>
        <span aria-hidden className="select-none">
          ↳
        </span>
      </div>

      {/* Everything else slots into one 3-column grid so fields align across rows. */}
      <div className="gap-rui-3 grid flex-1 grid-cols-3">
        {/* Description spans cols 1–2; amount + overflow share the third cell. */}
        <div className="col-span-2">
          <BillDetailsTextField name={`line_items.${index}.description`} label="Description" />
        </div>
        <div className="gap-rui-2 flex items-start">
          <div className="flex-1">
            <BillDetailsTextField
              name={`line_items.${index}.amount_cents`}
              label="Amount (cents)"
              type="number"
              numeric
              className="[&_input]:font-mono [&_input]:text-right [&_input]:tabular-nums"
            />
          </div>
          {/* Center the ⋮ against the input box (FieldInput's control is h-12),
              not the whole cell — the floating label + error slot below shouldn't
              drag the menu off-center. */}
          <div className="flex h-12 items-center">
            <Menu
              label={`Line ${humanIndex} actions`}
              items={[
                {
                  label: 'Remove line',
                  tone: 'destructive',
                  icon: <Trash2 size={14} />,
                  onSelect: onRemove,
                },
              ]}
            />
          </div>
        </div>

        {/* Coding — our NetSuite dimensions flow into the same 3 columns. */}
        <BillDetailsSelectField
          name={`line_items.${index}.gl_account_id`}
          label="GL account"
          options={glAccounts}
          placeholder="Select a GL account"
        />
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

        {/* Billable spans all three columns, like the frame's default-coding line. */}
        <div className="col-span-3">
          <Checkbox label="Billable" {...register(`line_items.${index}.billable`)} />
        </div>
      </div>
    </div>
  );
}
