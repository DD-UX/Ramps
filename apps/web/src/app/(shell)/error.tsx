'use client';

import { CommonErrorState } from '@/features/common/components/CommonErrorState';

/**
 * The error boundary for every page inside the app shell (Bill Pay, Vendors,
 * the Design System embed).
 *
 * It sits at the ROUTE-GROUP level on purpose. A boundary catches throws from
 * its children but never from its own layout, so placing it here leaves
 * `(shell)/layout.tsx` — the SideMenu and top bar — mounted and working while
 * only the failed page body is replaced. The user keeps their bearings and can
 * simply navigate elsewhere; a boundary any higher would blank the whole window.
 */
export default function ShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <CommonErrorState error={error} reset={reset} />;
}
