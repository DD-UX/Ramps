import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BillDetailsCompletePaymentButton } from './BillDetailsCompletePaymentButton';

/**
 * BillDetailsCompletePaymentButton is the ONE shared "Complete payment" action —
 * used in both the bill-details footer and the View-schedule modal. It owns the
 * {@link useRollPayment} flow, so these tests prove that contract: it rolls the
 * booked payment on click, fires `onDone` only on a SUCCESSFUL roll, surfaces
 * the hook's inline error (and does NOT call onDone) on failure, and disables
 * itself while in flight so a double-click can't fire twice.
 *
 * The roll hook is mocked — its own POST/refresh wiring is covered where it
 * lives; here we vary roll()'s resolution and the submitting/error it reports.
 */
const roll = vi.fn();
let submitting = false;
let rollError: string | null = null;
vi.mock('../hooks/useRollPayment', () => ({
  useRollPayment: () => ({ roll, submitting, error: rollError }),
}));

const onDone = vi.fn();

beforeEach(() => {
  roll.mockReset();
  onDone.mockReset();
  submitting = false;
  rollError = null;
});

describe('BillDetailsCompletePaymentButton', () => {
  it('reads the shared "Complete payment" label', () => {
    render(<BillDetailsCompletePaymentButton />);

    expect(screen.getByRole('button', { name: /^complete payment$/i })).toBeInTheDocument();
  });

  it('rolls the payment and fires onDone on success', async () => {
    roll.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<BillDetailsCompletePaymentButton onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: /^complete payment$/i }));

    await waitFor(() => expect(roll).toHaveBeenCalledOnce());
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
  });

  it('does not fire onDone when the roll fails', async () => {
    roll.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<BillDetailsCompletePaymentButton onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: /^complete payment$/i }));

    await waitFor(() => expect(roll).toHaveBeenCalledOnce());
    expect(onDone).not.toHaveBeenCalled();
  });

  it("surfaces the hook's inline error", () => {
    rollError = 'Could not complete the payment. Please try again.';
    render(<BillDetailsCompletePaymentButton />);

    expect(screen.getByText(/could not complete the payment/i)).toBeInTheDocument();
  });

  it('shows the busy label and disables while submitting', () => {
    submitting = true;
    render(<BillDetailsCompletePaymentButton />);

    expect(screen.getByRole('button', { name: /completing…/i })).toBeDisabled();
  });

  it('drives a SHARED flow when one is passed instead of owning its own', async () => {
    // The footer hands the button its own useRollPayment instance so the button
    // click and the form's ⌘/Ctrl+↵ shortcut settle ONE payment. When a `flow`
    // is supplied the button ignores its private instance and uses that one.
    const sharedRoll = vi.fn().mockResolvedValue(true);
    const sharedFlow = { roll: sharedRoll, submitting: false, error: null };
    const user = userEvent.setup();
    render(<BillDetailsCompletePaymentButton flow={sharedFlow} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: /^complete payment$/i }));

    await waitFor(() => expect(sharedRoll).toHaveBeenCalledOnce());
    expect(roll).not.toHaveBeenCalled(); // the private instance stays untouched
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
  });

  it('reflects the SHARED flow\u2019s submitting state', () => {
    // Busy state rides the shared flow: when the form's roll is in flight, the
    // button reads that — not its own idle instance — and disables.
    const sharedFlow = { roll: vi.fn(), submitting: true, error: null };
    render(<BillDetailsCompletePaymentButton flow={sharedFlow} />);

    expect(screen.getByRole('button', { name: /completing…/i })).toBeDisabled();
  });
});
