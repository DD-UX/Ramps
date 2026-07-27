import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NAV_SECTIONS, NAV_UNIMPLEMENTED_HINT } from '../constants/nav.constants';
import { CommonSideMenu } from './CommonSideMenu';

/**
 * CommonSideMenu is the render layer over NAV_SECTIONS. The DATA and the
 * active/uniqueness LOGIC are unit-tested in nav.helpers.test; here we prove the
 * WIRING — and specifically the SCOPE contract the nav now carries:
 *
 *  - a BUILT destination renders as a link to its href;
 *  - an UNBUILT one renders inert (a disabled button, never a link) with the
 *    hint that explains why, so the sidebar shows the product's shape without
 *    advertising pages that don't exist;
 *  - the active highlight tracks the route, and only one item wins it.
 *
 * usePathname is mocked (no App Router provider under vitest); we point it at
 * /bills and assert Bill Pay — and only Bill Pay — is current.
 */
vi.mock('next/navigation', () => ({
  usePathname: () => '/bills',
}));

const builtItems = NAV_SECTIONS.flat().filter((item) => !item.disabled);
const unbuiltItems = NAV_SECTIONS.flat().filter((item) => item.disabled);

describe('CommonSideMenu', () => {
  it('renders every implemented nav item as a link to its href', () => {
    render(<CommonSideMenu />);
    for (const item of builtItems) {
      const link = screen.getByRole('link', { name: new RegExp(item.label, 'i') });
      expect(link).toHaveAttribute('href', item.href);
    }
  });

  it('renders unimplemented destinations inert — visible, but not links', () => {
    render(<CommonSideMenu />);
    expect(unbuiltItems.length, 'the IA still carries the unbuilt surfaces').toBeGreaterThan(0);
    for (const item of unbuiltItems) {
      const label = new RegExp(item.label, 'i');
      expect(screen.queryByRole('link', { name: label }), `${item.label} is not a link`).toBeNull();
      const control = screen.getByRole('button', { name: label });
      expect(control, `${item.label} is marked disabled`).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('explains why an unimplemented destination is inert', () => {
    render(<CommonSideMenu />);
    expect(screen.getAllByRole('tooltip')).toHaveLength(unbuiltItems.length);
    expect(screen.getAllByRole('tooltip')[0]).toHaveTextContent(NAV_UNIMPLEMENTED_HINT);
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
