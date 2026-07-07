'use client';

import { Money } from '@ramps/ui/Money';

export interface BillDetailsLineItemsTotalProps {
  linesTotal: number;
  amountCents: number;
}

/**
 * The invoice-total reconcile line under the coding grid (snapshot 7): green
 * `Money` when the lines sum to the bill total, an amber "$X of $Y" cue when
 * they don't. Pure over the two cent totals the parent already computes.
 */
export function BillDetailsLineItemsTotal({
  linesTotal,
  amountCents,
}: BillDetailsLineItemsTotalProps) {
  const reconciles = linesTotal === amountCents;

  return (
    <div className="gap-rui-2 border-bone pt-rui-3 flex items-center justify-between border-t">
      <span className="text-xs font-heading text-hushed">Invoice total</span>
      {reconciles ? (
        <Money cents={linesTotal} />
      ) : (
        <span className="gap-rui-1 text-sm font-body text-tone-warning-on inline-flex items-center">
          <Money cents={linesTotal} muted /> of <Money cents={amountCents} />
        </span>
      )}
    </div>
  );
}
