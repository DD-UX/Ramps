'use client';

import { CommonErrorState } from '@/features/common/components/CommonErrorState';

/**
 * The error boundary for the detail views (a single bill, and whatever entity
 * details follow).
 *
 * Detail routes deliberately drop the shell chrome, so a failure here leaves the
 * user with NO navigation at all — which makes the escape hatch load-bearing
 * rather than decorative. The copy is scoped to the record, and "Back to Bill
 * Pay" is the way out, mirroring the `not-found.tsx` beside it: the same two
 * failure shapes (this record is broken / this record isn't there) resolve to
 * the same destination.
 */
export default function DetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <CommonErrorState
      error={error}
      reset={reset}
      title="This bill couldn't be loaded"
      description="Something went wrong fetching the record. This is usually temporary — trying again often fixes it."
      homeHref="/bills"
      homeLabel="Back to Bill Pay"
    />
  );
}
