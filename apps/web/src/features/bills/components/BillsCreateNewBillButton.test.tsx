import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BillsCreateNewBillButton } from './BillsCreateNewBillButton';

/**
 * BillsCreateNewBillButton is self-contained: it holds its own loading state,
 * calls the SDK's `bills.createDemo()`, and routes into the new bill. These
 * tests prove that WIRING — a click mints a bill and navigates, a failure shows
 * an inline error and re-enables the button, and a double-click can't fire the
 * request twice (the button disables itself the moment it starts).
 *
 * Router + the API client are mocked: a stub push we assert, and a createDemo
 * we resolve/reject per case.
 */
const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

const createDemo = vi.fn();
vi.mock('@/features/common/helpers/api-client.helpers', () => ({
  apiClient: { bills: { createDemo: () => createDemo() } },
}));

describe('BillsCreateNewBillButton', () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    createDemo.mockReset();
  });

  it('creates a bill and routes into its detail page on click', async () => {
    createDemo.mockResolvedValue({ bill: { id: 'b0000000-0000-4000-8000-00000000e999' } });
    const user = userEvent.setup();
    render(<BillsCreateNewBillButton />);

    await user.click(screen.getByRole('button', { name: /create demo bill/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/bills/b0000000-0000-4000-8000-00000000e999');
    });
    expect(refresh).toHaveBeenCalledOnce();
  });

  it('shows an inline error and re-enables the button when creation fails', async () => {
    createDemo.mockRejectedValue(new Error('boom'));
    const user = userEvent.setup();
    render(<BillsCreateNewBillButton />);

    const button = screen.getByRole('button', { name: /create demo bill/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not create a bill/i);
    });
    expect(push).not.toHaveBeenCalled();
    // The button is interactive again so the tester can retry.
    expect(button).not.toBeDisabled();
  });

  it('does not fire a second request while one is in flight', async () => {
    // A never-resolving promise keeps the button in its loading state.
    createDemo.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    render(<BillsCreateNewBillButton />);

    const button = screen.getByRole('button', { name: /create demo bill/i });
    await user.click(button);
    await user.click(button);

    expect(createDemo).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
  });
});
