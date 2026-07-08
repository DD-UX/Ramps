import type { BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import { EDITABLE_BILL_STATUSES, isBillEditable } from './editable-status.constants';

/**
 * isBillEditable draws the line the SDK's save guard draws: pre-submit AND
 * awaiting_approval accept edits; the payment pipeline and terminal states are
 * frozen. This pins that line so the client affordance can't drift from the
 * server's 409.
 */
describe('isBillEditable', () => {
  it('is true for the pre-submit window and awaiting_approval', () => {
    expect(isBillEditable('draft')).toBe(true);
    expect(isBillEditable('missing_info')).toBe(true);
    expect(isBillEditable('awaiting_approval')).toBe(true);
  });

  it('is false from approved onward — the payment pipeline and terminal states', () => {
    const locked: BillStatusType[] = [
      'approved',
      'scheduled',
      'partially_paid',
      'paid',
      'rejected',
      'archived',
    ];
    for (const status of locked) {
      expect(isBillEditable(status)).toBe(false);
    }
  });

  it('lists exactly the three editable statuses', () => {
    expect([...EDITABLE_BILL_STATUSES]).toEqual(['draft', 'missing_info', 'awaiting_approval']);
  });
});
