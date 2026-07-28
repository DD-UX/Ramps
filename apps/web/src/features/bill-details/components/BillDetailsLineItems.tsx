'use client';

import { Button } from '@ramps/ui/Button';
import { Card } from '@ramps/ui/Card';
import { cn } from '@ramps/ui/cn';
import { Plus } from '@ramps/ui/icons';
import { Skeleton } from '@ramps/ui/Skeleton';
import { useFieldArray, useWatch } from 'react-hook-form';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
import { useBillDetail } from '../context/BillDetail.context';
import {
  lineItemsCompleteness,
  lineItemsTotalCents,
} from '../helpers/section-completeness.helpers';
import { BillDetailsLineItemRow, EMPTY_LINE } from './BillDetailsLineItemRow';
import { BillDetailsLineItemsTotal } from './BillDetailsLineItemsTotal';
import { BillDetailsSection } from './BillDetailsSection';

/**
 * Line items — the coding grid (does-ramp-live-up §07 at ~7:28). A `useFieldArray`
 * owns the add/remove; each row ({@link BillDetailsLineItemRow}) codes an amount
 * to a GL account plus the accounting dimensions. The section is `Incomplete`
 * until every line has a GL account and a non-zero amount. The footer balances a
 * "+ Add line item" affordance on the left against the invoice-total stack
 * ({@link BillDetailsLineItemsTotal}) on the right, which reconciles the summed
 * lines against the bill total.
 *
 * A DETAIL-ONLY concern — the rail item carries no lines, so this needs
 * `full`: below it the seeded `[]` would paint the "No line items yet" empty
 * state, a lie about a bill that may be fully coded. The skeleton guesses
 * three rows in the real bordered card; the count is wrong exactly as often
 * as any other guess, and the error lands below the fold.
 */
export function BillDetailsLineItems() {
  const { dataLevel } = useBillDetail();
  if (!dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.FULL)) {
    return (
      <BillDetailsSection title="Line items">
        <Card className="p-rui-3 gap-rui-2 grid">
          {[0, 1, 2].map((row) => (
            <div key={row} className="gap-rui-2 flex">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-16" />
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </Card>
      </BillDetailsSection>
    );
  }
  return <BillDetailsLineItemsLoaded />;
}

function BillDetailsLineItemsLoaded() {
  const { form, editable } = useBillDetail();
  const { control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' });

  // Watch the array + the bill total so completeness and the reconcile line
  // recompute on every edit.
  const lineItems = useWatch({ control, name: 'line_items' });
  const amountCents = useWatch({ control, name: 'amount_cents' });
  const lines = { line_items: lineItems ?? [] };

  const completeness = lineItemsCompleteness(lines);
  const linesTotal = lineItemsTotalCents(lines);

  return (
    <BillDetailsSection title="Line items" completeness={completeness}>
      <div>
        {fields.length === 0 ? (
          <p className="text-sm font-body text-hushed">
            No line items yet. Add one to start coding this bill.
          </p>
        ) : (
          <Card className="p-0">
            {fields.map((field, index) => (
              <BillDetailsLineItemRow key={field.id} index={index} onRemove={() => remove(index)} />
            ))}
          </Card>
        )}

        {/*
         * Footer, per the Ramp coding grid (does-ramp-live-up §07 at ~7:28): a thin
         * "+ Add line item" affordance on the left, balanced against the right-aligned
         * invoice-total stack — the two anchor the grid's bottom edge together.
         */}
        <Card
          className={cn({
            'p-rui-3': true,
            'border-t-0': fields.length > 0,
          })}
        >
          {editable && (
            <Button
              variant="secondary"
              size="sm"
              type="button"
              leadingIcon={<Plus size={14} />}
              onClick={() => append(EMPTY_LINE)}
            >
              Add line item
            </Button>
          )}
          <BillDetailsLineItemsTotal linesTotal={linesTotal} amountCents={amountCents ?? 0} />
        </Card>
      </div>
    </BillDetailsSection>
  );
}
