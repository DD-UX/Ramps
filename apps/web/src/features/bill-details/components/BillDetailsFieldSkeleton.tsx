import { cn } from '@ramps/ui/cn';
import { Skeleton } from '@ramps/ui/Skeleton';

/**
 * The one field-shaped bar every section skeleton is built from: h-12 — the
 * exact outer height of the label-inside-input field components (border +
 * py-rui-2 + the label/value stack), so a section swaps bars for fields
 * without moving anything below it. One bar per field, full width, in the
 * same grid the real fields will occupy.
 *
 * Deliberately NOT a greyed copy of the field's internals (label bar + value
 * bar): per-field labels belong to the field components, and mirroring them
 * here would couple every skeleton to every field — a drift surface far
 * larger than the shift it removes.
 */
export function BillDetailsFieldSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-12 w-full', className)} />;
}
