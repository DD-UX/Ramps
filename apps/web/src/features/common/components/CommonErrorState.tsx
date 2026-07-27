'use client';

import { Button } from '@ramps/ui/Button';
import { EmptyState } from '@ramps/ui/EmptyState';
import { RotateCcw, TriangleAlert } from '@ramps/ui/icons';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * CommonErrorState — the body every `error.tsx` boundary in the app renders.
 *
 * ## Why this exists at all
 *
 * Without an `error.tsx`, a throw anywhere below a segment unmounts the whole
 * tree and React falls back to the framework's own screen — a blank page in
 * production. That is indistinguishable from "the app hung", which is exactly
 * the impression the loading work is here to remove: a surface that fails
 * silently reads the same as a surface that never finished.
 *
 * ## What makes it a recovery rather than a tombstone
 *
 * `reset()` re-renders the segment that threw, in place. For the failure mode
 * this app actually has — a database read that timed out or lost its connection
 * — that is frequently all it takes, so "Try again" is the PRIMARY action and it
 * costs no navigation. The link out is the fallback for when it isn't: an error
 * screen whose only affordance is the browser's back button is a dead end.
 *
 * The `digest` is surfaced as small print. In production Next strips the real
 * message from the client bundle and leaves only that hash, which is the single
 * token that ties what the user saw to the server log line — worth showing, in
 * a register that doesn't shout.
 */
export interface CommonErrorStateProps {
  /** The thrown error, as Next hands it to a boundary. */
  error: Error & { digest?: string };
  /** Next's re-render-this-segment callback. */
  reset: () => void;
  title?: string;
  description?: string;
  /** Where the escape-hatch link goes when retrying isn't the answer. */
  homeHref?: string;
  homeLabel?: string;
}

export function CommonErrorState({
  error,
  reset,
  title = 'Something went wrong',
  description = "We couldn't load this page. This is usually temporary — trying again often fixes it.",
  homeHref = '/bills',
  homeLabel = 'Go to Bill Pay',
}: CommonErrorStateProps) {
  // The boundary is the last place the error is a live object; after this it
  // only exists as a digest. Logging it keeps the client console useful in
  // development without changing what the user sees.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-white p-rui-6 flex flex-1 items-center justify-center">
      <EmptyState
        icon={<TriangleAlert size={28} />}
        title={title}
        description={
          <>
            {description}
            {error.digest && (
              <>
                {' '}
                <span className="text-xs text-hushed block">Reference: {error.digest}</span>
              </>
            )}
          </>
        }
        action={
          <div className="gap-rui-2 flex items-center">
            <Button variant="primary" leadingIcon={<RotateCcw size={16} />} onClick={reset}>
              Try again
            </Button>
            <Link href={homeHref}>
              <Button variant="secondary">{homeLabel}</Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
