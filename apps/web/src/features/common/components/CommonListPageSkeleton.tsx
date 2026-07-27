import { Skeleton } from '@ramps/ui/Skeleton';

/**
 * CommonListPageSkeleton — the `loading.tsx` body shared by Bill Pay and
 * Vendors, which are the same surface: a heading, a tab bar, a filter strip and
 * a table.
 *
 * ## The rule this follows
 *
 * A skeleton exists to stop the page MOVING when the data lands. So anything
 * already known at build time is rendered FOR REAL — the heading text, the
 * column headers, the strip's background and padding — and only the
 * server-derived parts (tab labels, row values, the footer's counts) become
 * placeholder bars. A skeleton that greys out text it already knows is a
 * skeleton that will reflow when the text appears.
 *
 * The table is a real `<table>` carrying the same padding and hairline classes
 * as the kit `Table`, and the same per-column widths, so the header row and the
 * row rhythm line up to the pixel with what replaces them.
 *
 * `Skeleton` is `aria-hidden`; the wrapper carries one `role="status"` so the
 * whole surface announces once as "Loading …" instead of once per bar.
 */
export interface CommonListPageSkeletonColumn {
  /** Header label — known statically, so it renders as real text. */
  header: string;
  /** Must match the real column's `width` so the header row doesn't shift. */
  width: string;
  align?: 'left' | 'right';
  /** Placeholder bar width for the body cells, e.g. `w-32`. */
  cellWidth: string;
}

export interface CommonListPageSkeletonProps {
  /** The page heading — static copy, rendered as itself. */
  title: string;
  /** Mirrors the real table's columns. */
  columns: CommonListPageSkeletonColumn[];
  /** How many tab placeholders to draw (the labels come from the DB). */
  tabCount: number;
  /** How many placeholder rows. Match the page size so the footer sits put. */
  rowCount: number;
  /** Whether the real table leads with a select-all checkbox column. */
  selectable?: boolean;
}

export function CommonListPageSkeleton({
  title,
  columns,
  tabCount,
  rowCount,
  selectable = false,
}: CommonListPageSkeletonProps) {
  return (
    <div className="bg-white flex flex-1 flex-col" role="status" aria-label={`Loading ${title}`}>
      <div className="pt-rui-6">
        {/* Real heading: it is never going to be anything else. */}
        <div className="px-rui-6 flex items-start justify-between">
          <h2 className="font-heading text-3xl text-ink">{title}</h2>
        </div>
        {/* Tab bar — same height and hairline as the kit Tabs, labels pending. */}
        <div className="gap-rui-4 border-bone px-rui-6 flex items-center border-b">
          {Array.from({ length: tabCount }, (_, i) => (
            <span key={i} className="px-rui-1 py-rui-3 inline-flex items-center">
              <Skeleton className="h-3.5 w-20" />
            </span>
          ))}
        </div>
      </div>

      {/* Filter strip — real chrome, real height; the controls are inert bars. */}
      <div className="gap-rui-2 px-rui-6 py-rui-2 bg-stone-50 flex">
        <Skeleton className="h-9 rounded-pill w-[20rem]" />
        <Skeleton className="size-9 rounded-pill" />
        <div className="ml-auto" />
        <Skeleton className="h-9 w-24 rounded-pill" />
        <Skeleton className="size-9 rounded-pill" />
      </div>

      {/* The activity rail's 2px, reserved. The real page always renders this
          strip, so omitting it here would shift the table by 2px on resolve. */}
      <div className="h-0.5 w-full" />

      <div className="min-h-0 flex flex-1 flex-col overflow-hidden">
        <table className="border-spacing-0 text-sm w-full flex-none border-separate">
          <thead>
            <tr>
              {selectable && <th className="border-limestone px-rui-3 py-rui-2 w-12 border-b" />}
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={[
                    'border-limestone px-rui-3 py-rui-2 text-xs font-heading text-hushed border-b whitespace-nowrap',
                    'border-l first:border-l-0',
                    column.align === 'right' ? 'text-right' : 'text-left',
                  ].join(' ')}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, row) => (
              <tr key={row}>
                {selectable && (
                  <td className="border-limestone px-rui-3 py-rui-3 border-b align-middle">
                    <Skeleton className="size-4" />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={[
                      'border-limestone px-rui-3 py-rui-3 border-b align-middle',
                      'border-l first:border-l-0',
                    ].join(' ')}
                  >
                    <Skeleton
                      className={`h-3.5 ${column.cellWidth} ${
                        column.align === 'right' ? 'ml-auto' : ''
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer band — the pagination strip's height, its counts pending. */}
      <div className="gap-rui-3 border-limestone px-rui-4 py-rui-3 flex items-center border-t">
        <Skeleton className="h-3 w-48" />
        <div className="ml-auto" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
