import { ChevronDown } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { cn } from '../../lib/cn';
import { Menu } from '../Menu/Menu';
import type { CellAlign, TableColumn } from './Table';

/**
 * Table footers — the three footer kinds pulled out of Table.tsx so the giant
 * component reads as "head / body / footer" instead of a 180-line inline switch.
 *
 * Two shapes:
 *  - The PAGINATION band is a real `<div>` (NOT a <tfoot>). A sticky <tfoot>'s
 *    containing block is the <table>, so it can only travel to the table's own
 *    bottom edge — on a tall viewport with few rows it sits glued under the last
 *    row, NOT at the page floor. The band is therefore a flex sibling of the
 *    scroll region (after a flex-1 filler), so `sticky bottom:0` pins it to the
 *    SCROLL CONTAINER's floor with the whitespace above it. It's full-width, so
 *    it needs no per-column geometry.
 *  - SUMMARY and CUSTOM stay as real <tfoot> rows: they belong directly under
 *    the body (per-column totals line up under their columns), so they ride with
 *    the table and share the sticky-column geometry via `stickyStyle`.
 *
 * The structure-fidelity HARD gate pins the pagination band to the `<div>`
 * (`[data-table-footer="pagination"]`, sticky bottom:0, canvas band, the
 * `role="button"` Select/range triggers) and the summary totals to `tfoot`.
 */

const ALIGN_CLASS: Record<CellAlign, string> = {
  left: 'text-left',
  right: 'text-right tabular-nums',
  center: 'text-center',
};

/**
 * The fixed height of EVERY table footer band — 48px (h-12), vetted on the
 * pagination band (ap-agent/6). Shared by the pagination <div> band AND the
 * summary/custom <tfoot> (Table applies it there) so any table footer, now or
 * in the future, is the same height. Change it here and both move together.
 */
export const TABLE_FOOTER_HEIGHT = 'h-12';

/**
 * Geometry the footers share with the head/body: which column is the sticky
 * left / right one and how wide the checkbox gutter is. Computed once in Table
 * and threaded down so the footer cells line up under the pinned columns.
 */
export interface TableFooterGeometry<T, K extends string | number> {
  columns: TableColumn<T, K>[];
  selectable: boolean;
  stickyLeft: TableColumn<T, K> | undefined;
  stickyRight: TableColumn<T, K> | undefined;
  checkboxWidth: number;
  checkboxCellStyle: CSSProperties;
  /** Pin the selection column left (mirrors the head/body cells). */
  stickyCheckboxes: boolean;
}

/** left/right sticky offset style for a footer cell (mirrors head/body cells). */
function stickyStyle<T, K extends string | number>(
  col: TableColumn<T, K>,
  { stickyLeft, stickyRight, checkboxWidth }: TableFooterGeometry<T, K>,
): CSSProperties {
  const isLeft = col === stickyLeft;
  const isRight = col === stickyRight;
  return {
    width: col.width,
    left: isLeft ? `${checkboxWidth}px` : undefined,
    right: isRight ? '0' : undefined,
  };
}

