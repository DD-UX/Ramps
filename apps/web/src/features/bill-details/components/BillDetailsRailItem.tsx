'use client';

import type { BillListItemType } from '@ramps/schemas/bills';
import { Avatar } from '@ramps/ui/Avatar';
import { cn } from '@ramps/ui/cn';
import { Money } from '@ramps/ui/Money';
import { motion } from 'motion/react';
import Link from 'next/link';

import { formatBillDate } from '@/features/bills/helpers/format-date.helpers';

import { PRESS_MOTION } from '../constants/press-motion.constants';
import { RAIL_ACTIVE_LAYOUT_ID } from '../constants/rail-active.constants';
import { useRailActive } from '../context/RailActive.context';
import { billTitle } from '../helpers/bill-title.helpers';
import { railAnchorAttrs } from '../helpers/rail.helpers';

/**
 * One bill card in the detail screen's rail. Split out of the (server)
 * {@link BillDetailsRail} because it moves: the card carries the design
 * system's press feel — the Button/IconButton hover-lift + tap-squash
 * ({@link PRESS_MOTION}) — so the rail's items give under the finger like
 * every other pressable in the kit. Motion animates on the client, hence the
 * `'use client'` leaf; it stays a REAL `<Link>` (wrapped with `motion.create`)
 * so navigation is still a server-side route change that walks the
 * unsaved-changes guard's click capture.
 *
 * The active state is a FLOATING background: one shared-layout `motion.span`
 * ({@link RAIL_ACTIVE_LAYOUT_ID}) that only the active card mounts. Which
 * card that is comes from {@link useRailActive}'s optimistic id — a click
 * reports the card immediately (`setActiveId`), so the limestone pill glides
 * from the old record to the new one while the route is still loading. If the
 * guard swallows the click (dirty form), the click handler never runs and the
 * pill stays put.
 */
export interface BillDetailsRailItemProps {
  bill: BillListItemType;
}

// motion.create keeps Link's ref/props contract and adds the motion props on
// top — module scope so the wrapped type is built once, not per render.
const MotionLink = motion.create(Link);

export function BillDetailsRailItem({ bill }: BillDetailsRailItemProps) {
  const { activeId, setActiveId } = useRailActive();
  const active = bill.id === activeId;

  return (
    <MotionLink
      href={`/bills/${bill.id}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => setActiveId(bill.id)}
      // Tags the anchor so the debounced ↑/↓ commit can find and click THIS
      // card's own link — a soft hop that still passes the unsaved-changes guard.
      {...railAnchorAttrs(bill.id)}
      {...PRESS_MOTION}
      // `isolate` forces a stacking context so the -z-10 highlight stays
      // INSIDE this card (above the rail's white, below the card's content)
      // even when motion leaves `transform: none` at rest.
      className={cn(
        'gap-rui-2 p-rui-2 rounded-lg relative isolate flex items-center',
        !active && 'hover:bg-limestone/60',
      )}
    >
      {active && (
        <motion.span
          layoutId={RAIL_ACTIVE_LAYOUT_ID}
          className="bg-limestone rounded-lg inset-0 absolute -z-10"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <Avatar name={bill.vendor_name ?? 'Unmatched vendor'} size="sm" />
      <div className="min-w-0">
        <p className="text-ink text-sm truncate">{billTitle(bill)}</p>
        <p className="text-hushed text-xs truncate">
          <Money cents={bill.amount_cents} currency={bill.currency} />
          {bill.due_date && <> · Due {formatBillDate(bill.due_date)}</>}
        </p>
      </div>
    </MotionLink>
  );
}
