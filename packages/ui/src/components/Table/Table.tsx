import { clsx } from 'clsx';
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

/**
 * Table — the low-level table primitives that every Bill Pay list is built from:
 * the grouped "Overview" table, "For approval", "For payment", vendor lists
 * (…/snapshots/18-overview-grouped-by-status.jpeg). The kit ships only the styled
 * shells (surface, hairline rows, hushed uppercase headers, hover, right-aligned
 * numeric cells); feature tables (BillsTable, grouping, selection) compose these
 * in apps/web — see the "primitives in kit, compose in app" boundary.
 *
 * Tokens only. Compound API: Table / Table.Head / Table.Body / Table.Row /
 * Table.HeaderCell / Table.Cell.
 */
export type CellAlign = 'left' | 'right' | 'center';

const ALIGN: Record<CellAlign, string> = {
  left: 'text-left',
  right: 'text-right tabular-nums',
  center: 'text-center',
};

function Root({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-square border border-bone bg-white">
      <table className={clsx('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

function Head({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx('border-b border-bone bg-limestone', className)} {...props} />;
}

function Body({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={clsx('divide-y divide-bone', className)} {...props} />;
}

export interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Interactive rows get hover + pointer affordance (used for row → drawer). */
  interactive?: boolean;
  selected?: boolean;
}

function Row({ interactive, selected, className, ...props }: RowProps) {
  return (
    <tr
      aria-selected={selected || undefined}
      className={clsx(
        'transition-colors',
        interactive && 'cursor-pointer hover:bg-limestone',
        selected && 'bg-tone-accent-surface',
        className,
      )}
      {...props}
    />
  );
}

export interface HeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: CellAlign;
}

function HeaderCell({ align = 'left', className, ...props }: HeaderCellProps) {
  return (
    <th
      scope="col"
      className={clsx(
        'px-rui-3 py-rui-2 text-xs font-heading uppercase tracking-wide text-hushed whitespace-nowrap',
        ALIGN[align],
        className,
      )}
      {...props}
    />
  );
}

export interface CellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: CellAlign;
}

function Cell({ align = 'left', className, ...props }: CellProps) {
  return (
    <td className={clsx('px-rui-3 py-rui-3 text-ink align-middle', ALIGN[align], className)} {...props} />
  );
}

export const Table = Object.assign(Root, {
  Head,
  Body,
  Row,
  HeaderCell,
  Cell,
});
