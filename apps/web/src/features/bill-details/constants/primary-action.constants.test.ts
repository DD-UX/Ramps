import type { BillStatusType } from '@ramps/schemas/bills';
import { describe, expect, it } from 'vitest';

import {
  hasPrimaryAction,
  PRIMARY_ACTION,
  PRIMARY_ACTION_BY_STATUS,
  resolvePrimaryAction,
  resolvePrimaryActionIcon,
} from './primary-action.constants';

const ALL_STATUSES: BillStatusType[] = [
  'draft',
  'missing_info',
  'awaiting_approval',
  'approved',
  'scheduled',
  'partially_paid',
  'paid',
  'rejected',
  'archived',
];

/**
 * The primary CTA's status → {label, behaviour-kind} maps. The footer renders
 * one button off these, so a wrong entry silently mislabels the action or fires
 * the wrong write. Locking every status pins the whole lifecycle: pre-submit
 * creates, `awaiting_approval` approves, `approved` schedules, `scheduled`
 * views read-only, `partially_paid` completes the payment, and the remaining
 * terminal states stay inert.
 */
describe('resolvePrimaryAction', () => {
  it.each([
    ['draft', PRIMARY_ACTION.CREATE],
    ['missing_info', PRIMARY_ACTION.CREATE],
    ['awaiting_approval', PRIMARY_ACTION.APPROVE],
    ['approved', PRIMARY_ACTION.SCHEDULE],
    ['scheduled', PRIMARY_ACTION.VIEW],
    ['partially_paid', PRIMARY_ACTION.COMPLETE],
    ['paid', PRIMARY_ACTION.NONE],
    ['rejected', PRIMARY_ACTION.NONE],
    ['archived', PRIMARY_ACTION.NONE],
  ] as const)('maps %s → %s', (status, kind) => {
    expect(resolvePrimaryAction(status as BillStatusType)).toBe(kind);
  });
});

describe('PRIMARY_ACTION_BY_STATUS labels', () => {
  it('gives every status-WITH-a-primary a non-empty label', () => {
    // `archived` renders no primary (see hasPrimaryAction) so it carries no
    // label; every OTHER status must read something.
    for (const status of ALL_STATUSES.filter(hasPrimaryAction)) {
      expect(PRIMARY_ACTION_BY_STATUS[status].length).toBeGreaterThan(0);
    }
  });

  it('reads "Create bill" pre-submit, "Approve" awaiting, "View schedule" scheduled', () => {
    expect(PRIMARY_ACTION_BY_STATUS.draft).toBe('Create bill');
    expect(PRIMARY_ACTION_BY_STATUS.missing_info).toBe('Create bill');
    expect(PRIMARY_ACTION_BY_STATUS.awaiting_approval).toBe('Approve');
    expect(PRIMARY_ACTION_BY_STATUS.approved).toBe('Schedule payment');
    expect(PRIMARY_ACTION_BY_STATUS.scheduled).toBe('View schedule');
    expect(PRIMARY_ACTION_BY_STATUS.partially_paid).toBe('Complete payment');
  });
});

/**
 * `hasPrimaryAction` gates whether the footer renders a primary at all.
 * `rejected` + `archived` opt out — there's no reopen/restore flow, so the
 * footer omits the button rather than showing an inert "Reopen bill" /
 * "Restore bill". Every other status keeps one.
 */
describe('hasPrimaryAction', () => {
  const NO_PRIMARY: BillStatusType[] = ['rejected', 'archived'];

  it('is false for rejected + archived and true for every other status', () => {
    for (const status of ALL_STATUSES) {
      expect(hasPrimaryAction(status)).toBe(!NO_PRIMARY.includes(status));
    }
  });
});

/**
 * Every footer primary that DOES render carries a leading glyph. The two
 * remaining rendered "read-only" primaries — scheduled + paid — both use Eye;
 * the pre-submit pair shares FilePlus. (rejected/archived render no primary.)
 */
describe('resolvePrimaryActionIcon', () => {
  it('gives every status-WITH-a-primary a (defined) leading icon', () => {
    for (const status of ALL_STATUSES.filter(hasPrimaryAction)) {
      expect(resolvePrimaryActionIcon(status)).toBeTruthy();
    }
  });

  it('shares the FilePlus glyph across the two pre-submit statuses', () => {
    expect(resolvePrimaryActionIcon('draft')).toBe(resolvePrimaryActionIcon('missing_info'));
  });
});
