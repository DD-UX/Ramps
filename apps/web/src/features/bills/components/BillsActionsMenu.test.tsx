import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BillsActionsMenu } from './BillsActionsMenu';

/**
 * BillsActionsMenu is the reusable overflow menu shared by the Bill Pay row and
 * the bill-details footer. Its item set is DERIVED from the bill's status via
 * the transition map, so these tests pin that wiring per status: an
 * `awaiting_approval` bill offers Reject + Archive (and firing each calls the
 * matching client method then refreshes), a live non-review bill offers Archive
 * only, and a bill with NO move (`archived`) renders NOTHING at all — no kebab,
 * so only actionable rows carry the affordance.
 *
 * Router + the API client are mocked: a stub `refresh` we assert, and
 * archive/reject spies we resolve per case.
 */
const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

const archive = vi.fn();
const reject = vi.fn();
vi.mock('@/features/common/helpers/api-client.helpers', () => ({
  apiClient: {
    bills: {
      archive: (id: string) => archive(id),
      reject: (id: string) => reject(id),
    },
  },
}));

const BILL_ID = 'b0000000-0000-4000-8000-000000000abc';

describe('BillsActionsMenu', () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    archive.mockReset();
    reject.mockReset();
  });

  it('offers Reject + Archive while awaiting approval', async () => {
    const user = userEvent.setup();
    render(<BillsActionsMenu bill={{ id: BILL_ID, status: 'awaiting_approval' }} />);

    await user.click(screen.getByRole('button', { name: /bill actions/i }));

    expect(screen.getByRole('menuitem', { name: /reject/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /archive/i })).toBeInTheDocument();
  });

  it('rejects the bill and refreshes when Reject is chosen', async () => {
    reject.mockResolvedValue({ bill: { id: BILL_ID } });
    const user = userEvent.setup();
    render(<BillsActionsMenu bill={{ id: BILL_ID, status: 'awaiting_approval' }} />);

    await user.click(screen.getByRole('button', { name: /bill actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /reject/i }));

    await waitFor(() => expect(reject).toHaveBeenCalledWith(BILL_ID));
    expect(archive).not.toHaveBeenCalled();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });

  it('archives the bill and refreshes when Archive is chosen', async () => {
    archive.mockResolvedValue({ bill: { id: BILL_ID } });
    const user = userEvent.setup();
    render(<BillsActionsMenu bill={{ id: BILL_ID, status: 'draft' }} />);

    await user.click(screen.getByRole('button', { name: /bill actions/i }));
    await user.click(screen.getByRole('menuitem', { name: /archive/i }));

    await waitFor(() => expect(archive).toHaveBeenCalledWith(BILL_ID));
    expect(reject).not.toHaveBeenCalled();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });

  it('offers Archive but NOT Reject for a live non-review bill', async () => {
    const user = userEvent.setup();
    render(<BillsActionsMenu bill={{ id: BILL_ID, status: 'approved' }} />);

    await user.click(screen.getByRole('button', { name: /bill actions/i }));

    expect(screen.getByRole('menuitem', { name: /archive/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /reject/i })).not.toBeInTheDocument();
  });

  it('renders nothing at all for a bill with no move (archived)', () => {
    const { container } = render(<BillsActionsMenu bill={{ id: BILL_ID, status: 'archived' }} />);

    // No kebab trigger, no menu — the component collapses to null so only
    // actionable rows carry the affordance.
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('disabled: the kebab is inert and does not open its panel', async () => {
    const user = userEvent.setup();
    render(<BillsActionsMenu bill={{ id: BILL_ID, status: 'awaiting_approval' }} disabled />);

    // The trigger still renders (present-but-unavailable), but it's disabled and
    // a click can't open the menu — the mid-edit lock the footer applies.
    const trigger = screen.getByRole('button', { name: /bill actions/i });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
