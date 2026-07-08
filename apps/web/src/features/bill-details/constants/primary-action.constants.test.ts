import type { BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import {
  PRIMARY_ACTION,
  PRIMARY_ACTION_BY_STATUS,
  resolvePrimaryAction,
} from './primary-action.constants';

/**
 * The primary CTA's status → {label, behaviour-kind} maps. The footer renders
 * one button off these, so a wrong entry silently mislabels the action or fires
 * the wrong write. Locking every status pins the whole lifecycle: pre-submit
 * creates, `awaiting_approval` approves, `approved` schedules, `scheduled`
 * views read-only, and the terminal states stay inert.
 */
describe('resolvePrimaryAction', () => {
  it.each([
    ['draft', PRIMARY_ACTION.CREATE],
    ['missing_info', PRIMARY_ACTION.CREATE],
    ['awaiting_approval', PRIMARY_ACTION.APPROVE],
    ['approved', PRIMARY_ACTION.SCHEDULE],
    ['scheduled', PRIMARY_ACTION.VIEW],
    ['partially_paid', PRIMARY_ACTION.NONE],
    ['paid', PRIMARY_ACTION.NONE],
    ['rejected', PRIMARY_ACTION.NONE],
    ['archived', PRIMARY_ACTION.NONE],
  ] as const)('maps %s → %s', (status, kind) => {
    expect(resolvePrimaryAction(status as BillStatusType)).toBe(kind);
  });
});

describe('PRIMARY_ACTION_BY_STATUS labels', () => {
  it('gives every status a non-empty label', () => {
    for (const label of Object.values(PRIMARY_ACTION_BY_STATUS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('reads "Create bill" pre-submit, "Approve" awaiting, "View schedule" scheduled', () => {
    expect(PRIMARY_ACTION_BY_STATUS.draft).toBe('Create bill');
    expect(PRIMARY_ACTION_BY_STATUS.missing_info).toBe('Create bill');
    expect(PRIMARY_ACTION_BY_STATUS.awaiting_approval).toBe('Approve');
    expect(PRIMARY_ACTION_BY_STATUS.approved).toBe('Schedule payment');
    expect(PRIMARY_ACTION_BY_STATUS.scheduled).toBe('View schedule');
  });
});
