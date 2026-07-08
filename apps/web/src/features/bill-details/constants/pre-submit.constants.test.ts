import { describe, expect, it } from 'vitest';

import { isApprovalRouteEditable } from './approval-editable.constants';
import { isBillPreSubmit, PRE_SUBMIT_BILL_STATUSES } from './pre-submit.constants';

describe('isBillPreSubmit', () => {
  it('treats draft and missing_info as pre-submit (authoring view)', () => {
    expect(isBillPreSubmit('draft')).toBe(true);
    expect(isBillPreSubmit('missing_info')).toBe(true);
  });

  it('treats every post-submit status as read-only-first', () => {
    for (const status of [
      'awaiting_approval',
      'approved',
      'scheduled',
      'partially_paid',
      'paid',
      'rejected',
      'archived',
    ] as const) {
      expect(isBillPreSubmit(status)).toBe(false);
    }
  });

  it('stays in lockstep with the approval-route edit window (one shared set)', () => {
    for (const status of PRE_SUBMIT_BILL_STATUSES) {
      expect(isApprovalRouteEditable(status)).toBe(true);
    }
    expect(isApprovalRouteEditable('awaiting_approval')).toBe(false);
  });
});
