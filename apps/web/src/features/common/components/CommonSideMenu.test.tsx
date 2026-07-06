import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NAV_SECTIONS } from '../constants/nav.constants';
import { CommonSideMenu } from './CommonSideMenu';

/**
 * CommonSideMenu is the render layer over NAV_SECTIONS: every nav row becomes a
 * link, the row whose href matches the route gets aria-current="page", and the
 * footer links to the design system. The DATA and the active/uniqueness LOGIC
 * are unit-tested in nav.helpers.test; here we prove the WIRING — the catalog
 * renders as links and the active highlight tracks the mocked pathname.
 *
 * usePathname is mocked (no App Router provider under vitest); we point it at
 * /bills and assert Bill Pay — and only Bill Pay — is current.
 */
vi.mock('next/navigation', () => ({
  usePathname: () => '/bills',
}));

describe('CommonSideMenu', () => {
  it('renders every nav item as a link to its href', () => {
    render(<CommonSideMenu />);
    for (const item of NAV_SECTIONS.flat()) {
      const link = screen.getByRole('link', { name: new RegExp(item.label, 'i') });
      expect(link).toHaveAttribute('href', item.href);
    }
  });

  it('marks the item matching the route as current — and only it', () => {
    render(<CommonSideMenu />);
    const current = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('href', '/bills');
    expect(current[0]).toHaveTextContent(/bill pay/i);
  });

  it('links the footer action to the design system', () => {
    render(<CommonSideMenu />);
    expect(screen.getByRole('link', { name: /design system/i })).toHaveAttribute(
      'href',
      '/design-system',
    );
  });

  it('exposes the nav landmark for assistive tech', () => {
    render(<CommonSideMenu />);
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });
});
