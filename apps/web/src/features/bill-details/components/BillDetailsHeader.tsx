'use client';

import { Avatar } from '@ramps/ui/Avatar';
import { Skeleton } from '@ramps/ui/Skeleton';

import { BILL_DETAIL_DATA_LEVEL, dataLevelAtLeast } from '../constants/data-level.constants';
import { BILL_STATUS_LABEL } from '../constants/status-label.constants';
import { useBillDetail } from '../context/BillDetail.context';
import { billTitle } from '../helpers/bill-title.helpers';

/**
 * BillDetailsHeader — the compact identity row pinned over the form pane
 * (frames 1/06): vendor avatar, the lifecycle word in plain hushed text
 * ("Draft" — not a pill up here), then the bill's title. It stays put while
 * the form scrolls beneath (frame 1 shows exactly that state: big title gone,
 * this row still anchoring the pane), so it's `sticky top-0` inside the left
 * pane's scroll container with its own white background.
 *
 * A HEADER concern: the rail list item already carries everything this row
 * paints, so it needs `seed` — only a cold deep link's skeleton tier bars it.
 */
export function BillDetailsHeader() {
  const { bill, dataLevel } = useBillDetail();
  const real = dataLevelAtLeast(dataLevel, BILL_DETAIL_DATA_LEVEL.SEED);

  return (
    // Fixed h-12 band — the same line the document pane's tabs and the rail's
    // Bill Pay row sit on, so the three top bands read as one bar across columns.
    <div className="gap-rui-2 px-rui-5 border-bone top-0 h-12 bg-white sticky z-20 flex shrink-0 items-center border-b">
      {real ? (
        <>
          <Avatar name={bill.vendor_name ?? 'Unmatched vendor'} size="sm" />
          <span className="text-hushed text-sm">{BILL_STATUS_LABEL[bill.status]}</span>
          <span className="text-ink text-sm font-medium truncate">{billTitle(bill)}</span>
        </>
      ) : (
        <>
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-48" />
        </>
      )}
    </div>
  );
}
