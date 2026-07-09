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
const cancelEdit = vi.fn();
vi.mock('../hooks/useCancelBillEdit', () => ({
  useCancelBillEdit: () => ({ cancelEdit }),
}));

// The roll flow the footer now OWNS (one instance shared with the Complete
// button). Stub it so no router/api-client is needed; its own settle behaviour
// is covered by the roll hook + Complete-button tests.
const roll = vi.fn();
vi.mock('../hooks/useRollPayment', () => ({
  useRollPayment: () => ({ roll, submitting: false, error: null }),
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
// Edit mode is varied per case: the Cancel companion + the "Save bill" label
// only show while editing a submitted bill, and Approve locks then.
let editable = false;
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
    editable,
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

// The shared overflow menu → a marker echoing its `disabled` prop: it derives
// its own items from status and owns its own router/api-client wiring (covered
// by BillsActionsMenu's own test). Here we only assert the footer MOUNTS it and
// passes the mid-edit lock — the panel's own inert behaviour is tested there.
vi.mock('@/features/bills/components/BillsActionsMenu', () => ({
  BillsActionsMenu: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="bill-actions-menu" data-disabled={disabled ? 'true' : 'false'} />
  ),
}));

beforeEach(() => {
  approve.mockReset();
  submit.mockReset();
  cancelEdit.mockReset();
  status = 'awaiting_approval';
  editable = false;
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

  it('rejected: renders NO primary at all (no "Reopen bill" UI)', () => {
    status = 'rejected';
    render(<BillDetailsForm />);

    // There's no reopen flow, so the footer omits the primary entirely rather
    // than showing an inert "Reopen bill" button.
    expect(screen.queryByRole('button', { name: /reopen/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('complete-payment')).not.toBeInTheDocument();
  });

  it('archived: renders NO primary at all (no "Restore bill" UI)', () => {
    status = 'archived';
    render(<BillDetailsForm />);

    // There's no restore flow, so the footer omits the primary entirely rather
    // than showing an inert "Restore bill" button.
    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('complete-payment')).not.toBeInTheDocument();
  });
});

/**
 * The EDIT-MODE companion pair. Editing a submitted-but-still-editable bill
 * (`awaiting_approval`) turns the left slot into [Cancel][Save bill], and locks
 * the Approve primary until the edit is resolved — so Approve never fires over
 * an unsaved form. At rest (not editing) the left slot is the "Edit bill" link
 * and no Cancel shows.
 */
describe('BillDetailsForm footer — edit mode (Cancel / Save bill)', () => {
  it('at rest: shows "Edit bill" with no Cancel, and Approve is enabled', () => {
    status = 'awaiting_approval';
    editable = false;
    render(<BillDetailsForm />);

    expect(screen.getByRole('button', { name: /edit bill/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^cancel$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeEnabled();
  });

  it('editing: pairs Cancel before "Save bill" and locks Approve', () => {
    status = 'awaiting_approval';
    editable = true;
    render(<BillDetailsForm />);

    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save bill/i })).toBeInTheDocument();
    // Approve stays visible but is disabled until the edit is saved or cancelled.
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeDisabled();
  });

  it('editing: Cancel fires the restore-and-exit flow', async () => {
    status = 'awaiting_approval';
    editable = true;
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(cancelEdit).toHaveBeenCalledOnce();
    expect(approve).not.toHaveBeenCalled();
  });

  it('at rest: the overflow kebab is enabled', () => {
    status = 'awaiting_approval';
    editable = false;
    render(<BillDetailsForm />);

    // The side-actions (Archive · Reject) are live while the record is frozen.
    expect(screen.getByTestId('bill-actions-menu')).toHaveAttribute('data-disabled', 'false');
  });

  it('editing: the overflow kebab locks alongside the disabled Approve', () => {
    status = 'awaiting_approval';
    editable = true;
    render(<BillDetailsForm />);

    // Mid-edit the footer passes `disabled` to the kebab — the side-actions can't
    // fire over an unsaved form, mirroring the locked Approve primary.
    expect(screen.getByTestId('bill-actions-menu')).toHaveAttribute('data-disabled', 'true');
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeDisabled();
  });
});

/**
 * The ⌘/Ctrl+↵ shortcut: the chord fires whatever the ACTIVE footer primary
 * does — the same effect a click routes through — gated on the primary being
 * enabled. These prove the wiring per status (create submits, approve approves,
 * schedule opens the modal) and that a disabled/locked primary swallows it.
 */
describe('BillDetailsForm footer — ⌘/Ctrl+↵ shortcut', () => {
  it('draft: the chord submits the form (Create)', async () => {
    status = 'draft';
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    await user.keyboard('{Meta>}{Enter}{/Meta}');

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(approve).not.toHaveBeenCalled();
  });

  it('awaiting_approval: the chord fires the approve flow', async () => {
    status = 'awaiting_approval';
    editable = false;
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    await user.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() => expect(approve).toHaveBeenCalledOnce());
    expect(submit).not.toHaveBeenCalled();
  });

  it('approved: the chord opens the schedule modal', async () => {
    status = 'approved';
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    expect(screen.queryByTestId('schedule-modal')).not.toBeInTheDocument();
    await user.keyboard('{Meta>}{Enter}{/Meta}');

    expect(await screen.findByTestId('schedule-modal')).toHaveAttribute('data-mode', 'schedule');
  });

  it('editing awaiting_approval: the locked Approve swallows the chord', async () => {
    status = 'awaiting_approval';
    editable = true; // Approve is disabled mid-edit — the chord must be inert too.
    const user = userEvent.setup();
    render(<BillDetailsForm />);

    await user.keyboard('{Meta>}{Enter}{/Meta}');

    expect(approve).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });
});
