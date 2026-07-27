'use client';

import { ProgressBar } from '@ramps/ui/ProgressBar';

import { useUrlNavigation } from '../context/UrlNavigation.context';

/**
 * CommonUrlNavigationProgress — the activity rail for the shared URL-state
 * transition, bound to {@link useUrlNavigation}.
 *
 * Placed between the filter strip and the table so it spans the full content
 * width: the sweep then reads as "this whole region is refreshing", which is
 * the truth — a tab switch re-queries the entire list — rather than pinning
 * blame on the one control that was clicked.
 *
 * The rows underneath are left alone on purpose. They are the user's context
 * and they are still accurate until the moment the new payload commits; dimming
 * or skeletonising them would throw that away to say something the rail already
 * says. `ProgressBar` owns the anti-flash timing, so a fast query shows nothing.
 */
export function CommonUrlNavigationProgress() {
  const { isPending } = useUrlNavigation();
  return <ProgressBar active={isPending} label="Loading results" />;
}
