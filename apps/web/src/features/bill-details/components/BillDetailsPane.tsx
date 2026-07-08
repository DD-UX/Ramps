'use client';

import { cn } from '@ramps/ui/cn';
import type { PropsWithChildren } from 'react';

/**
 * The padded, stacked band the bill-detail panes share — the coding form's groups
 * on the left, the document viewer on the right both sit in this exact
 * `px-rui-5 py-rui-4 gap-rui-4 flex flex-col` box. Extracted so the padding rhythm
 * lives in one place instead of being re-spelled per pane (it was defined as a
 * stray `wrapperClassName` string in two files).
 *
 * `className` is merged over the base with the design system's `cn` (twMerge), so
 * a caller can both add utilities and *override* a conflicting one — the document
 * pane passes `h-full` to fill its column, and could re-set the padding if needed
 * without the base and the override both surviving into the output.
 *
 * `children` is required (not the `PropsWithChildren` default of optional): a
 * pane with nothing inside is a mistake, not an empty band. This is an apps/web
 * layout primitive with no story, so it defines its own props inline.
 */
export interface BillDetailsPaneProps extends PropsWithChildren {
  className?: string;
}

export function BillDetailsPane({ children, className }: BillDetailsPaneProps) {
  return (
    <div className={cn('px-rui-5 py-rui-4 gap-rui-4 flex flex-col', className)}>{children}</div>
  );
}
