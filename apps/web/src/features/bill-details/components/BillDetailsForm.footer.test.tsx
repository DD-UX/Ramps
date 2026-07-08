import type { BillDetailType, BillStatusType } from '@ramps/schemas/bills';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BillDetailsForm } from './BillDetailsForm';

/**
 * BillDetailsForm's STATUS-DRIVEN PRIMARY — the one footer button whose label +
 * behaviour the bill's status resolves. These tests exercise that wiring end to
 * end at the button level: `awaiting_approval` fires {@link useApproveBill};
 * `approved` opens the schedule modal to book a payment; `scheduled` opens the
 * same modal read-only ("View schedule"); `draft` rides the form's native
 * submit. The heavy section children + the RHF plumbing are stubbed so the test
 * stays on the footer's own contract.
 *
 * The context + flow hooks are mocked: a bill whose status we vary per case, a
 * form stub with just the pieces the footer reads, and approve/submit spies we
 * assert. The schedule modal is stubbed to a marker that echoes its open+mode,
 * so we prove the footer opens it in the right mode without rendering the real
 * dialog.
 */
const approve = vi.fn();
const submit = vi.fn();
vi.mock('../hooks/useApproveBill', () => ({
  useApproveBill: () => ({ approve, submitting: false, error: null }),
}));
vi.mock('../hooks/useSubmitBill', () => ({
  useSubmitBill: () => ({ submit, submitting: false, error: null }),
}));
vi.mock('../hooks/useSaveBillDraft', () => ({
  useSaveBillDraft: () => ({ saveDraft: vi.fn(), saving: false, error: null }),
}));

vi.mock('@/features/common/hooks/useIsApplePlatform', () => ({
  useIsApplePlatform: () => true,
}));

// RHF reads through the form stub: useFormState reports a valid form, useWatch
// feeds the submit-completeness check a complete bill so `draft`'s primary is
// enabled. handleSubmit returns a submit handler that just calls the valid arm.
const completeValues = {
  vendor_id: 'v-1',
  invoice_number: 'INV-1',
  invoice_date: '2026-01-01',
  due_date: '2026-02-01',
  line_items: [{ amount: 100 }],
};
vi.mock('react-hook-form', () => ({
  useFormState: () => ({ isValid: true }),
  useWatch: () => [
    completeValues.vendor_id,
    completeValues.invoice_number,
    completeValues.invoice_date,
    completeValues.due_date,
    completeValues.line_items,
  ],
}));

// A complete bill so billSubmitReady passes for the `draft` case.
let status: BillStatusType = 'awaiting_approval';
const form = {
  control: {},
  handleSubmit: (onValid: (v: unknown) => void) => (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    onValid(completeValues);
  },
  getValues: () => completeValues,
};
vi.mock('../context/BillDetail.context', () => ({
  useBillDetail: () => ({
    form,
    bill: { status, ...completeValues } as unknown as BillDetailType,
    editable: false,
    toggleEditable: vi.fn(),
  }),
}));

