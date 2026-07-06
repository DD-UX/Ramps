import { cn } from '../../lib/cn';

/**
 * Skeleton — the shimmering placeholder that carries Ramp's optimistic async UX.
 *
 * When you drop invoices, a row appears immediately as "Processing 1 document"
 * with a shimmering skeleton, then hydrates into real data
 * (…/snapshots/04-processing-invoice-skeleton-row.jpeg). This primitive is the
 * shimmer: a bone-tinted block with a subtle pulse. Compose several to mimic the
 * shape of the content being loaded (SkeletonRow helper below).
 *
 * Tokens only; the pulse uses Tailwind's animate-pulse (no custom keyframes).
 */
export interface SkeletonProps {
  className?: string;
  /** Render as a circle (e.g. an avatar placeholder). */
  circle?: boolean;
}

export function Skeleton({ className, circle = false }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'animate-pulse bg-bone block',
        circle ? 'rounded-pill' : 'rounded-square',
        className,
      )}
    />
  );
}

/** A table-row placeholder matching the AP list: avatar + name + amount. */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('gap-rui-3 px-rui-4 py-rui-3 flex items-center', className)}
    >
      <Skeleton circle className="size-8" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
