/**
 * Platform helpers — the one place that decides "is this an Apple keyboard?".
 *
 * Both the ⌘/Ctrl display (CommonCommandKey) and the ⌘/Ctrl+key shortcut
 * (useCommandPlusKey) need the same answer, so the detection lives here once
 * rather than being re-derived (and drifting) in each spot.
 *
 * The check is a pure function of a UA/platform string so it's unit-testable
 * without a browser; the hook/component pass `navigator.platform` (falling back
 * to `navigator.userAgent`) at call time. `navigator.platform` is technically
 * deprecated but remains the most reliable Mac/iPad signal across browsers, and
 * we only use it to pick a glyph and a modifier key — never for anything
 * security-sensitive.
 */

/** Matches the Apple-hardware platform strings: macOS + iPad/iPhone (⌘ key). */
const APPLE_PLATFORM = /mac|iphone|ipad|ipod/i;

/**
 * Whether the given platform/UA string describes an Apple device (so ⌘ is the
 * command modifier). Pass `navigator.platform` (preferred) or, if empty,
 * `navigator.userAgent`. A missing/empty string is treated as non-Apple, which
 * is also the safe SSR default (no `navigator` on the server).
 */
export function isApplePlatform(platform: string | undefined): boolean {
  return platform ? APPLE_PLATFORM.test(platform) : false;
}

/**
 * Read the current runtime's platform via `navigator`, defaulting to `false`
 * when there's no `navigator` (server render). Prefer `platform`, fall back to
 * `userAgent` for the browsers that have blanked `platform`.
 */
export function detectApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isApplePlatform(navigator.platform || navigator.userAgent);
}