/** The colspan a full-width footer row needs to cover data + checkbox columns. */
function fullColSpan<T, K extends string | number>({
  columns,
  selectable,
}: TableFooterGeometry<T, K>): number {
  return columns.length + (selectable ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Pagination band — the product's real table footer.
// ---------------------------------------------------------------------------

export interface TablePaginationFooterProps {
  /** Current page, 1-based. */
  page: number;
  pageSize: number;
  totalCount: number;
  noun?: string;
  totalCents?: number;
  currency?: string;
  extra?: string;
  onPageChange?: (page: number) => void;
  /** Selection-scope actions wired to the parent's selection Map. */
  onSelectPage: () => void;
  onClearSelection: () => void;
  selectionSize: number;
  /** Extra classes for the band (Table passes the sticky-bottom + bg). */
  className?: string;
}

/**
 * The vetted pagination band: "Select ⌄" on the left (hushed underline + a
 * chevron that is NOT underlined), the clickable range + "of N {noun} · $TOTAL
 * total" on the right, on a single canvas band under a limestone hairline.
 *
 * Rendered as a `<div>` (NOT a <tfoot>) so Table can pin it to the SCROLL
 * container's floor — below the flex-1 filler whitespace — rather than the
 * table's own bottom edge, which is all a sticky <tfoot> can reach. Menus open
 * UPWARD (side="top") because the band is sticky-bottom.
 */
export function TablePaginationFooter({
  page,
  pageSize,
  totalCount,
  noun = 'bills',
  totalCents,
  currency = 'USD',
  extra,
  onPageChange,
  onSelectPage,
  onClearSelection,
  selectionSize,
  className,
}: TablePaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);
  const formattedTotal =
    totalCents !== undefined
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(totalCents / 100)
      : undefined;

  return (
    <div
      data-table-footer="pagination"
      // Fixed 48px band (TABLE_FOOTER_HEIGHT) — the vetted footer band height
      // shared with the summary/custom <tfoot>, so every table footer is the
      // same size. flex + items-center vertically centers the row inside it
      // (h-12 owns the height; horizontal px-rui-3 only, no vertical padding).
      className={cn(
        TABLE_FOOTER_HEIGHT,
        'border-limestone px-rui-3 flex items-center border-t',
        className,
      )}
    >
      <div className="gap-rui-4 text-sm text-hushed flex w-full items-center justify-between">
        {/* Left — "Select ⌄": hushed underlined text + a chevron that is NOT
            underlined (8x zoom, frame 6). The menu contents are INFERRED
            (never shown open in a frame): selection scopes on the Map. */}
        <Menu
          side="top"
          align="start"
          label="Selection options"
          trigger={
            <span className="gap-rui-1 text-sm text-hushed inline-flex items-center">
              <span className="decoration-hushed underline underline-offset-2">Select</span>
              <ChevronDown size={14} strokeWidth={1.5} aria-hidden />
            </span>
          }
          items={[
            { label: 'Select all on this page', onSelect: onSelectPage },
            {
              label: 'Clear selection',
              onSelect: onClearSelection,
              disabled: selectionSize === 0,
            },
          ]}
        />
        {/* Right — the range numbers are the ONLY underlined part ("1–7"
            underlined, " of 7 bills · $… total" plain, all one hushed gray —
            8x zoom, frame 6). Clicking opens the (inferred) page picker. */}
        <div className="gap-rui-1 flex items-center whitespace-nowrap">
          <Menu
            side="top"
            align="end"
            label="Go to page"
            trigger={
              <span className="text-sm text-hushed decoration-hushed tabular-nums underline underline-offset-2">
                {rangeStart}–{rangeEnd}
              </span>
            }
            items={Array.from({ length: totalPages }, (_, i) => {
              const p = i + 1;
              const s = totalCount === 0 ? 0 : i * pageSize + 1;
              const e = Math.min(p * pageSize, totalCount);
              return {
                label: `${s}–${e}`,
                disabled: p === page,
                onSelect: () => onPageChange?.(p),
              };
            })}
          />
          <span>
            {' '}
            of {totalCount} {noun}
            {formattedTotal !== undefined && (
              <>
                {' '}
                · <span className="tabular-nums">{formattedTotal}</span> total
              </>
            )}
            {extra}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary — per-column totals / counts / custom nodes.
// ---------------------------------------------------------------------------

export interface TableSummaryFooterProps<T, K extends string | number> {
  geometry: TableFooterGeometry<T, K>;
}

/**
 * Per-column summary row: each column's `footer` def renders a money total, a
 * count, or a custom node in its own cell, honoring the sticky-column pins and
 * alignment so the numbers line up with the body above them.
 */
export function TableSummaryFooter<T, K extends string | number>({
  geometry,
}: TableSummaryFooterProps<T, K>) {
  const { columns, selectable, stickyLeft, stickyRight, checkboxCellStyle, stickyCheckboxes } =
    geometry;

  return (
    <tr>
      {selectable && (
        <td
          className={cn(
            'border-limestone bg-white px-rui-3 py-rui-2 border-t align-middle',
            stickyCheckboxes && 'left-0 sticky z-10',
          )}
          style={checkboxCellStyle}
        />
      )}
      {columns.map((col) => {
        const isSticky = col === stickyLeft || col === stickyRight;

        let content: ReactNode = null;
        if (col.footer?.type === 'money') {
          const { cents, currency = 'USD' } = col.footer;
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
          }).format(cents / 100);
          content = <span className="font-heading text-ink tabular-nums">{formatted}</span>;
        } else if (col.footer?.type === 'count') {
          const { count, label = 'items' } = col.footer;
          content = (
            <span className="font-heading text-ink">
              {count} {label}
            </span>
          );
        } else if (col.footer?.type === 'custom') {
          content = col.footer.node;
        }

        return (
          <td
            key={col.id}
            className={cn(
              'border-limestone px-rui-3 py-rui-2 text-xs font-heading text-hushed border-t align-middle',
              'border-l first:border-l-0',
              ALIGN_CLASS[col.align ?? 'left'],
              isSticky && 'bg-white sticky z-10',
            )}
            style={stickyStyle(col, geometry)}
          >
            {content}
          </td>
        );
      })}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Custom — a single spanning cell for caller-supplied content.
// ---------------------------------------------------------------------------

export interface TableCustomFooterProps<T, K extends string | number> {
  geometry: TableFooterGeometry<T, K>;
  content: ReactNode;
}

/** A single full-width footer cell for arbitrary caller content. */
export function TableCustomFooter<T, K extends string | number>({
  geometry,
  content,
}: TableCustomFooterProps<T, K>) {
  return (
    <tr>
      <td
        colSpan={fullColSpan(geometry)}
        className="border-limestone px-rui-3 py-rui-2 text-sm text-ink border-t align-middle"
      >
        {content}
      </td>
    </tr>
  );
}
