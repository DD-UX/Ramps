import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BillsToolbar } from './BillsToolbar';

/**
 * BillsToolbar's one live control is the search box: keystrokes debounce a
 * `?q=` onto the URL (via router.replace), preserving every other param. The
 * URL math (buildSearchQuery) is unit-tested; here we prove the WIRING — the
 * field seeds from initialSearch, the debounce fires ONCE after the pause, the
 * committed URL keeps the active ?tab=, clearing drops ?q=, and the mock
 * buttons stay disabled (honest "not yet", not dead buttons dressed as live).
 *
 * We run on REAL timers and `waitFor` the debounced navigation rather than
 * faking timers — userEvent + fake timers + jsdom deadlock on the async event
 * loop, and the 300ms window is cheap to just wait out.
 *
 * Router hooks are mocked: a stub replace we assert, a fixed pathname, and a
 * searchParams seeded with tab=drafts so we can prove it survives.
 */
const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/bills',
  useSearchParams: () => new URLSearchParams('tab=drafts'),
}));

describe('BillsToolbar', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('seeds the field from initialSearch', () => {
    render(<BillsToolbar initialSearch="acme" />);
    expect(screen.getByRole('searchbox', { name: /search bills/i })).toHaveValue('acme');
  });

  it('debounces a single ?q= commit that preserves ?tab=', async () => {
    const user = userEvent.setup();
    render(<BillsToolbar initialSearch={null} />);

    await user.type(screen.getByRole('searchbox', { name: /search bills/i }), 'acme');

    // The debounced navigation lands once the user pauses.
    await waitFor(() => {
      expect(replace).toHaveBeenCalledExactlyOnceWith('/bills?tab=drafts&q=acme');
    });
  });

  it('drops ?q= (keeping ?tab=) when the field is cleared', async () => {
    const user = userEvent.setup();
    render(<BillsToolbar initialSearch="acme" />);

    await user.clear(screen.getByRole('searchbox', { name: /search bills/i }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledExactlyOnceWith('/bills?tab=drafts');
    });
  });

  it('keeps the mock controls disabled (honest placeholders)', () => {
    render(<BillsToolbar initialSearch={null} />);
    for (const name of [/filter by date/i, /status/i, /filter columns/i, /export/i, /options/i]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });
});
