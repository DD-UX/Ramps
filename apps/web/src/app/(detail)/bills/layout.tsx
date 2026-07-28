import type { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';

import { BillDetailsRail } from '@/features/bill-details/components/BillDetailsRail';
import { BillRailProvider } from '@/features/bill-details/context/BillRail.context';
import { getBillRefs, getUsers } from '@/features/bill-details/data/bill-detail.data';
import { getBillTabs } from '@/features/bills/data/bill-tabs.data';
import { USERS_SWR_KEY } from '@/features/common/constants/swr.constants';

/**
 * /bills/* detail layout — the frame every bill shares: the LEFT RAIL beside
 * the editing surface, in the two-column grid the page used to own.
 *
 * Hoisted here (out of `[id]/page.tsx`) for one reason: PARTIAL RENDERING.
 * A layout is preserved across sibling `[id]` navigations, so everything
 * mounted here survives a bill → bill hop untouched — the rail's list, its
 * scroll offset, the client caches. When the rail lived in the page, every hop
 * re-fetched and re-rendered it to draw content identical to what was already
 * on screen (and the route's loading boundary blanked it meanwhile).
 *
 * What's fetched here is exactly the BILL-INDEPENDENT data — tabs (the rail's
 * grouping), refs (the form's dropdown catalogs) and users (the approver
 * directory, seeded into SWR as before) — one server read on cold entry, zero
 * on hops. Anything that depends on WHICH bill is open cannot be read here and
 * isn't: the rail's category list is the client-side `BillRailProvider`'s job,
 * and the bill itself is the page's.
 */
export default async function BillsDetailLayout({ children }: PropsWithChildren) {
  const [tabs, refs, users] = await Promise.all([getBillTabs(), getBillRefs(), getUsers()]);

  return (
    <SWRConfig value={{ fallback: { [USERS_SWR_KEY]: users } }}>
      <BillRailProvider tabs={tabs} refs={refs}>
        {/* The single row is EXPLICITLY minmax(0,1fr): an implicit row would be
            auto-sized and grow past h-full when a pane's content is tall, making
            the whole (detail) surface scroll. Bounded, each column scrolls itself. */}
        <div className="min-h-0 grid h-full flex-1 grid-cols-[16rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
          <BillDetailsRail />
          <div className="min-h-0 min-w-0 flex flex-col">{children}</div>
        </div>
      </BillRailProvider>
    </SWRConfig>
  );
}
