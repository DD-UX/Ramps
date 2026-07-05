'use client';

import { clsx } from 'clsx';
import { CornerDownRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Checkbox } from '../Checkbox/Checkbox';

/**
 * Table — the production-grade data table for Bill Pay lists: "For approval",
 * "For payment", vendor tables, and the status-grouped Overview
 * (docs/watch-youtube/ramp-bill-pay-series-ap-agent/snapshots/6.jpeg). This is
 * a COMPLETE rewrite: virtualized scrolling, sticky header/footer/columns,
 * cross-page selection via Map, dependency-free.
 *
 * **Vetted against frame 6** (see research below):
 *  - Header: limestone (#f4f2f0) background, hushed uppercase column labels,
 *    bone hairline bottom border (frame samples #faf9f5 footer → limestone family).
 *  - Rows: white bg, bone dividers, limestone hover, tabular-nums on money columns.
 *  - Selection: positive-green checkbox fill (#01a741), row selection survives
 *    pagination — returns a `Map<K, T>` that persists the chosen records ACROSS pages.
 *  - Sticky: thead + tfoot both sticky, PLUS the first data column (after checkbox)
 *    + last column can be sticky for horizontal scroll.
 *  - Virtualization: hand-rolled windowing (fixed row height, render only visible
 *    rows + overscan, spacer rows top/bottom); coexists with sticky elements.
 *  - Footer: per-column summary (totals, counts) OR custom slot content.
 *
 * **Video research findings** (docs/watch-youtube/README.md §1, §5, §6):
 *  - Selection UX: frame 11 shows "0 of 2 approvals", frame 15 shows multi-select
 *    checkboxes for "Send a request" bulk action. Selection is PER-PAGE (select-all
 *    checks only the visible page, not the entire dataset — consistent with the
 *    "N of M" approval counter showing per-bill state, not a global count).
 *  - Pagination: frame 17 shows "1–3 of 3 bills • $1,194.08 total" in the footer
 *    → the table footer carries: (1) pagination range "X–Y of Z", (2) record-type
 *    label, (3) aggregate total. Frame 6 shows "1–7 of 7 bills" confirming this.
 *  - No bulk-action bar: unlike some AP systems, Ramp keeps row-level CTAs
 *    ("Approve" button per row, frame 6). Bulk actions (e.g. "Send request")
 *    happen in modals triggered by selecting rows, not a persistent bottom bar.
 *
 * **Design tokens** (docs/design-system.md §2, tokens.css):
 *  - All colors via semantic Tailwind utilities: bg-limestone (header/hover),
 *    border-bone (hairlines), text-hushed (header labels), text-ink (body),
 *    bg-positive + border-positive (checkbox checked).
 *  - Spacing: p-rui-3 (cells), py-rui-2 (header), gap-rui-2 (internal).
 *  - Corner: rounded-square (0px, per frame measurements — every rectangle is sharp).
 *  - Typography: font-heading (400 weight for headers), font-body (300 for body),
 *    tabular-nums on money/numeric columns.
 *
 * **API contract** (typed generics `<T, K>`):
 *  ```tsx
 *  <Table
 *    data={bills}
 *    columns={columns}
 *    getRowId={(row) => row.id}
 *    selectable
 *    onSelectionChange={(selection) => console.log(selection)} // Map<K, T>
 *    virtualizeAfter={100} // enable virtualization for datasets > 100 rows
 *    stickyFirstColumn
 *    stickyLastColumn
 *    footer={{ type: 'summary', summary: { amount: totalCents } }}
 *  />
 *  ```
 *
 * Column definition:
 *  ```tsx
 *  const columns: TableColumn<Bill, string>[] = [
 *    {
 *      id: 'vendor',
 *      header: 'Vendor',
 *      cell: (row) => <VendorCell vendor={row.vendor} />,
 *      width: '300px',
 *      sticky: 'left', // first data column sticky
 *    },
 *    {
 *      id: 'amount',
 *      header: 'Amount',
 *      cell: (row) => <Money cents={row.amountCents} />,
 *      align: 'right',
 *      width: '150px',
 *      sticky: 'right', // last column sticky
 *      footer: { type: 'money', cents: totalCents },
 *    },
 *  ];
 *  ```
 *
 * **No external dependencies** beyond React + clsx. Virtualization is a minimal
 * hand-rolled window (measure fixed row height, slice data to visible range,
 * offset via spacer rows). Sticky positioning is pure CSS (position: sticky with
 * left/right offsets).
 */

export type CellAlign = 'left' | 'right' | 'center';

