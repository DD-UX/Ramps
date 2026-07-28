import { describe, expect, it } from 'vitest';

import { getCmdCharacter, isApplePlatform } from './platform.helpers';

/**
 * isApplePlatform is the one decision behind "⌘ or Ctrl?": both the keycap
 * display and the shortcut modifier read it, so it must recognise every Apple
 * platform string (macOS + iOS/iPadOS) and treat everything else — plus the
 * empty/SSR case — as non-Apple.
 */
describe('isApplePlatform', () => {
  it('recognises the macOS platform strings', () => {
    expect(isApplePlatform('MacIntel')).toBe(true);
    expect(isApplePlatform('MacARM')).toBe(true);
    expect(isApplePlatform('Macintosh')).toBe(true);
  });

  it('recognises the iOS / iPadOS platform strings', () => {
    expect(isApplePlatform('iPhone')).toBe(true);
    expect(isApplePlatform('iPad')).toBe(true);
    expect(isApplePlatform('iPod touch')).toBe(true);
  });

  it('treats Windows and Linux as non-Apple', () => {
    expect(isApplePlatform('Win32')).toBe(false);
    expect(isApplePlatform('Windows')).toBe(false);
    expect(isApplePlatform('Linux x86_64')).toBe(false);
  });

  it('treats a missing / empty platform (SSR) as non-Apple', () => {
    expect(isApplePlatform(undefined)).toBe(false);
    expect(isApplePlatform('')).toBe(false);
  });
});

/**
 * getCmdCharacter is the shared spelling of that decision: every shortcut chip
 * renders its output, so the glyphs are pinned here.
 */
describe('getCmdCharacter', () => {
  it('spells ⌘ for Apple and Ctrl for everything else', () => {
    expect(getCmdCharacter(true)).toBe('⌘');
    expect(getCmdCharacter(false)).toBe('Ctrl');
  });
});
