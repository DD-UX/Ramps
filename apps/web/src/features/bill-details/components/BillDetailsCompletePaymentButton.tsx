'use client';

import { Button } from '@ramps/ui/Button';
import { FieldError } from '@ramps/ui/FieldError';
import { Zap } from '@ramps/ui/icons';

import { PRIMARY_ACTION_BY_STATUS } from '../constants/primary-action.constants';
import { useRollPayment } from '../hooks/useRollPayment';

/** The roll flow shape — the slice of {@link useRollPayment} this button reads. */
type RollFlow = ReturnType<typeof useRollPayment>;

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
  /**
   * A roll flow to SHARE rather than owning one. The footer passes its own
   * {@link useRollPayment} instance so this button's click and the form-level
   * ⌘/Ctrl+↵ shortcut drive ONE flow (one `submitting`/`error`, one settle).
   * Omitted (the modal case) → this button owns its own instance.
   */
  flow?: RollFlow;
  /**
   * Decorative ⌘/Ctrl+↵ chip — set only when this button IS the active footer
   * primary (`partially_paid`), so the chord it advertises actually fires it.
   */
  keys?: string[];
}

export function BillDetailsCompletePaymentButton({
  onDone,
  variant = 'primary',
  flow,
  keys,
}: BillDetailsCompletePaymentButtonProps) {
  // Share the footer's flow when handed one; otherwise own a private instance
  // (the modal). Called unconditionally to satisfy the Rules of Hooks — its
  // result is simply ignored when a `flow` is supplied.
  const ownFlow = useRollPayment();
  const { roll, submitting, error } = flow ?? ownFlow;
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
        keys={keys}
      >
        {submitting ? 'Completing…' : label}
      </Button>
    </div>
  );
}
