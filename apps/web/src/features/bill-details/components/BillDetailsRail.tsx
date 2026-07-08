import type { BillListItemType, BillStatusType } from '@ramps/schemas/bills';
import { ArrowLeft } from '@ramps/ui/icons';
import Link from 'next/link';

import { BILL_STATUS_LABEL } from '../constants/status-label.constants';
import { RailActiveProvider } from '../context/RailActive.context';
import { adjacentBills, groupBillsByStatus } from '../helpers/rail.helpers';
import { BillDetailsRailItem } from './BillDetailsRailItem';
import { BillDetailsRailNav } from './BillDetailsRailNav';

/**
 * BillDetailsRail — the detail screen's first column (frame 1), sized to the
 * app side menu (`w-64`): "← Bill Pay" back to the list, then the open bill's
 * CATEGORY — every bill in the same status group its Bill Pay tab rolls up —
 * sectioned under plain status headings ("Missing info", "Ready for review"
 * in Ramp's frame), with the open bill highlighted, and a Prev/Next footer.
 *
 * A Server Component: navigation between bills is a real server-side route
 * change (each `/bills/:id` re-renders with its own rail), and — because the
 * cards are anchors — every hop passes through the unsaved-changes guard's
 * click capture, so a dirty form can interrupt rail navigation too. The card
 * itself is the client leaf {@link BillDetailsRailItem} (it carries the DS
 * press motion); grouping and Prev/Next order come from `rail.helpers`, so
 * this file only frames.
 */
export interface BillDetailsRailProps {
  /** The category's bills, due-date-ordered (the facade's order). */
  bills: BillListItemType[];
  /** The tab's status arrangement — the section order. */
  statuses: readonly BillStatusType[];
  /** The open bill — highlighted, and the anchor for Prev/Next. */
  activeId: BillListItemType['id'];
}

export function BillDetailsRail({ bills, statuses, activeId }: BillDetailsRailProps) {
  const groups = groupBillsByStatus(bills, statuses);
  const { prev, next } = adjacentBills(groups, activeId);

  return (
    <aside
      aria-label="Bills in this category"
      className="border-bone w-64 bg-white flex shrink-0 flex-col border-r"
    >
      {/* h-12 like the header band next door — the rail's top row shares its line. */}
      <div className="px-rui-4 h-12 flex shrink-0 items-center">
        <Link
          href="/bills"
          className="gap-rui-2 text-ink text-sm font-medium flex items-center hover:underline"
        >
          <ArrowLeft size={16} />
          Bill Pay
        </Link>
      </div>

      {/* The provider carries the OPTIMISTIC active id (which card holds the
          floating limestone pill) — clicks/arrows move it instantly, the
          server prop re-syncs it when the hop's page lands. */}
      <RailActiveProvider initialActiveId={activeId}>
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

        <BillDetailsRailNav prevId={prev?.id ?? null} nextId={next?.id ?? null} />
      </RailActiveProvider>
    </aside>
  );
}
