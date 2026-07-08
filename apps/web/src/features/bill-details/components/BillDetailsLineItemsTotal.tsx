'use client';

import { Money } from '@ramps/ui/Money';

export interface BillDetailsLineItemsTotalProps {
  linesTotal: number;
  amountCents: number;
}

/**
 * The invoice-total stack in the coding-grid footer (does-ramp-live-up §07): a
 * small hushed "Invoice total" label over the large coded amount, right-aligned
 * against the bill. When the summed lines reconcile to the bill total it's a
 * plain green `Money`; when they don't, an amber "$X of $Y" cue calls out the
 * gap. The amount is monospace to sit in the same numeric column as the rows.
 * Pure over the two cent totals the parent already computes.
 */
export function BillDetailsLineItemsTotal({
  linesTotal,
  amountCents,
}: BillDetailsLineItemsTotalProps) {
  const reconciles = linesTotal === amountCents;

  return (
    <div className="gap-rui-1 flex flex-col items-end text-right">
      <span className="text-xs font-heading text-hushed">Invoice total</span>
      {reconciles ? (
        <Money cents={linesTotal} mono className="text-lg" />
      ) : (
        <span className="gap-rui-1 text-sm font-body text-tone-warning-on inline-flex items-center">
          <Money cents={linesTotal} mono muted /> of <Money cents={amountCents} mono />
        </span>
      )}
    </div>
  );
}
