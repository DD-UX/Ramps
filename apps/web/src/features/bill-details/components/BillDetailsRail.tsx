'use client';

import type { BillTabType } from '@ramps/schemas/bill-tabs';
import type { BillStatusType } from '@ramps/schemas/bills';
import { Badge } from '@ramps/ui/Badge';
import { ArrowLeft } from '@ramps/ui/icons';
import { Skeleton } from '@ramps/ui/Skeleton';
import Link from 'next/link';

import { BILL_STATUS_LABEL } from '../constants/status-label.constants';
import { useBillRail } from '../context/BillRail.context';
import { RailActiveProvider } from '../context/RailActive.context';
import { categoryFor } from '../helpers/chevron.helpers';
import { categoryBadgeLabel, groupBillsByStatus, railOrderedIds } from '../helpers/rail.helpers';
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
  const { bills, statuses, activeId, loading, tabs } = useBillRail();

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
          line: "← Bill Pay" and, beside it, WHICH category of Bill Pay you are
          in, named exactly as the list's tab bar names it. */}
      <div className="px-rui-4 gap-rui-2 border-stone flex h-[3.1rem] shrink-0 items-center border-b-2">
        <Link
          href="/bills"
          // group-hover keeps the underline off the arrow glyph — decoration
          // on the anchor itself would strike through the icon's box.
          className="gap-rui-2 text-ink text-sm font-medium group flex shrink-0 items-center"
        >
          <ArrowLeft size={16} />
          <span className="group-hover:underline">Bill Pay</span>
        </Link>
        <RailCategoryBadge tabs={tabs} statuses={statuses} />
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
 * The category badge beside "← Bill Pay" — which slice of Bill Pay this rail
 * is, said in the LIST'S OWN words. The name comes from the tab catalog via
 * {@link categoryFor}, the same lookup the chevrons use to find their place on
 * the ring, so the badge and the steppers can never disagree about where you
 * are: `← Bill Pay  [For payment]` reads as the breadcrumb it is, and the two
 * chevrons underneath name the categories either side of it.
 *
 * It matters most for the one category the tab bar CAN'T show you — Closed
 * (rejected + archived) has no tab, so without the badge a bill that's been
 * sent back looks like it's in some unnamed limbo.
 *
 * Three states, all honest:
 * - category unknown yet → a bar the badge's size. The band's chrome stays
 *   real (the "← Bill Pay" escape hatch must never skeletonise), but naming a
 *   category before we know it would be a guess.
 * - a catalog/Closed category → its `name`, verbatim from the tab.
 * - no category at all → the degraded rail of one, so the STATUS's own label
 *   is the truest thing available; there is no tab to name.
 *
 * Whichever name lands, {@link categoryBadgeLabel} phrases it with the noun it
 * counts — "Closed bills", not "Closed" — so the chip names a set of things
 * instead of leaving an adjective hanging.
 */
function RailCategoryBadge({
  tabs,
  statuses,
}: {
  tabs: BillTabType[];
  statuses: readonly BillStatusType[] | null;
}) {
  if (statuses == null) {
    // h-5 is the badge's own box (text-xs + py-0.5) and ml-auto is its resting
    // place — settling swaps content, never height or side, so the band never
    // twitches.
    return <Skeleton className="h-5 w-20 ml-auto" />;
  }

  const label = categoryFor(tabs, statuses)?.name ?? labelForLoneStatus(statuses);
  if (!label) return null;

  // `ml-auto` pins it to the band's right edge, hard against the rail's border
  // — the two ends of the row read as the two halves of the breadcrumb ("where
  // you came from" ↔ "where you are") rather than one run-on phrase.
  //
  // `truncate` over the flex child: a long custom tab name gives up its own
  // width rather than pushing "← Bill Pay" out of a w-64 rail.
  return (
    <Badge tone="accent" className="min-w-0 ml-auto truncate">
      {categoryBadgeLabel(label)}
    </Badge>
  );
}

/** The fallback name for a rail no category claims — just the status itself. */
function labelForLoneStatus(statuses: readonly BillStatusType[]): string | null {
  const [only] = statuses;
  return statuses.length === 1 && only ? BILL_STATUS_LABEL[only] : null;
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
