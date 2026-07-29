import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { CommandPaletteProvider, useCommandPalette } from '../context/CommandPalette.context';
import { CommandPaletteTrigger } from './CommandPaletteTrigger';

/**
 * The top bar's search affordance. It replaced a real `<input type="search">`
 * that ⌘K focused and that searched nothing, so the tests pin the correction:
 * it is a BUTTON (there is nothing to type into until the palette opens), it
 * still advertises the chord, and pressing it opens the palette.
 *
 * It must also NOT bind ⌘K itself — the host owns that, because the palette has
 * to open from the detail routes, which have no top bar. Two bindings would
 * toggle twice and cancel out.
 */
function Probe() {
  const { open } = useCommandPalette();
  return <output>{open ? 'open' : 'closed'}</output>;
}

function renderTrigger() {
  return render(
    <CommandPaletteProvider>
      <CommandPaletteTrigger />
      <Probe />
    </CommandPaletteProvider>,
  );
}

describe('CommandPaletteTrigger', () => {
  it('is a button, not a field that swallows typing', () => {
    renderTrigger();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('advertises the shortcut it obeys', () => {
    renderTrigger();
    expect(screen.getByText('K')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute(
      'aria-keyshortcuts',
      'Meta+K Control+K',
    );
  });

  it('keeps the frame’s placeholder copy, and takes an override', () => {
    const { rerender } = renderTrigger();
    expect(screen.getByText('Search for anything')).toBeInTheDocument();

    rerender(
      <CommandPaletteProvider>
        <CommandPaletteTrigger placeholder="Search bills, vendors…" />
      </CommandPaletteProvider>,
    );
    expect(screen.getByText('Search bills, vendors…')).toBeInTheDocument();
  });

  it('opens the palette when pressed', async () => {
    const user = userEvent.setup();
    renderTrigger();
    expect(screen.getByRole('status')).toHaveTextContent('closed');

    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('status')).toHaveTextContent('open');
  });

  it('does not bind the chord itself — that is the host’s job', () => {
    renderTrigger();

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true }),
    );

    expect(screen.getByRole('status')).toHaveTextContent('closed');
  });
});
