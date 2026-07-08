'use client';

import { useSyncExternalStore } from 'react';

import { detectApplePlatform } from '../helpers/platform.helpers';

/**
 * The platform never changes at runtime, so `subscribe` never fires — it just
 * returns a no-op unsubscribe and useSyncExternalStore only ever re-reads the
 * snapshot.
 */
const subscribeToPlatform = () => () => {};

/**
 * useIsApplePlatform — "is this an Apple keyboard?", read hydration-safely.
 * The ONE decision behind every ⌘-vs-Ctrl spelling in the app: the top bar's
 * search keycap ({@link CommonCommandKey}) and the bill form's ⌘/Ctrl+↵ submit
 * chips both hang off this hook, so the OS is detected in exactly one place.
 *
 * Hydration-safe via useSyncExternalStore: the server snapshot is always
 * `false` (SSR has no `navigator`), so SSR and the first client render agree —
 * no markup mismatch — and React swaps to the real `navigator` answer right
 * after hydration (`Ctrl` first paint everywhere, corrected to `⌘` on a Mac).
 */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(subscribeToPlatform, detectApplePlatform, () => false);
}
