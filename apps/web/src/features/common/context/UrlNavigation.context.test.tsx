import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UrlNavigationProvider, useUrlNavigation } from './UrlNavigation.context';

/**
 * UrlNavigation is the single seam every URL-state control navigates through, so
 * these tests pin the contract the controls rely on: which router method is
 * called, that the optimistic callback runs BEFORE the push (its whole purpose
 * is to paint ahead of the URL), that pathname/search are handed down so no
 * control needs its own router hooks, and that using the hook without the
 * provider fails loudly instead of silently dropping the feedback.
 *
 * NOT tested here: `isPending`. It is owned by React's `useTransition` and only
 * stays raised while real navigation work is outstanding — with a stubbed router
 * the transition settles in the same tick, so there is no window to assert on.
 * Its effect (the activity rail) is a browser-level behaviour.
 */
const push = vi.fn();
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => '/bills',
  useSearchParams: () => new URLSearchParams('tab=drafts&q=acme'),
}));

/** A minimal consumer that exercises the value the context hands out. */
function Probe({ options }: { options?: { optimistic?: () => void; replace?: boolean } }) {
  const { navigate, pathname, search } = useUrlNavigation();
  return (
    <>
      <span data-testid="pathname">{pathname}</span>
      <span data-testid="search">{search}</span>
      <button type="button" onClick={() => navigate('/bills?tab=history', options)}>
        Go
      </button>
    </>
  );
}

function renderProbe(props: { options?: { optimistic?: () => void; replace?: boolean } } = {}) {
  return render(<Probe {...props} />, { wrapper: UrlNavigationProvider });
}

describe('UrlNavigationProvider', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
  });

  it('exposes the current pathname and query string', () => {
    renderProbe();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/bills');
    expect(screen.getByTestId('search')).toHaveTextContent('tab=drafts&q=acme');
  });

  it('pushes by default — a tab or page change is a real history entry', async () => {
    const user = userEvent.setup();
    renderProbe();
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(push).toHaveBeenCalledExactlyOnceWith('/bills?tab=history');
    expect(replace).not.toHaveBeenCalled();
  });

  it('replaces when asked — so a debounced search keeps the back stack usable', async () => {
    const user = userEvent.setup();
    renderProbe({ options: { replace: true } });
    await user.click(screen.getByRole('button', { name: 'Go' }));
    expect(replace).toHaveBeenCalledExactlyOnceWith('/bills?tab=history');
    expect(push).not.toHaveBeenCalled();
  });

  it('runs the optimistic callback before the navigation, inside the transition', async () => {
    const user = userEvent.setup();
    const order: string[] = [];
    push.mockImplementation(() => order.push('push'));
    renderProbe({ options: { optimistic: () => order.push('optimistic') } });

    await user.click(screen.getByRole('button', { name: 'Go' }));

    // Ordering is the point: a useOptimistic setter that ran after the push
    // would be painting a state the router has already superseded.
    expect(order).toEqual(['optimistic', 'push']);
  });
});

describe('useUrlNavigation', () => {
  it('throws outside a provider rather than degrading to a silent no-op', () => {
    // React logs the boundary-less throw; silence it so the run stays readable.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/UrlNavigationProvider/);
    spy.mockRestore();
  });
});
