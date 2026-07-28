'use client';

import { ArrowLeft } from '@ramps/ui/icons';
import { Skeleton } from '@ramps/ui/Skeleton';
import Link from 'next/link';

import { BILL_STATUS_LABEL } from '../constants/status-label.constants';
import { useBillRail } from '../context/BillRail.context';
import { RailActiveProvider } from '../context/RailActive.context';
import { groupBillsByStatus, railOrderedIds } from '../helpers/rail.helpers';
import { BillDetailsChevrons } from './BillDetailsChevrons';
import { BillDetailsRailItem } from './BillDetailsRailItem';
import { BillDetailsRailNav } from './BillDetailsRailNav';

/**
 * BillDetailsRail — the detail screen's first column (frame 1), sized to the
 * app side menu (`w-64`): "← Bill Pay" back to the list, then the open bill's
 * CATEGORY — every bill in the same status group its Bill Pay tab rolls up —
 * sectioned under plain status headings, with the open bill highlighted, and a
 * Prev/Next footer.
 *
 * A CLIENT component mounted in `(detail)/bills/layout.tsx`, reading its list
 * from {@link useBillRail}: the layout survives bill → bill navigation, so the
 * rail never re-fetches, never re-renders its list, and never loses its scroll
 * on a hop — only the highlight moves. Navigation is still real `<Link>`
 * anchors (the {@link BillDetailsRailItem} cards), so every hop passes through
 * the unsaved-changes guard's click capture — a dirty form can interrupt rail
 * navigation too. That anchor design is an invariant; nothing here may become
 * a programmatic `router.push`.
 *
 * While the category is still unknown (a cold deep link's first moments) the
 * rail owns its OWN loading state: chrome real ("← Bill Pay" must survive the
 * wait — a skeletonised escape hatch is a trap), list rows as bars, Prev/Next
 * in the LOADING treatment — the footer must not claim "end of the list" when
 * it only means "not loaded yet".
 */
export function BillDetailsRail() {
  const { bills, statuses, activeId, loading } = useBillRail();

  const groups = bills != null && statuses != null ? groupBillsByStatus(bills, statuses) : [];
  // The flat visual order — the one list ↑/↓ skimming and Prev/Next both walk.
  // It GROWS when the category lands mid-skim; safe, the pill tracks an id,
  // never an index.
  const orderedIds = railOrderedIds(groups);

  return (
    <aside
      aria-label="Bills in this category"
      className="border-bone gap-rui-4 w-64 bg-white flex shrink-0 flex-col border-r"
    >
      {/* h-12 like the header band next door — the rail's top row shares its
          line. "← Bill Pay" leads it alone; the rail is w-64, too narrow for
          three labels on one line. */}
      <div className="px-rui-4 border-stone flex h-[3.1rem] shrink-0 items-center border-b-2">
        <Link
          href="/bills"
          className="gap-rui-2 text-ink text-sm font-medium flex items-center hover:underline"
        >
          <ArrowLeft size={16} />
          Bill Pay
        </Link>
      </div>

      {/* The category steppers take the footer's own layout — one at each end
          of a slim row under the band, both real anchors the unsaved-changes
          guard can intercept. */}
      <BillDetailsChevrons />

      {/* The provider carries the OPTIMISTIC active id (which card holds the
          floating limestone pill) — clicks/arrows move it instantly, the
          route's [id] re-syncs it when the hop's page lands. It owns the
          debounced ↑/↓ skim too, so it needs the rail's full visual order. */}
      <RailActiveProvider initialActiveId={activeId} orderedIds={orderedIds}>
        {loading ? (
          <RailListSkeleton />
        ) : (
          <nav className="px-rui-2 pb-rui-3 gap-rui-4 min-h-0 flex flex-1 flex-col overflow-auto">
            {groups.map((group) => (
              <section key={group.status} className="gap-rui-1 flex flex-col">
                <h3 className="px-rui-2 text-hushed text-xs font-medium">
                  {BILL_STATUS_LABEL[group.status]}
                </h3>
                <ul className="gap-rui-1 flex flex-col">
                  {group.bills.map((bill) => (
                    <li key={bill.id}>
                      <BillDetailsRailItem bill={bill} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        )}

        <BillDetailsRailNav />
      </RailActiveProvider>
    </aside>
  );
}

/**
 * The rail's own loading state — the list body only, since the chrome above
 * and the footer below render for real. Which status sections appear depends
 * on the bill's category, so the headings are bars; two sections of three
 * cards is the common shape and, being inside the same scrolling nav, an
 * over- or under-count costs nothing.
 */
function RailListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading bills in this category"
      className="px-rui-2 pb-rui-3 gap-rui-4 min-h-0 flex flex-1 flex-col overflow-hidden"
    >
      {[0, 1].map((section) => (
        <div key={section} className="gap-rui-1 flex flex-col">
          {/* h-4 is the real h3's line box (text-xs) — the heading's slot is
              the same height whether it holds a bar or the status word. */}
          <span className="px-rui-2 h-4 flex items-center">
            <Skeleton className="h-2.5 w-24" />
          </span>
          <div className="gap-rui-1 flex flex-col">
            {[0, 1, 2].map((row) => (
              // BillDetailsRailItem: avatar + name over due date, same padding.
              <div key={row} className="gap-rui-2 p-rui-2 flex items-center">
                <Skeleton circle className="size-6 shrink-0" />
                <div className="gap-rui-1 min-w-0 flex flex-1 flex-col">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
