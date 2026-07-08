import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaymentDraft } from '../helpers/payment-completeness.helpers';
import { BillDetailsScheduleModal } from './BillDetailsScheduleModal';

/**
 * BillDetailsScheduleModal is a thin shell over the shared payment slice: it
 * reuses the Payment section's own account + schedule controls, and its footer
 * drives {@link useSchedulePayment}. These tests prove that SHELL — schedule
 * mode books the payment and closes on success, surfaces the hook's error and
 * stays open on failure, gates its primary on payment completeness, and view
 * mode is a read-only "Close" with no write path.
 *
 * The reused children (BillDetailsPaymentAccount / PaymentScheduleControl) are
 * stubbed to tiny markers so the test stays on THIS component's contract and
 * doesn't drag in the ref catalogs / SWR the real fields need — their own
 * behaviour is covered where they live. The context + schedule hooks are
 * mocked: a payment slice we vary per case and a schedule() we resolve/reject.
 */
const schedule = vi.fn();
let submitting = false;
let scheduleError: string | null = null;
vi.mock('../hooks/useSchedulePayment', () => ({
  useSchedulePayment: () => ({ schedule, submitting, error: scheduleError }),
}));

let payment: PaymentDraft = { method: 'ach', accountId: 'acc-1', schedule: 'now', payDate: '' };
const setPayment = vi.fn();
vi.mock('../context/BillDetail.context', () => ({
  useBillDetail: () => ({ payment, setPayment }),
}));

// The reused Payment section pieces — rendered as markers so we can assert they
// mount (the modal "reuses the same elements") without their real deps.
vi.mock('./BillDetailsPaymentAccount', () => ({
  BillDetailsPaymentAccount: () => <div data-testid="payment-account" />,
}));
vi.mock('./BillDetailsPaymentSchedule', () => ({
  PaymentScheduleControl: (props: { readOnly?: boolean }) => (
    <div data-testid="schedule-control" data-readonly={String(props.readOnly ?? false)} />
  ),
}));

const onClose = vi.fn();

/**
 * The footer's "Close" — the one with the visible text node — as opposed to the
 * header's X IconButton, whose accessible name is ALSO "Close". Both share the
 * role+name, so we disambiguate on the rendered text content.
 */
function footerCloseButton(): HTMLElement {
  const button = screen
    .getAllByRole('button', { name: /close/i })
    .find((el) => el.textContent?.trim() === 'Close');
  if (!button) throw new Error('footer Close button not found');
  return button;
}

beforeEach(() => {
  schedule.mockReset();
  setPayment.mockReset();
  onClose.mockReset();
  submitting = false;
  scheduleError = null;
  payment = { method: 'ach', accountId: 'acc-1', schedule: 'now', payDate: '' };
});

describe('BillDetailsScheduleModal — schedule mode', () => {
  it('reuses the Payment section account + schedule controls (editable)', () => {
    render(<BillDetailsScheduleModal open onClose={onClose} mode="schedule" />);

    expect(screen.getByTestId('payment-account')).toBeInTheDocument();
    // Editable: the schedule control is NOT frozen.
    expect(screen.getByTestId('schedule-control')).toHaveAttribute('data-readonly', 'false');
    expect(screen.getByRole('heading', { name: /schedule payment/i })).toBeInTheDocument();
  });

  it('books the payment and closes on success', async () => {
    schedule.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<BillDetailsScheduleModal open onClose={onClose} mode="schedule" />);

    await user.click(screen.getByRole('button', { name: /^schedule payment$/i }));

    await waitFor(() => expect(schedule).toHaveBeenCalledOnce());
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('stays open when scheduling fails', async () => {
    schedule.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<BillDetailsScheduleModal open onClose={onClose} mode="schedule" />);

    await user.click(screen.getByRole('button', { name: /^schedule payment$/i }));

    await waitFor(() => expect(schedule).toHaveBeenCalledOnce());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("surfaces the hook's error beside Cancel", () => {
    scheduleError = 'Could not schedule the payment. Please try again.';
    render(<BillDetailsScheduleModal open onClose={onClose} mode="schedule" />);

    expect(screen.getByText(/could not schedule the payment/i)).toBeInTheDocument();
  });

  it('disables the primary until the payment slice is complete', () => {
    // No account picked → incomplete → primary disabled.
    payment = { method: 'ach', accountId: '', schedule: 'now', payDate: '' };
    render(<BillDetailsScheduleModal open onClose={onClose} mode="schedule" />);

    expect(screen.getByRole('button', { name: /^schedule payment$/i })).toBeDisabled();
  });

  it('shows the busy label and disables actions while submitting', () => {
    submitting = true;
    render(<BillDetailsScheduleModal open onClose={onClose} mode="schedule" />);

    expect(screen.getByRole('button', { name: /scheduling…/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('cancels via the Cancel button', async () => {
    const user = userEvent.setup();
    render(<BillDetailsScheduleModal open onClose={onClose} mode="schedule" />);

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(schedule).not.toHaveBeenCalled();
  });
});

describe('BillDetailsScheduleModal — view mode', () => {
  it('is read-only: a single Close, no schedule/cancel, frozen controls', () => {
    // A scheduled bill seeds a concrete date.
    payment = { method: 'ach', accountId: 'acc-1', schedule: 'later', payDate: '2026-01-15' };
    render(<BillDetailsScheduleModal open onClose={onClose} mode="view" />);

    expect(screen.getByRole('heading', { name: /payment schedule/i })).toBeInTheDocument();
    // The footer's Close (its own visible text) — distinct from the header's X
    // IconButton, whose accessible name is also "Close".
    expect(footerCloseButton()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^schedule payment$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    // The schedule control is told to freeze; the account picker is frozen by
    // the disabled <fieldset> the modal wraps the body in.
    expect(screen.getByTestId('schedule-control')).toHaveAttribute('data-readonly', 'true');
  });

  it('closes via Close and never schedules', async () => {
    payment = { method: 'ach', accountId: 'acc-1', schedule: 'later', payDate: '2026-01-15' };
    const user = userEvent.setup();
    render(<BillDetailsScheduleModal open onClose={onClose} mode="view" />);

    await user.click(footerCloseButton());

    expect(onClose).toHaveBeenCalledOnce();
    expect(schedule).not.toHaveBeenCalled();
  });

  it('renders nothing interactive when closed', () => {
    render(<BillDetailsScheduleModal open={false} onClose={onClose} mode="view" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
