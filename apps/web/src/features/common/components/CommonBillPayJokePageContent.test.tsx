import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommonBillPayJokePageContent } from './CommonBillPayJokePageContent';

/**
 * The joke placeholder every non-/bills route shows. Its only behaviour is the
 * "Go to Bill Pay" button, which routes to /bills — so we mock the App Router
 * (no provider under vitest) and assert the copy renders and the button pushes.
 */
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

describe('CommonBillPayJokePageContent', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('renders the heading, sub-heading, and CTA', () => {
    render(<CommonBillPayJokePageContent />);
    expect(
      screen.getByRole('heading', { name: 'Are you looking for Bill Pay?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Sure you are 😉')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to bill pay/i })).toBeInTheDocument();
  });

  it('routes to /bills when the CTA is clicked', async () => {
    const user = userEvent.setup();
    render(<CommonBillPayJokePageContent />);
    await user.click(screen.getByRole('button', { name: /go to bill pay/i }));
    expect(push).toHaveBeenCalledExactlyOnceWith('/bills');
  });
});
