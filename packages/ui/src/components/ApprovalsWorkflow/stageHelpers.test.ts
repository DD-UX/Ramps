import { describe, expect, it } from 'vitest';

import {
  type ApprovalsRole,
  type ApprovalsStage,
  type ApprovalsUser,
  extraUsersForStage,
  isStageEmpty,
  membersOfRole,
  stageRoleBubbles,
  usedRoleIds,
} from './stageHelpers';

/**
 * The stage helpers own the one bit of real logic in ApprovalsWorkflow: turning
 * a stored stage (ids only) into the bubbles a row renders, and the role↔user
 * dedup that guarantees a person never shows twice on the same stage. These
 * tests pin that contract so a refactor of the rendering can't silently break
 * the dedup.
 */
const roles: ApprovalsRole[] = [
  { id: 'role-admin', name: 'Any Admin' },
  { id: 'role-approver', name: 'Any Approver' },
];

const users: ApprovalsUser[] = [
  { id: 'u-hannah', name: 'Hannah', roleIds: ['role-admin'] },
  { id: 'u-diego', name: 'Diego', roleIds: ['role-admin', 'role-approver'] },
  { id: 'u-jane', name: 'Jane', roleIds: ['role-approver'] },
  { id: 'u-noone', name: 'No Role', roleIds: [] },
];

function stage(partial: Partial<ApprovalsStage>): ApprovalsStage {
  return { id: 's', roleIds: [], userIds: [], ...partial };
}

describe('membersOfRole', () => {
  it('returns everyone holding the role, in catalog order', () => {
    expect(membersOfRole(users, 'role-admin').map((u) => u.id)).toEqual(['u-hannah', 'u-diego']);
  });

  it('returns [] for an unknown role', () => {
    expect(membersOfRole(users, 'role-ghost')).toEqual([]);
  });
});

describe('stageRoleBubbles', () => {
  it('resolves one bubble per role, each with its members', () => {
    const bubbles = stageRoleBubbles(
      stage({ roleIds: ['role-admin', 'role-approver'] }),
      roles,
      users,
    );
    expect(bubbles.map((b) => b.role.id)).toEqual(['role-admin', 'role-approver']);
    expect(bubbles[0]?.members.map((u) => u.id)).toEqual(['u-hannah', 'u-diego']);
    expect(bubbles[1]?.members.map((u) => u.id)).toEqual(['u-diego', 'u-jane']);
  });

  it('preserves the stage role order, not the catalog order', () => {
    const bubbles = stageRoleBubbles(
      stage({ roleIds: ['role-approver', 'role-admin'] }),
      roles,
      users,
    );
    expect(bubbles.map((b) => b.role.id)).toEqual(['role-approver', 'role-admin']);
  });

  it('drops unknown role ids rather than rendering them empty', () => {
    const bubbles = stageRoleBubbles(
      stage({ roleIds: ['role-ghost', 'role-admin'] }),
      roles,
      users,
    );
    expect(bubbles.map((b) => b.role.id)).toEqual(['role-admin']);
  });
});

describe('extraUsersForStage', () => {
  it('returns picked users not covered by any of the stage roles', () => {
    const result = extraUsersForStage(
      stage({ roleIds: ['role-admin'], userIds: ['u-jane'] }),
      users,
    );
    expect(result.map((u) => u.id)).toEqual(['u-jane']);
  });

  it('dedups a picked user already inside a checked role', () => {
    // Hannah is in role-admin, so picking her too must not duplicate her.
    const result = extraUsersForStage(
      stage({ roleIds: ['role-admin'], userIds: ['u-hannah', 'u-jane'] }),
      users,
    );
    expect(result.map((u) => u.id)).toEqual(['u-jane']);
  });

  it('keeps a role-less picked user', () => {
    const result = extraUsersForStage(stage({ userIds: ['u-noone'] }), users);
    expect(result.map((u) => u.id)).toEqual(['u-noone']);
  });

  it('ignores unknown user ids', () => {
    expect(extraUsersForStage(stage({ userIds: ['u-ghost'] }), users)).toEqual([]);
  });
});

describe('isStageEmpty', () => {
  it('is empty with no roles and no users', () => {
    expect(isStageEmpty(stage({}), users)).toBe(true);
  });

  it('is empty when the only picked users are unknown ids (nothing resolves)', () => {
    expect(isStageEmpty(stage({ userIds: ['u-ghost'] }), users)).toBe(true);
  });

  it('is NOT empty as long as a role is present, even if its users were re-picked', () => {
    expect(isStageEmpty(stage({ roleIds: ['role-admin'], userIds: ['u-hannah'] }), users)).toBe(
      false,
    );
  });

  it('is not empty with a role', () => {
    expect(isStageEmpty(stage({ roleIds: ['role-admin'] }), users)).toBe(false);
  });

  it('is not empty with an extra user', () => {
    expect(isStageEmpty(stage({ userIds: ['u-noone'] }), users)).toBe(false);
  });
});

describe('usedRoleIds', () => {
  it('collects every role committed across the chain', () => {
    const used = usedRoleIds([
      stage({ id: 's1', roleIds: ['role-admin'] }),
      stage({ id: 's2', roleIds: ['role-approver'] }),
    ]);
    expect([...used].sort()).toEqual(['role-admin', 'role-approver']);
  });

  it('ignores user ids — only roles are one-per-chain', () => {
    const used = usedRoleIds([stage({ id: 's1', roleIds: [], userIds: ['u-jane'] })]);
    expect([...used]).toEqual([]);
  });

  it('excludes the edited stage so its own roles stay selectable', () => {
    const used = usedRoleIds(
      [
        stage({ id: 's1', roleIds: ['role-admin'] }),
        stage({ id: 's2', roleIds: ['role-approver'] }),
      ],
      's2',
    );
    expect([...used]).toEqual(['role-admin']);
  });

  it('is empty for an empty chain', () => {
    expect(usedRoleIds([]).size).toBe(0);
  });
});
