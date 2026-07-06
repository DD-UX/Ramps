import { describe, expect, it } from 'vitest';

import { cn } from './cn';
import {
  __DISABLED_DECLS,
  __DISABLED_HOVER_RESET,
  DISABLED_CONTROL,
  DISABLED_CONTROL_DATA,
} from './disabled';

/**
 * The disabled treatment must (a) force ONE consistent gray, (b) kill the
 * variant's hover reaction, and (c) read as inert (dim + not-allowed). These
 * tests pin that contract for both selector forms and prove the hover-neutraliser
 * actually wins through `cn` — i.e. a disabled control can no longer light up on
 * hover, which was the whole point.
 */
describe('disabled control treatment', () => {
  it('native form the consistent gray + not-allowed + dim declarations', () => {
    for (const decl of __DISABLED_DECLS.split(' ')) {
      expect(DISABLED_CONTROL).toContain(`disabled:${decl}`);
    }
  });

  it('neutralises hover back to the same gray (no variant hover survives)', () => {
    for (const decl of __DISABLED_HOVER_RESET.split(' ')) {
      expect(DISABLED_CONTROL).toContain(`disabled:hover:${decl}`);
    }
  });

  it('keeps the data-[disabled] twin in lockstep with the native form', () => {
    // Same declarations, just the data-[disabled]: selector instead of disabled:.
    const native = DISABLED_CONTROL.split(' ').map((c) => c.replace(/^disabled:/, ''));
    const data = DISABLED_CONTROL_DATA.split(' ').map((c) => c.replace(/^data-\[disabled\]:/, ''));
    expect(data).toEqual(native);
  });

  it('layers a disabled-scoped hover reset over the variant hover', () => {
    // A primary-ish variant that lights lime on hover, then the shared treatment.
    const out = cn('bg-accent text-ink hover:bg-accent/90', DISABLED_CONTROL);
    // The enabled hover (hover:) and the disabled hover (disabled:hover:) are
    // DIFFERENT variant scopes, so tailwind-merge keeps both — by design. At
    // runtime the disabled element matches :disabled, so the gray reset wins
    // (proven on computed styles by the token-fidelity gate). Here we just pin
    // that the neutraliser is present alongside the base hover.
    expect(out).toContain('hover:bg-accent/90');
    expect(out).toContain('disabled:hover:bg-stone');
    // Resting fill is overridden to the consistent gray while disabled.
    expect(out).toContain('disabled:bg-stone');
  });

  it('drives a real Button base to an inert gray when disabled', () => {
    const buttonBase =
      'font-heading inline-flex rounded-square h-10 gap-2 px-rui-3 text-sm ' +
      'bg-accent text-ink hover:bg-accent/90 cursor-pointer';
    const out = cn(buttonBase, DISABLED_CONTROL);
    expect(out).toContain('disabled:bg-stone');
    expect(out).toContain('disabled:text-hushed');
    expect(out).toContain('disabled:cursor-not-allowed');
    expect(out).toContain('disabled:hover:bg-stone');
    // Enabled affordances remain for the non-disabled state.
    expect(out).toContain('cursor-pointer');
    expect(out).toContain('rounded-square');
  });
});
