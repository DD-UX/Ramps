import { ArrowLeft } from '@ramps/ui/icons';
import { Skeleton } from '@ramps/ui/Skeleton';
import Link from 'next/link';

/**
 * The bill-detail loading boundary — what shows between clicking a bill (from
 * the list or from the rail) and its four queries resolving.
 *
 * The frame is drawn EXACTLY: the 16rem rail beside a split editing surface,
 * the rail's h-[3.1rem] top row and its 2px stone underline, the 60/40 pane
 * split. Only the record-derived contents are bars. That matters more here than
 * on the list, because this screen's chrome is heavy — if the rail width or the
 * header band shifted on resolve, the whole page would visibly re-seat.
 *
 * "← Bill Pay" renders for real, and as a working link: the one thing a user is
 * most likely to want during a slow load is out, and a skeletonised escape
 * hatch is a trap. It is the only interactive element here.
 */
export default function BillDetailLoading() {
  return (
    <div
      role="status"
      aria-label="Loading bill"
      className="min-h-0 grid h-full flex-1 grid-cols-[16rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)]"
    >
      {/* Rail */}
      <aside className="border-bone gap-rui-4 w-64 bg-white flex shrink-0 flex-col border-r">
        <div className="px-rui-4 border-stone flex h-[3.1rem] shrink-0 items-center border-b-2">
          {/* Real, and real navigation — the escape hatch must survive the wait. */}
          <Link
            href="/bills"
            className="gap-rui-2 text-ink text-sm font-medium flex items-center hover:underline"
          >
            <ArrowLeft size={16} />
            Bill Pay
          </Link>
        </div>
        <div className="px-rui-2 pb-rui-3 gap-rui-4 min-h-0 flex flex-1 flex-col overflow-hidden">
          {[0, 1].map((section) => (
            <div key={section} className="gap-rui-1 flex flex-col">
              <span className="px-rui-2 h-4 flex items-center">
                <Skeleton className="h-2.5 w-24" />
              </span>
              <div className="gap-rui-1 flex flex-col">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="px-rui-2 py-rui-2 gap-rui-1 flex flex-col">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Editing surface: the same 60/40 split the DraggablePanel lands in. */}
      <div className="min-h-0 min-w-0 bg-white flex flex-col">
        <div className="gap-rui-4 min-h-0 flex flex-1">
          {/* Left pane — the form. */}
          <div className="gap-rui-4 min-h-0 px-rui-6 pt-rui-4 flex flex-[6] flex-col overflow-hidden">
            <div className="gap-rui-2 flex flex-col">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            {/* Field grid — two columns, the shape of the invoice-info block. */}
            <div className="gap-rui-4 grid grid-cols-2">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="gap-rui-1 flex flex-col">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
          {/* Right pane — the invoice preview. */}
          <div className="p-rui-4 min-h-0 flex flex-[4] flex-col">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
