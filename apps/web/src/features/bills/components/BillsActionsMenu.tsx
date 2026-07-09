'use client';

import type { BillStatusType } from '@ramps/schemas/bills';
import { Archive, Ban } from '@ramps/ui/icons';
import { Menu, type MenuItem } from '@ramps/ui/Menu';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { apiClient } from '@/features/common/helpers/api-client.helpers';

import {
  BILL_ACTION,
  BILL_ACTION_LABEL,
  resolveBillActions,
} from '../constants/bill-actions.constants';

/**
 * BillsActionsMenu — the reusable three-dot ("overflow") menu for a bill's
 * lifecycle side-actions, shared by the Bill Pay table row (last column) and the
 * bill-details footer. It takes just the bill's id + status, so it drops into
 * both the list item ({@link BillListItemType}) and the detail model
 * ({@link BillDetailType}) without either dragging the other's shape along.
 *
 * The available items are derived from the status via {@link resolveBillActions}
 * (Reject only while `awaiting_approval`; Archive from any non-archived state) —
 * one map, checked against the transition guard, so the menu can't offer a move
 * the server will 409. Each item POSTs the matching bodyless endpoint and then
 * `router.refresh()` so the server components (the row's status pill, the
 * footer's primary) re-read the bill's new state.
 *
 * When the status yields NO action, the component renders NOTHING (returns
 * `null`) — the call sites gate on {@link hasBillActions} so a non-actionable
 * bill (rejected, archived, mid-payment) simply carries no kebab at all, rather
 * than an inert, unclickable three-dot.
 */
export interface BillsActionsMenuProps {
  /** The bill to act on — just the id + status the menu needs. */
  bill: { id: string; status: BillStatusType };
  /**
   * Panel side — `bottom` (default) hangs below the trigger; the footer passes
   * `top` so the panel rises out of the sticky action bar instead of clipping.
   */
  side?: 'top' | 'bottom';
  /**
   * Inert the whole menu — the kebab dims + stops opening. The bill-details
   * footer passes `editable` here so mid-edit the side-actions lock alongside
   * the disabled Approve primary (you Save/Cancel before archiving/rejecting).
   */
  disabled?: boolean;
}

/** The lucide glyph for each action — Archive filing, Ban for the reviewer's reject. */
const ACTION_ICON = {
  [BILL_ACTION.ARCHIVE]: Archive,
  [BILL_ACTION.REJECT]: Ban,
} as const;

export function BillsActionsMenu({ bill, side = 'bottom', disabled = false }: BillsActionsMenuProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const actions = resolveBillActions(bill.status);

  const run = useCallback(
    async (action: (typeof actions)[number]) => {
      if (busy) return; // guard against a double-fire while a request is in flight
      setBusy(true);
      try {
        if (action === BILL_ACTION.ARCHIVE) {
          await apiClient.bills.archive(bill.id);
        } else {
          await apiClient.bills.reject(bill.id);
        }
        router.refresh();
      } catch {
        // Swallow: the refresh re-reads server truth, and the menu re-enables so
        // the user can retry. A row-level toast is out of scope for this pass.
      } finally {
        setBusy(false);
      }
    },
    [bill.id, busy, router],
  );

  // Nothing to do → render nothing. The call sites already gate on
  // `hasBillActions`, but returning null here keeps the component honest on its
  // own: a non-actionable bill carries no kebab, not an inert one.
  if (actions.length === 0) {
    return null;
  }

  const items: MenuItem[] = actions.map((action) => {
    const Icon = ACTION_ICON[action];
    return {
      label: BILL_ACTION_LABEL[action],
      icon: <Icon size={16} />,
      // Reject is the reviewer's send-back — the destructive-toned item.
      tone: action === BILL_ACTION.REJECT ? 'destructive' : 'default',
      disabled: busy,
      onSelect: () => void run(action),
    };
  });

  return <Menu items={items} label="Bill actions" side={side} disabled={disabled} />;
}