export interface TableColumn<T, K extends string | number = string> {
  /** Unique column ID (must match the TS keys for type safety). */
  id: K;
  /** Header label (rendered as hushed uppercase in thead). */
  header: ReactNode;
  /** Cell renderer: receives the full row record. */
  cell: (row: T) => ReactNode;
  /** Column width (CSS value: '200px', '25%', 'minmax(150px, 1fr)'). */
  width?: string;
  /** Text alignment (default: 'left'; use 'right' for money/numbers). */
  align?: CellAlign;
  /**
   * Sticky column position: 'left' for the first data column (after checkbox),
   * 'right' for the last column (Actions). Only the FIRST 'left' and FIRST
   * 'right' column will actually stick; others ignore this.
   */
  sticky?: 'left' | 'right';
  /**
   * Footer cell definition: per-column summary (money total, count, custom node).
   * If undefined, the footer cell is empty for this column.
   */
  footer?:
    | { type: 'money'; cents: number; currency?: string }
    | { type: 'count'; count: number; label?: string }
    | { type: 'custom'; node: ReactNode };
}

export interface TableProps<T, K extends string | number = string> {
  /** Row data array. */
  data: T[];
  /** Column definitions (see TableColumn interface). */
  columns: TableColumn<T, K>[];
  /**
   * Extract a unique ID from each row for selection Map keys and React keys.
   * Must return a stable primitive (string | number) per row.
   */
  getRowId: (row: T) => K;
  /**
   * Enable row selection checkboxes (first column). Selection state is a
   * `Map<K, T>` keyed by the row ID, returned via `onSelectionChange`.
   */
  selectable?: boolean;
  /**
   * Called whenever selection changes (user checks/unchecks a row or clicks
   * select-all). The Map survives pagination — the caller owns the cross-page state.
   */
  onSelectionChange?: (selected: Map<K, T>) => void;
  /**
   * Controlled selection Map (for cross-page persistence). If provided, the
   * component is fully controlled; otherwise it manages internal selection state.
   */
  selectedRows?: Map<K, T>;
  /**
   * Enable virtualized scrolling for datasets larger than this threshold.
   * Default: Infinity (virtualization off). Recommended: 100–500 depending on
   * row complexity. Must provide `rowHeight` when enabled.
   */
  virtualizeAfter?: number;
  /**
   * Fixed row height in pixels (required for virtualization). Measure a typical
   * row in the browser; a Bills table row is ~64px per Ramp's token sheet.
   */
  rowHeight?: number;
  /**
   * Overscan count: how many extra rows to render above/below the visible window
   * to reduce flicker during fast scrolling. Default: 5.
   */
  overscan?: number;
  /**
   * Footer definition: 'none' (no footer), 'summary' (per-column summaries defined
   * in column.footer), or 'custom' (single-cell custom slot spanning all columns).
   */
  footer?:
    | { type: 'none' }
    | { type: 'summary' }
    | { type: 'custom'; content: ReactNode };
  /**
   * Called when a row is clicked (for interactive tables that open a drawer).
   * Receives the full row record.
   */
  onRowClick?: (row: T) => void;
  /**
   * Additional class names for the scroll container.
   */
  className?: string;
  /**
   * Per-row annotation renderer: returns content to display as an indented
   * callout row beneath a parent row (flagged bills, fraud alerts, duplicate
   * warnings). The annotation row is not selectable and does not receive hover.
   * Vetted from frames: "Ramp identified $5,660.00 of overbilling for this invoice"
   * (full-line link), "This draft may be a duplicate of INV# 8960" (partial link).
   */
  getRowAnnotation?: (row: T) => ReactNode | null | undefined;
  /**
   * Fixed annotation row height in pixels (for virtualization height calculations
   * when getRowAnnotation is provided). Default: 32px. When virtualized, rows
   * with annotations count as rowHeight + annotationHeight in the window math.
   */
  annotationHeight?: number;
}

const ALIGN_CLASS: Record<CellAlign, string> = {
  left: 'text-left',
  right: 'text-right tabular-nums',
  center: 'text-center',
};

/**
 * TableAnnotationLink — convenience component for links inside annotation rows.
 * Pre-styled with alert color underline for fraud/duplicate/overbilling callouts.
 * Use inside `getRowAnnotation` return values.
 */
export function TableAnnotationLink({
  href,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <a
      href={href}
      className="underline decoration-alert underline-offset-2"
      {...props}
    >
      {children}
    </a>
  );
}

