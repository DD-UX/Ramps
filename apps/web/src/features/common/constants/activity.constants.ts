import type { ActivityProps } from 'react';

/** The `mode` React 19's `<Activity>` accepts — `'visible' | 'hidden'`, minus `undefined`. */
type ActivityMode = NonNullable<ActivityProps['mode']>;

/**
 * The two modes React 19's `<Activity>` accepts, named so no caller has to spell
 * the raw `'visible'` / `'hidden'` strings inline. `<Activity>` keeps its subtree
 * mounted either way; `HIDDEN` just detaches it from the DOM and tears its effects
 * down (vs. unmounting), so a tab's own state survives being switched away from.
 *
 * Typed against React's own `ActivityProps['mode']` so this list stays in lockstep
 * with the component — if React widens the modes, this fails to compile until it's
 * updated.
 */
export const ACTIVITY_MODE = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
} as const satisfies Record<string, ActivityMode>;