// Stub the heavy sections + toast to nothing — the footer is what's under test.
vi.mock('./BillDetailsHeader', () => ({ BillDetailsHeader: () => null }));
vi.mock('./BillDetailsTitle', () => ({ BillDetailsTitle: () => null }));
vi.mock('./BillDetailsPane', () => ({
  BillDetailsPane: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('./BillDetailsVendor', () => ({ BillDetailsVendor: () => null }));
vi.mock('./BillDetailsInvoiceInfo', () => ({ BillDetailsInvoiceInfo: () => null }));
vi.mock('./BillDetailsPurchaseOrder', () => ({ BillDetailsPurchaseOrder: () => null }));
vi.mock('./BillDetailsLineItems', () => ({ BillDetailsLineItems: () => null }));
vi.mock('./BillDetailsPayment', () => ({ BillDetailsPayment: () => null }));
vi.mock('./BillDetailsMemo', () => ({ BillDetailsMemo: () => null }));
vi.mock('./BillDetailsApprovals', () => ({ BillDetailsApprovals: () => null }));
vi.mock('./BillDetailsSaveToast', () => ({ BillDetailsSaveToast: () => null }));

// The schedule modal → a marker echoing open + mode, so the footer's open call
// and chosen mode are observable without rendering the real dialog.
vi.mock('./BillDetailsScheduleModal', () => ({
  BillDetailsScheduleModal: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid="schedule-modal" data-mode={mode} /> : null,
}));

// The shared "Complete payment" action → a marker: it owns its own roll flow
// (context + api-client), covered by its own test. Here we only assert the
// footer PLACES it beside a `scheduled` bill's "View schedule".
vi.mock('./BillDetailsCompletePaymentButton', () => ({
  BillDetailsCompletePaymentButton: () => <div data-testid="complete-payment" />,
}));

beforeEach(() => {
  approve.mockReset();
  submit.mockReset();
  status = 'awaiting_approval';
});

describe('BillDetailsForm footer primary', () => {
  it('awaiting_approval: the primary reads "Approve" and fires the approve flow', async () => {
    status = 'awaiting_approval';
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    const button = screen.getByRole('button', { name: /^approve$/i });
    await user.click(button);

    expect(approve).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
  });

  it('approved: the primary opens the schedule modal in schedule mode', async () => {
    status = 'approved';
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    expect(screen.queryByTestId('schedule-modal')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /schedule payment/i }));

    const modal = await screen.findByTestId('schedule-modal');
    expect(modal).toHaveAttribute('data-mode', 'schedule');
  });

  it('scheduled: the primary opens the schedule modal read-only (view mode)', async () => {
    status = 'scheduled';
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    await user.click(screen.getByRole('button', { name: /view schedule/i }));

    const modal = await screen.findByTestId('schedule-modal');
    expect(modal).toHaveAttribute('data-mode', 'view');
  });

  it('scheduled: the shared "Complete payment" action sits beside View schedule', () => {
    status = 'scheduled';
    render(<BillDetailsForm />);

    // The real money-movement action rides in next to the read-only "View
    // schedule" primary — the same shared button the modal uses.
    expect(screen.getByRole('button', { name: /view schedule/i })).toBeInTheDocument();
    expect(screen.getByTestId('complete-payment')).toBeInTheDocument();
  });

  it('approved: shows no "Complete payment" — only the Schedule primary', () => {
    status = 'approved';
    render(<BillDetailsForm />);

    // Complete payment is a `scheduled`-only companion; an approved bill (still
    // to be scheduled) must not offer it.
    expect(screen.queryByTestId('complete-payment')).not.toBeInTheDocument();
  });

  it('draft: the primary reads "Create bill" and rides the form submit', async () => {
    status = 'draft';
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    await user.click(screen.getByRole('button', { name: /create bill/i }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(approve).not.toHaveBeenCalled();
  });

  it('partially_paid: the primary IS the shared "Complete payment" action', () => {
    status = 'partially_paid';
    render(<BillDetailsForm />);

    // No inert generic primary — the shared roll button stands in as the primary.
    expect(screen.getByTestId('complete-payment')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^complete payment$/i })).not.toBeInTheDocument();
    // It's the primary, so there's no `scheduled`-style companion + View pairing.
    expect(screen.queryByRole('button', { name: /view schedule/i })).not.toBeInTheDocument();
  });

  it('paid: the primary reads its label but is inert (disabled, no modal)', () => {
    status = 'paid';
    render(<BillDetailsForm />);

    expect(screen.getByRole('button', { name: /view payment/i })).toBeDisabled();
    expect(screen.queryByTestId('schedule-modal')).not.toBeInTheDocument();
    // Complete payment is not offered on a fully-paid bill.
    expect(screen.queryByTestId('complete-payment')).not.toBeInTheDocument();
  });
});
