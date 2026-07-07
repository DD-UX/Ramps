import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CommonTopBarSearch } from './CommonTopBarSearch';

/**
 * CommonTopBarSearch is the app-wide search field: a search input with a
 * ⌘/Ctrl + K hint, focused from anywhere by that chord. These tests pin the
 * accessible field, the shortcut hint, and — the behaviour that matters — that
 * ⌘K focuses the input (and preventDefault stops the browser default).
 */
function pressCommandK() {
  // `cancelable` so preventDefault() actually registers, mirroring a real
  // browser keydown (which is cancelable).
  const event = new KeyboardEvent('keydown', {
    key: 'k',
    metaKey: true,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

describe('CommonTopBarSearch', () => {
  it('renders an accessible search field', () => {
    render(<CommonTopBarSearch />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('shows the K half of the shortcut hint', () => {
    render(<CommonTopBarSearch />);
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('accepts a custom placeholder', () => {
    render(<CommonTopBarSearch placeholder="Search bills, vendors…" />);
    expect(screen.getByPlaceholderText('Search bills, vendors…')).toBeInTheDocument();
  });

  it('focuses the input on ⌘/Ctrl + K', () => {
    render(<CommonTopBarSearch />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(input).not.toHaveFocus();

    pressCommandK();
    expect(input).toHaveFocus();
  });

  it('prevents the browser default for the ⌘/Ctrl + K chord', () => {
    render(<CommonTopBarSearch />);
    const event = pressCommandK();
    expect(event.defaultPrevented).toBe(true);
  });
});