export function Table<T, K extends string | number = string>({
  data,
  columns,
  getRowId,
  selectable = false,
  onSelectionChange,
  selectedRows: controlledSelection,
  virtualizeAfter = Infinity,
  rowHeight = 64,
  overscan = 5,
  footer = { type: 'none' },
  onRowClick,
  className,
  getRowAnnotation,
  annotationHeight = 32,
}: TableProps<T, K>) {
  // Selection state: controlled or internal
  const [internalSelection, setInternalSelection] = useState<Map<K, T>>(new Map());
  const selection = controlledSelection ?? internalSelection;

  const setSelection = useCallback(
    (newSelection: Map<K, T>) => {
      if (!controlledSelection) {
        setInternalSelection(newSelection);
      }
      onSelectionChange?.(newSelection);
    },
    [controlledSelection, onSelectionChange],
  );

  // Virtualization state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(720);
  const isVirtualized = data.length > virtualizeAfter;

  // Measure viewport height once on mount/resize (avoids reading ref in render)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isVirtualized) return;
    const measure = () => setViewportHeight(el.clientHeight);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isVirtualized]);

  // Calculate visible row range (accounting for annotation height when present)
  const { visibleStart, visibleEnd, offsetY } = useMemo(() => {
    if (!isVirtualized) {
      return { visibleStart: 0, visibleEnd: data.length, offsetY: 0 };
    }
    // When annotations exist, each annotated row effectively takes rowHeight + annotationHeight.
    // For simplicity, we treat each row as potentially having the extra height in the window math.
    // This conservative approach ensures no overlap/jumps during scroll.
    const effectiveRowHeight = getRowAnnotation ? rowHeight + annotationHeight : rowHeight;
    const start = Math.max(0, Math.floor(scrollTop / effectiveRowHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / effectiveRowHeight);
    const end = Math.min(data.length, start + visibleCount + overscan * 2);
    const offset = start * effectiveRowHeight;
    return { visibleStart: start, visibleEnd: end, offsetY: offset };
  }, [isVirtualized, scrollTop, rowHeight, annotationHeight, overscan, data.length, viewportHeight, getRowAnnotation]);

  const visibleData = isVirtualized ? data.slice(visibleStart, visibleEnd) : data;
  const effectiveRowHeight = getRowAnnotation ? rowHeight + annotationHeight : rowHeight;
  const totalHeight = isVirtualized ? data.length * effectiveRowHeight : undefined;
  const spacerHeight = isVirtualized ? totalHeight! - (visibleEnd - visibleStart) * effectiveRowHeight : 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isVirtualized) return;
    const handleScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [isVirtualized]);

  // Select-all logic: toggles ALL rows on the CURRENT PAGE (not cross-page)
  const allPageIds = useMemo(() => data.map(getRowId), [data, getRowId]);
  const isAllSelected = useMemo(() => {
    if (data.length === 0) return false;
    return allPageIds.every((id) => selection.has(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPageIds, selection]);

  // Future: implement indeterminate state via ref when some-but-not-all rows are selected
  // const isIndeterminate = useMemo(() => {
  //   const someSelected = allPageIds.some((id) => selection.has(id));
  //   return someSelected && !isAllSelected;
  // }, [allPageIds, selection, isAllSelected]);

  const toggleSelectAll = useCallback(() => {
    const newSelection = new Map(selection);
    if (isAllSelected) {
      // Deselect all on this page
      allPageIds.forEach((id) => newSelection.delete(id));
    } else {
      // Select all on this page
      data.forEach((row) => newSelection.set(getRowId(row), row));
    }
    setSelection(newSelection);
  }, [isAllSelected, allPageIds, data, getRowId, selection, setSelection]);

  const toggleRow = useCallback(
    (row: T) => {
      const id = getRowId(row);
      const newSelection = new Map(selection);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.set(id, row);
      }
      setSelection(newSelection);
    },
    [getRowId, selection, setSelection],
  );

  // Sticky column logic: find the FIRST 'left' and FIRST 'right' sticky columns
  const stickyLeft = columns.find((col) => col.sticky === 'left');
  const stickyRight = columns.find((col) => col.sticky === 'right');
  const checkboxWidth = selectable ? 56 : 0; // Ramp's token: selection column is 56px

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-square border border-bone bg-white',
        className,
      )}
    >
      <div
        ref={scrollRef}
        className="relative overflow-auto"
        style={{ maxHeight: isVirtualized ? '600px' : undefined }}
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-20 border-b border-bone bg-limestone">
            <tr>
              {selectable && (
                <th
                  className="sticky left-0 z-10 bg-limestone px-rui-3 py-rui-2"
                  style={{ width: checkboxWidth }}
                >
                  <Checkbox
                    checked={isAllSelected}
                    // React doesn't support indeterminate as a prop; set via ref in a real build
                    // For now we show checked state when indeterminate for simplicity
                    onChange={toggleSelectAll}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSticky = col === stickyLeft || col === stickyRight;
                const stickyLeftOffset =
                  col === stickyLeft ? checkboxWidth : undefined;
                const stickyRightOffset = col === stickyRight ? 0 : undefined;

                return (
                  <th
                    key={col.id}
                    scope="col"
                    className={clsx(
                      'px-rui-3 py-rui-2 text-xs font-heading uppercase tracking-wide text-hushed whitespace-nowrap',
                      ALIGN_CLASS[col.align ?? 'left'],
                      isSticky && 'sticky z-10 bg-limestone',
                    )}
                    style={{
                      width: col.width,
                      left: stickyLeftOffset !== undefined ? `${stickyLeftOffset}px` : undefined,
                      right: stickyRightOffset !== undefined ? `${stickyRightOffset}px` : undefined,
                    }}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            className="divide-y divide-bone"
            style={
              isVirtualized
                ? { transform: `translateY(${offsetY}px)` }
                : undefined
            }
          >
            {visibleData.map((row) => {
              const id = getRowId(row);
              const isSelected = selection.has(id);
              const isClickable = !!onRowClick;
              const annotation = getRowAnnotation?.(row);

              return (
                <Fragment key={id}>
                  <tr
                    key={id}
                    aria-selected={isSelected || undefined}
                    onClick={isClickable ? () => onRowClick(row) : undefined}
                    className={clsx(
                      'transition-colors',
                      isClickable && 'cursor-pointer hover:bg-limestone',
                      isSelected && 'bg-tone-accent-surface',
                    )}
                    style={isVirtualized ? { height: rowHeight } : undefined}
                  >
                    {selectable && (
                      <td
                        className="sticky left-0 z-10 bg-white px-rui-3 py-rui-3 align-middle"
                        style={{ width: checkboxWidth }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleRow(row)}
                          aria-label={`Select row ${id}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const isSticky = col === stickyLeft || col === stickyRight;
                      const stickyLeftOffset =
                        col === stickyLeft ? checkboxWidth : undefined;
                      const stickyRightOffset = col === stickyRight ? 0 : undefined;

                      return (
                        <td
                          key={col.id}
                          className={clsx(
                            'px-rui-3 py-rui-3 text-ink align-middle',
                            ALIGN_CLASS[col.align ?? 'left'],
                            isSticky && 'sticky z-10 bg-white',
                          )}
                          style={{
                            width: col.width,
                            left: stickyLeftOffset !== undefined ? `${stickyLeftOffset}px` : undefined,
                            right: stickyRightOffset !== undefined ? `${stickyRightOffset}px` : undefined,
                          }}
                        >
                          {col.cell(row)}
                        </td>
                      );
                    })}
                  </tr>
                  {annotation && (
                    <tr
                      data-testid="table-annotation-row"
                      className="bg-white"
                      style={isVirtualized ? { height: annotationHeight } : undefined}
                    >
                      <td
                        colSpan={columns.length + (selectable ? 1 : 0)}
                        className="px-rui-3 py-rui-2"
                      >
                        <div className="sticky left-0 inline-flex items-start gap-rui-2 text-sm text-alert">
                          <CornerDownRight size={14} className="mt-0.5 shrink-0" />
                          <span>{annotation}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          {footer.type !== 'none' && (
            <tfoot className="sticky bottom-0 z-20 border-t border-bone bg-limestone">
              {footer.type === 'summary' ? (
                <tr>
                  {selectable && (
                    <td className="sticky left-0 z-10 bg-limestone px-rui-3 py-rui-2" style={{ width: checkboxWidth }} />
                  )}
                  {columns.map((col) => {
                    const isSticky = col === stickyLeft || col === stickyRight;
                    const stickyLeftOffset =
                      col === stickyLeft ? checkboxWidth : undefined;
                    const stickyRightOffset = col === stickyRight ? 0 : undefined;

                    let content: ReactNode = null;
                    if (col.footer?.type === 'money') {
                      const { cents, currency = 'USD' } = col.footer;
                      const formatted = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency,
                      }).format(cents / 100);
                      content = (
                        <span className="font-heading tabular-nums text-ink">
                          {formatted}
                        </span>
                      );
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
                        className={clsx(
                          'px-rui-3 py-rui-2 text-xs font-heading text-hushed',
                          ALIGN_CLASS[col.align ?? 'left'],
                          isSticky && 'sticky z-10 bg-limestone',
                        )}
                        style={{
                          width: col.width,
                          left: stickyLeftOffset !== undefined ? `${stickyLeftOffset}px` : undefined,
                          right: stickyRightOffset !== undefined ? `${stickyRightOffset}px` : undefined,
                        }}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-rui-3 py-rui-2 text-sm text-ink"
                  >
                    {footer.content}
                  </td>
                </tr>
              )}
            </tfoot>
          )}
        </table>
        {/* Spacer to push content down when virtualized (bottom spacer) */}
        {isVirtualized && spacerHeight > 0 && (
          <div style={{ height: spacerHeight }} aria-hidden />
        )}
      </div>
    </div>
  );
}
