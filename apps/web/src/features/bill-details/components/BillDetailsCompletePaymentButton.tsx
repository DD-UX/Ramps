'use client';

import { Button } from '@ramps/ui/Button';
import { FieldError } from '@ramps/ui/FieldError';
import { Zap } from '@ramps/ui/icons';

import { PRIMARY_ACTION_BY_STATUS } from '../constants/primary-action.constants';
import { useRollPayment } from '../hooks/useRollPayment';

/**
 * BillDetailsCompletePaymentButton — the "Complete payment" action for a
 * `scheduled` bill: release the booked payment NOW rather than waiting for its
 * date. ONE self-contained component used in BOTH places the action appears —
 * the bill-details footer (beside "View schedule") and the View-schedule modal
 * (beside Close) — so the wiring lives once, not duplicated per call site.
 *
 * It owns its {@link useRollPayment} flow (loading + inline error), disables
 * itself in flight so a double-click can't fire twice, and reuses the shared
 * "Complete payment" label from {@link PRIMARY_ACTION_BY_STATUS} (the same text
 * a `partially_paid` bill's primary reads) rather than a stray string.
 *
 * `onDone` fires only on a SUCCESSFUL roll — the modal passes its `onClose` so a
 * completed payment closes the dialog; the footer passes nothing (the
 * `router.refresh()` inside the hook already re-renders it to the paid state).
 */
export interface BillDetailsCompletePaymentButtonProps {
  /** Called after a successful roll — e.g. the modal's `onClose`. */
  onDone?: () => void;
  /** Button variant — `primary` in the modal, `secondary` beside the footer's View. */
  variant?: 'primary' | 'secondary';
}

export function BillDetailsCompletePaymentButton({
  onDone,
  variant = 'primary',
}: BillDetailsCompletePaymentButtonProps) {
  const { roll, submitting, error } = useRollPayment();
  const label = PRIMARY_ACTION_BY_STATUS.partially_paid; // "Complete payment"

  const onClick = async () => {
    const ok = await roll();
    if (ok) onDone?.();
  };

  return (
    <div className="gap-rui-3 flex items-center">
      <FieldError size="sm">{error}</FieldError>
      <Button
        type="button"
        variant={variant}
        leadingIcon={<Zap size={16} />}
        onClick={() => void onClick()}
        disabled={submitting}
      >
        {submitting ? 'Completing…' : label}
      </Button>
    </div>
  );
}
