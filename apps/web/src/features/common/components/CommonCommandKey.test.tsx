import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommonCommandKey } from './CommonCommandKey';

/**
 * CommonCommandKey spells the "command" modifier for the current OS: `⌘` on
 * Apple, `Ctrl` elsewhere. It's hydration-safe — the first render is always the
 * non-Apple `Ctrl` (matching SSR, which has no `navigator`), then a mount effect
 * corrects to `⌘` on a Mac. These tests stub `navigator.platform` and assert the
 * post-mount glyph, the accessible label, and the `asChild` bare-text mode.
 */
function stubPlatform(value: string) {
  vi.stubGlobal('navigator', { ...navigator, platform: value, userAgent: '' });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CommonCommandKey', () => {
  it('shows ⌘ on an Apple platform', () => {
    stubPlatform('MacIntel');
    render(<CommonCommandKey />);
    expect(screen.getByText('⌘')).toBeInTheDocument();
  });

  it('shows Ctrl on a non-Apple platform', () => {
    stubPlatform('Win32');
    render(<CommonCommandKey />);
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
  });

  it('labels the glyph for assistive tech (Command / Control)', () => {
    stubPlatform('MacIntel');
    render(<CommonCommandKey />);
    expect(screen.getByLabelText('Command')).toBeInTheDocument();
  });

  it('wraps the glyph in a Kbd keycap by default', () => {
    stubPlatform('Win32');
    const { container } = render(<CommonCommandKey />);
    expect(container.querySelector('kbd')).toBeInTheDocument();
  });

  it('renders bare text (no keycap) with asChild', () => {
    stubPlatform('Win32');
    const { container } = render(<CommonCommandKey asChild />);
    expect(container.querySelector('kbd')).not.toBeInTheDocument();
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
  });
});
