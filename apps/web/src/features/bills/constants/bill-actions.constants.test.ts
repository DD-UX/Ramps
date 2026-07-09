import type { BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import {
  BILL_ACTION,
  BILL_ACTION_LABEL,
  hasBillActions,
  resolveBillActions,
} from './bill-actions.constants';

/**
 * The overflow menu's status → available-actions map. A wrong entry either hides
 * a legal move or offers one the SDK will 409, so every status is pinned:
 * Reject is an `awaiting_approval`-only affordance, Archive is available from
 * every live status the map routes to `archived` (all but the two mid-payment
 * states), and a status with no move yields an empty result — which the call
 * sites (via `hasBillActions`) read as "render no kebab at all".
 */
describe('resolveBillActions', () => {
  it('offers Reject + Archive while a bill is awaiting approval', () => {
    expect(resolveBillActions('awaiting_approval')).toEqual([
      BILL_ACTION.REJECT,
      BILL_ACTION.ARCHIVE,
    ]);
  });

  it.each(['draft', 'missing_info', 'approved', 'paid', 'rejected'] as const)(
    'offers Archive but NOT Reject from %s',
    (status) => {
      const actions = resolveBillActions(status as BillStatusType);
      expect(actions).toContain(BILL_ACTION.ARCHIVE);
      expect(actions).not.toContain(BILL_ACTION.REJECT);
    },
  );

  // A bill with a payment in flight can't be archived — the transition map
  // routes `scheduled`/`partially_paid` only onward through the payment lifecycle
  // (never to `archived`), so, like `archived` itself, they yield no overflow
  // action and the call sites render no kebab.
  it.each(['scheduled', 'partially_paid', 'archived'] as const)(
    'offers NOTHING for %s (no kebab rendered)',
    (status) => {
      expect(resolveBillActions(status as BillStatusType)).toEqual([]);
    },
  );

  it('lists Reject above Archive when both are available', () => {
    // Order is the menu order — the reviewer's decision first.
    expect(resolveBillActions('awaiting_approval')).toEqual([
      BILL_ACTION.REJECT,
      BILL_ACTION.ARCHIVE,
    ]);
  });
});

describe('hasBillActions', () => {
  it.each(['draft', 'missing_info', 'awaiting_approval', 'approved', 'paid', 'rejected'] as const)(
    'is true for %s (the row/footer mounts the kebab)',
    (status) => {
      expect(hasBillActions(status as BillStatusType)).toBe(true);
    },
  );

  // The four dead-ends: a rejected/archived bill and the two mid-payment states
  // have no move, so the call sites render no kebab at all.
  it.each(['scheduled', 'partially_paid', 'archived'] as const)(
    'is false for %s (no kebab rendered)',
    (status) => {
      expect(hasBillActions(status as BillStatusType)).toBe(false);
    },
  );
});

describe('BILL_ACTION_LABEL', () => {
  it('labels each action for the menu item', () => {
    expect(BILL_ACTION_LABEL[BILL_ACTION.ARCHIVE]).toBe('Archive');
    expect(BILL_ACTION_LABEL[BILL_ACTION.REJECT]).toBe('Reject');
  });
});
