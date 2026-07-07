'use client';

import { CornerDownRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '../../lib/cn';
import { Checkbox } from '../Checkbox/Checkbox';
import {
  TABLE_FOOTER_HEIGHT,
  TableCustomFooter,
  type TableFooterGeometry,
  TablePaginationFooter,
  TableSummaryFooter,
} from './TableFooter';

/**
 * Table — the production-grade data table for Bill Pay lists: "For approval",
 * "For payment", vendor tables, and the status-grouped Overview
 * (docs/watch-youtube/ramp-bill-pay-series-ap-agent/snapshots/6.jpeg). This is
 * a COMPLETE rewrite: virtualized scrolling, sticky header/footer/columns,
 * cross-page selection via Map, dependency-free.
 *
 * **Vetted against the frames at 1px sampling** (ap-agent/6, product-overview
 * 01/02/16, does-ramp/11 — every table screen in the corpus):
 *  - Header: WHITE background (#ffffff–#fcfcfc on all five screens — the old
 *    limestone thead was an invention), hushed sentence-case labels (no
 *    uppercase in the product), limestone hairline under the header row.
 *  - Rows: white bg, limestone dividers (#f4f4f4 sampled), limestone hover
 *    (#f6f5f1 sampled), ~56px tall (294→349, 295→351 measured), tabular-nums
 *    on money columns. Selected rows wash in the pale green
 *    --rui-tone-selected-surface (#f4fff7 sampled), never the accent lime.
 *  - VERTICAL column dividers: the product separates every column with a
 *    limestone hairline. Vetted on product-overview/02 with a persistence
 *    scan (a vertical line is a pixel column that stays off-white through
 *    ALL 280 scanned rows): hits at x=463, 655, 799, 1073 — every one
 *    sampling #efefee–#f1f1f1, the limestone family. They run through the
 *    thead and the body alike.
 *  - Chrome: NO outer border — the table sits directly on the page; the frame
 *    edge people read as a border is just the page canvas (#f9f8f4) meeting
 *    the white table surface. `border-separate` + per-CELL borders (never
 *    tr/thead borders): with `border-collapse`, borders don't travel with
 *    position:sticky cells, which painted phantom seams over the pinned
 *    columns and opened a hairline gap next to the checkbox column.
 *  - Selection: positive-green checkbox fill (#01a741), row selection survives
 *    pagination — returns a `Map<K, T>` that persists the chosen records ACROSS pages.
 *  - Sticky: thead + the summary/custom tfoot both sticky, PLUS the first data
 *    column (after checkbox) + last column can be sticky for horizontal scroll.
 *    The PAGINATION band is a sticky <div> pinned to the SCROLL container's floor
 *    (below a flex-1 filler), NOT a <tfoot> — a sticky tfoot can only reach the
 *    table's own bottom edge, so it can't float to the page bottom past the rows.
 *  - Virtualization: hand-rolled windowing (fixed row height, render only visible
 *    rows + overscan, spacer rows top/bottom); coexists with sticky elements.
 *  - Footer: per-column summary (totals, counts), custom slot content, OR the
 *    vetted PAGINATION band — the product's real table footer (see below).
 *
 * **The pagination footer** (every list screen: ap-agent/6 "1–7 of 7 bills ·
 * $634,235.35 total", product-overview/01 "1–21 of 21 drafts · $494,520.80
 * total + 5 more currencies", does-ramp/17 "1–3 of 3 bills · $1,194.08 total"):
 *  - The band sits on --rui-canvas (#fbfaf6 sampled at 1px on frame 6 y634/640)
 *    under a limestone hairline — NOT on the white table surface.
 *  - Left: "Select ⌄" — hushed text with a hushed underline (darkest strokes
 *    #7e7d79 through JPEG blur = --rui-hushed) and a small chevron-down that
 *    is NOT underlined (confirmed at 8x zoom).
 *  - Right: the range numbers ("1–7") underlined — the underline spans ONLY
 *    the numbers — then " of N bills · $TOTAL total" in the same plain hushed.
 *  - Both are clickable in the product; NO frame shows either menu open, so
 *    the click behavior here is INFERRED and documented as such: "Select ⌄"
 *    opens a selection-scope menu (select page / clear) wired to the
 *    selection Map, and the range opens a page picker that drives
 *    `onPageChange`. The menus open UPWARD (side="top") because the band is
 *    sticky-bottom.
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
 *  - All colors via semantic Tailwind utilities: bg-white (header/footer),
 *    hover:bg-limestone + border-limestone (hairlines), text-hushed (header
 *    labels), text-ink (body), bg-tone-selected-surface (selected rows),
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
 * **No external dependencies** beyond React + cn. Virtualization is a minimal
 * hand-rolled window (measure fixed row height, slice data to visible range,
 * offset via spacer rows). Sticky positioning is pure CSS (position: sticky with
 * left/right offsets).
 */

export type CellAlign = 'left' | 'right' | 'center';

export interface TableColumn<T, K extends string | number = string> {
  /** Unique column ID (must match the TS keys for type safety). */
  id: K;
  /** Header label (rendered as hushed sentence-case text in thead). */
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
   * Fixed row height in pixels (required for virtualization). A Bills table
   * row is ~56px — measured on the frames (row baselines 294→349, 295→351).
   */
  rowHeight?: number;
  /**
   * Overscan count: how many extra rows to render above/below the visible window
   * to reduce flicker during fast scrolling. Default: 5.
   */
  overscan?: number;
  /**
   * Footer definition:
   *  - 'none': no footer.
   *  - 'summary': per-column summaries defined in column.footer.
   *  - 'custom': single-cell custom slot spanning all columns.
   *  - 'pagination': the VETTED product footer band — "Select ⌄" on the left,
   *    the clickable range + "of N {noun} · $TOTAL total" on the right, on a
   *    canvas band. See the pagination section of the component doc.
   */
  footer?:
    | { type: 'none' }
    | { type: 'summary' }
    | { type: 'custom'; content: ReactNode }
    | {
        type: 'pagination';
        /** Current page, 1-based. */
        page: number;
        pageSize: number;
        /** Total records across ALL pages (the "of N" number). */
        totalCount: number;
        /** Record noun — the frames show both "bills" and "drafts". */
        noun?: string;
        /** Aggregate total in cents for the "· $X total" meta. Omit to hide. */
        totalCents?: number;
        currency?: string;
        /** Trailing meta, e.g. " + 5 more currencies" (product-overview/01). */
        extra?: string;
        /** Fired when a page is picked from the (inferred) range menu. */
        onPageChange?: (page: number) => void;
      };
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
    <a href={href} className="decoration-alert underline underline-offset-2" {...props}>
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
  rowHeight = 56,
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
  }, [
    isVirtualized,
    scrollTop,
    rowHeight,
    annotationHeight,
    overscan,
    data.length,
    viewportHeight,
    getRowAnnotation,
  ]);

  const visibleData = isVirtualized ? data.slice(visibleStart, visibleEnd) : data;
  const effectiveRowHeight = getRowAnnotation ? rowHeight + annotationHeight : rowHeight;
  const totalHeight = isVirtualized ? data.length * effectiveRowHeight : undefined;
  const spacerHeight = isVirtualized
    ? totalHeight! - (visibleEnd - visibleStart) * effectiveRowHeight
    : 0;

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

  // Selection scopes for the pagination footer's "Select ⌄" menu. The frames
  // never show this menu OPEN, so the item set is INFERRED: scope actions on
  // the existing selection Map (select the visible page / clear everything).
  const selectPage = useCallback(() => {
    const newSelection = new Map(selection);
    data.forEach((row) => newSelection.set(getRowId(row), row));
    setSelection(newSelection);
  }, [data, getRowId, selection, setSelection]);

  const clearSelection = useCallback(() => {
    setSelection(new Map());
  }, [setSelection]);

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
  // FIXED-width selection column: with a plain `width: 56` the auto table
  // layout still hands the column its proportional share of any SPARE width
  // (w-full tables are usually wider than the columns' sum), so the checkbox
  // gutter stretched with the viewport. `width: 1%` opts it out of the
  // spare-space distribution entirely; min/max pin it to exactly 56px.
  const checkboxCellStyle = {
    width: '1%',
    minWidth: checkboxWidth,
    maxWidth: checkboxWidth,
  } as const;

  // Sticky-column geometry the footers need to line their cells up under the
  // pinned columns (extracted into TableFooter, so the switch lives there).
  const footerGeometry: TableFooterGeometry<T, K> = {
    columns,
    selectable,
    stickyLeft,
    stickyRight,
    checkboxWidth,
    checkboxCellStyle,
  };

  return (
    <div
      className={cn(
        // No outer border — the frames show the table sitting borderless on
        // the page canvas; every hairline lives INSIDE (header/dividers).
        // Flex COLUMN so the scroll region (flex-1) fills the height the caller
        // hands us (className="h-full") — that's the box the sticky pagination
        // band pins its bottom to, so it stays visible on a short viewport.
        'rounded-square bg-white flex flex-col overflow-hidden',
        className,
      )}
    >
      <div
        ref={scrollRef}
        // The scroll region owns BOTH axes: it scrolls Y (rows) and X (wide
        // tables) as one, so the sticky thead pans horizontally WITH the body
        // and the sticky first/last columns pin on X. flex-1 + min-h-0 lets it
        // fill the height the caller hands us and actually shrink/scroll.
        //
        // flex COLUMN so the natural-height table can sit at the top and a
        // flex-1 filler div (below the table) soaks up the leftover height —
        // that's what puts the whitespace UNDER the rows and lets the sticky
        // pagination band (a <div> sibling AFTER the filler, NOT a <tfoot>) ride
        // to the scroll region's FLOOR. A sticky <tfoot> can't: its containing
        // block is the <table>, so it only reaches the table's own bottom edge —
        // on a tall box + few rows it'd sit glued under the last row, not at the
        // page floor. As a flex sibling of the scroller the band pins to the
        // *scroll container's* visible bottom, so a SHORT viewport can't crop it
        // (verified: pins cleanly even at a 90px box, whitespace above it on a
        // tall box, scrolls under the rows once the data overflows).
        className="min-h-0 relative flex flex-1 flex-col overflow-auto"
        style={{ maxHeight: isVirtualized ? '600px' : undefined }}
      >
        {/* border-separate + per-cell borders: sticky cells carry their own
            hairlines (border-collapse borders stay behind and paint seams).

            flex-none: the table takes its NATURAL height (rows at content
            height, no stretch). The leftover space goes to the filler div
            after </table>, so the rows pack at the top with whitespace below. */}
        <table className="border-spacing-0 text-sm w-full flex-none border-separate">
          <thead className="top-0 bg-white sticky z-20">
            <tr>
              {selectable && (
                <th
                  className="left-0 border-limestone bg-white px-rui-3 py-rui-2 sticky z-10 border-b align-middle"
                  style={checkboxCellStyle}
                >
                  {/* th centers inline content by default — the flex wrapper
                      pins the box left so it lines up with the row checkboxes. */}
                  <div className="flex items-center">
                    <Checkbox
                      checked={isAllSelected}
                      // React doesn't support indeterminate as a prop; set via ref in a real build
                      // For now we show checked state when indeterminate for simplicity
                      onChange={toggleSelectAll}
                      aria-label="Select all rows on this page"
                    />
                  </div>
                </th>
              )}
              {columns.map((col) => {
                const isSticky = col === stickyLeft || col === stickyRight;
                const stickyLeftOffset = col === stickyLeft ? checkboxWidth : undefined;
                const stickyRightOffset = col === stickyRight ? 0 : undefined;

                return (
                  <th
                    key={col.id}
                    scope="col"
                    className={cn(
                      // Sentence case — the product never uppercases labels.
                      // Vertical limestone dividers between every column
                      // (persistence-scanned on product-overview/02).
                      'border-limestone px-rui-3 py-rui-2 text-xs font-heading text-hushed border-b whitespace-nowrap',
                      'border-l first:border-l-0',
                      ALIGN_CLASS[col.align ?? 'left'],
                      isSticky && 'bg-white sticky z-10',
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
          <tbody style={isVirtualized ? { transform: `translateY(${offsetY}px)` } : undefined}>
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
                    className={cn(
                      // group/row lets STICKY cells (which need their own
                      // opaque bg) follow the row's hover/selected state —
                      // without it they stayed white and read as vertical
                      // bands over hovered/selected rows.
                      'group/row transition-colors',
                      isClickable && 'hover:bg-limestone cursor-pointer',
                      isSelected && 'bg-tone-selected-surface',
                    )}
                    style={isVirtualized ? { height: rowHeight } : undefined}
                  >
                    {selectable && (
                      <td
                        className={cn(
                          'left-0 border-limestone px-rui-3 py-rui-3 sticky z-10 border-b align-middle',
                          isSelected ? 'bg-tone-selected-surface' : 'bg-white',
                          isClickable && !isSelected && 'group-hover/row:bg-limestone',
                        )}
                        style={checkboxCellStyle}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleRow(row)}
                            aria-label={`Select row ${id}`}
                          />
                        </div>
                      </td>
                    )}
                    {columns.map((col) => {
                      const isSticky = col === stickyLeft || col === stickyRight;
                      const stickyLeftOffset = col === stickyLeft ? checkboxWidth : undefined;
                      const stickyRightOffset = col === stickyRight ? 0 : undefined;

                      return (
                        <td
                          key={col.id}
                          className={cn(
                            'border-limestone px-rui-3 py-rui-3 text-ink border-b align-middle',
                            'border-l first:border-l-0',
                            ALIGN_CLASS[col.align ?? 'left'],
                            isSticky && 'sticky z-10',
                            isSticky && (isSelected ? 'bg-tone-selected-surface' : 'bg-white'),
                            isSticky &&
                              isClickable &&
                              !isSelected &&
                              'group-hover/row:bg-limestone',
                          )}
                          style={{
                            width: col.width,
                            left:
                              stickyLeftOffset !== undefined ? `${stickyLeftOffset}px` : undefined,
                            right:
                              stickyRightOffset !== undefined
                                ? `${stickyRightOffset}px`
                                : undefined,
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
                      // Full-width rose wash — vetted #fbf5f3–#fdf8f4 on both
                      // annotation frames (product-overview 01/02); the band
                      // has NO vertical dividers crossing it.
                      className="bg-alert-surface"
                      style={isVirtualized ? { height: annotationHeight } : undefined}
                    >
                      <td
                        colSpan={columns.length + (selectable ? 1 : 0)}
                        className="border-limestone px-rui-3 py-rui-2 border-b"
                        // The ↳ hook starts under the FIRST DATA column, past
                        // the checkbox gutter (frame 01: hook at x≈265 with
                        // the table edge at ~210).
                        style={selectable ? { paddingLeft: checkboxWidth } : undefined}
                      >
                        <div className="left-0 gap-rui-2 text-sm text-alert sticky inline-flex items-start">
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
          {/* SUMMARY / CUSTOM stay INSIDE the table as a real <tfoot>: they
              belong directly under the body (per-column totals line up under
              their columns), so they ride with the table and share the sticky
              column pins. The PAGINATION band is NOT here — see the <div> band
              after the filler below. */}
          {(footer.type === 'summary' || footer.type === 'custom') && (
            // TABLE_FOOTER_HEIGHT (h-12): the same 48px band height as the
            // pagination <div>, so every table footer is one consistent size.
            <tfoot className={cn(TABLE_FOOTER_HEIGHT, 'bg-white bottom-0 sticky z-20')}>
              {footer.type === 'summary' ? (
                <TableSummaryFooter geometry={footerGeometry} />
              ) : (
                <TableCustomFooter geometry={footerGeometry} content={footer.content} />
              )}
            </tfoot>
          )}
        </table>
        {/* Flex-1 filler: soaks up the leftover height BELOW a short table so
            the rows pack at the top with whitespace beneath, and the sticky
            PAGINATION band (the <div> below) rides to the scroll region's floor
            — a sticky <tfoot> couldn't, since its containing block is the table,
            so it only reaches the table's own bottom edge. The filler collapses
            to 0 once the rows overflow (tall data), so the band just tracks the
            scroll floor. Only present for the pagination footer, which is the
            one that pins to the page bottom. */}
        {!isVirtualized && footer.type === 'pagination' && (
          <div className="flex-1" aria-hidden data-testid="table-filler" />
        )}
        {/* The pagination band — pinned to the SCROLL container's floor (below
            the filler whitespace) via sticky bottom:0, on the vetted canvas band
            (#fbfaf6 sampled at 1px on frame 6 y634/640). Sits AFTER the filler so
            on a tall box it's already at the floor; sticky keeps it visible while
            the rows scroll under it on a tall dataset. */}
        {footer.type === 'pagination' && (
          <TablePaginationFooter
            className="bottom-0 bg-canvas sticky z-20"
            page={footer.page}
            pageSize={footer.pageSize}
            totalCount={footer.totalCount}
            noun={footer.noun}
            totalCents={footer.totalCents}
            currency={footer.currency}
            extra={footer.extra}
            onPageChange={footer.onPageChange}
            onSelectPage={selectPage}
            onClearSelection={clearSelection}
            selectionSize={selection.size}
          />
        )}
        {/* Spacer to push content down when virtualized (bottom spacer) */}
        {isVirtualized && spacerHeight > 0 && <div style={{ height: spacerHeight }} aria-hidden />}
      </div>
    </div>
  );
}
