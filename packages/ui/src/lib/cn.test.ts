import { describe, expect, it } from 'vitest';

import { cn } from './cn';

/**
 * `cn` is the fix for the design system's original flaw: primitives composed
 * classes with raw `clsx`, which only concatenates — so a consumer-passed
 * `className` never actually overrode a variant's base (both survived and CSS
 * source order decided the winner). These tests pin the `tailwind-merge`
 * behaviour that makes overrides real, including this system's bespoke scales.
 * If someone drops `cn` back to `clsx`, the conflict cases below fail loudly.
 */
describe('cn', () => {
  it('lets a later class win a standard conflict (the core bug)', () => {
    // Raw clsx would keep BOTH bg-* classes; twMerge keeps the last.
    expect(cn('bg-accent', 'bg-white')).toBe('bg-white');
    expect(cn('text-hushed', 'text-ink')).toBe('text-ink');
  });

  it('preserves non-conflicting classes while overriding the conflicting one', () => {
    expect(cn('inline-flex items-center bg-ink', 'bg-white')).toBe(
      'inline-flex items-center bg-white',
    );
  });

  it('treats hover/focus variants as their own conflict scope', () => {
    // A plain bg override must not clobber a hover:bg-* (different scope).
    expect(cn('bg-accent hover:bg-accent/90', 'bg-white')).toBe('hover:bg-accent/90 bg-white');
  });

  it('collapses the custom radius group (square vs pill) to the last one', () => {
    // rounded-square / rounded-pill are the system's only two radii; they must
    // conflict so an override actually reshapes the element.
    expect(cn('rounded-square', 'rounded-pill')).toBe('rounded-pill');
    expect(cn('rounded-pill', 'rounded-square')).toBe('rounded-square');
  });

  it('merges the custom rui-* spacing scale on padding/margin/gap', () => {
    // Without registering the rui-* scale, twMerge sees rui-3 as unknown and
    // keeps both — the exact drift we are guarding against.
    expect(cn('px-rui-3', 'px-rui-2')).toBe('px-rui-2');
    expect(cn('py-rui-4', 'py-rui-1')).toBe('py-rui-1');
    expect(cn('gap-2', 'gap-rui-3')).toBe('gap-rui-3');
  });

  it('lets a later shorthand padding subsume an earlier axis one', () => {
    // p-* covers the x-axis too, so a later p-rui-4 correctly overrides an
    // earlier px-rui-2 — and the rui-* scale is understood on both.
    expect(cn('px-rui-2', 'p-rui-4')).toBe('p-rui-4');
    // ...but order matters: an axis override AFTER the shorthand keeps both.
    expect(cn('p-rui-4', 'px-rui-2')).toBe('p-rui-4 px-rui-2');
  });

  it('supports conditional (clsx-style) inputs', () => {
    const off = 0 > 1;
    const on = 1 > 0;
    expect(cn('bg-ink', off && 'bg-white', undefined, 'text-white')).toBe('bg-ink text-white');
    expect(cn('bg-ink', on && 'bg-white')).toBe('bg-white');
    expect(cn(['inline-flex', 'items-center'], { 'bg-accent': on, 'bg-white': off })).toBe(
      'inline-flex items-center bg-accent',
    );
  });

  it('mirrors a real Button override end to end', () => {
    const base =
      'font-heading inline-flex rounded-square h-10 gap-2 px-rui-3 text-sm bg-accent text-ink hover:bg-accent/90';
    // Consumer forces a white, tighter-padded button.
    const out = cn(base, 'bg-white text-ink px-rui-2');
    expect(out).toContain('bg-white');
    expect(out).not.toContain('bg-accent ');
    expect(out).toContain('px-rui-2');
    expect(out).not.toContain('px-rui-3');
    // Non-conflicting layout survives.
    expect(out).toContain('inline-flex');
    expect(out).toContain('rounded-square');
  });
});
