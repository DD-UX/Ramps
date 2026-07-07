import { describe, expect, it } from 'vitest';

import type {
  ApprovalRoleType,
  ApprovalStageType,
  ApprovalUserType,
} from '../types/approvals.types';
import { extraUsersForStage, isStageEmpty, membersOfRole, stageRoleBubbles } from './stage.helpers';

const roles: ApprovalRoleType[] = [
  { id: 'role-admin', name: 'Any Admin' },
  { id: 'role-approver', name: 'Any Approver' },
];

const users: ApprovalUserType[] = [
  { id: 'u-hannah', name: 'Hannah Smolinski', roleIds: ['role-admin'] },
  { id: 'u-diego', name: 'Diego Díaz', roleIds: ['role-admin', 'role-approver'] },
  { id: 'u-jane', name: 'Jane Doe', roleIds: ['role-approver'] },
  { id: 'u-harrington', name: 'Harrington Smith', roleIds: [] },
];

const stage = (partial: Partial<ApprovalStageType>): ApprovalStageType => ({
  id: 's1',
  roleIds: [],
  userIds: [],
  ...partial,
});

describe('membersOfRole', () => {
  it('returns everyone holding the role, in catalog order', () => {
    expect(membersOfRole(users, 'role-admin').map((u) => u.id)).toEqual(['u-hannah', 'u-diego']);
    expect(membersOfRole(users, 'role-approver').map((u) => u.id)).toEqual(['u-diego', 'u-jane']);
  });

  it('returns [] for an unknown role', () => {
    expect(membersOfRole(users, 'role-nope')).toEqual([]);
  });
});

describe('stageRoleBubbles', () => {
  it('resolves one bubble per role, in the stage order, each with its members', () => {
    const bubbles = stageRoleBubbles(
      stage({ roleIds: ['role-approver', 'role-admin'] }),
      roles,
      users,
    );
    expect(bubbles.map((b) => b.role.id)).toEqual(['role-approver', 'role-admin']);
    expect(bubbles[0]?.members.map((u) => u.id)).toEqual(['u-diego', 'u-jane']);
    expect(bubbles[1]?.members.map((u) => u.id)).toEqual(['u-hannah', 'u-diego']);
  });

  it('drops unknown role ids rather than rendering empty bubbles', () => {
    const bubbles = stageRoleBubbles(stage({ roleIds: ['role-nope', 'role-admin'] }), roles, users);
    expect(bubbles.map((b) => b.role.id)).toEqual(['role-admin']);
  });
});

describe('extraUsersForStage', () => {
  it('keeps only picked users not already covered by a stage role', () => {
    // Admin role covers Hannah + Diego; picking them again + Harrington should
    // yield ONLY Harrington in the trailing users bubble.
    const result = extraUsersForStage(
      stage({ roleIds: ['role-admin'], userIds: ['u-hannah', 'u-diego', 'u-harrington'] }),
      users,
    );
    expect(result.map((u) => u.id)).toEqual(['u-harrington']);
  });

  it('returns all picked users when the stage has no roles', () => {
    const result = extraUsersForStage(stage({ userIds: ['u-jane', 'u-harrington'] }), users);
    expect(result.map((u) => u.id)).toEqual(['u-jane', 'u-harrington']);
  });

  it('dedups across multiple roles (a user in any stage role is covered)', () => {
    // Diego holds approver; picking the approver role + Diego drops Diego.
    const result = extraUsersForStage(
      stage({ roleIds: ['role-approver'], userIds: ['u-diego'] }),
      users,
    );
    expect(result).toEqual([]);
  });

  it('ignores unknown user ids', () => {
    const result = extraUsersForStage(stage({ userIds: ['u-ghost'] }), users);
    expect(result).toEqual([]);
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
    // The stage still renders the role's bubble; the redundant user pick just
    // dedups out of the trailing "Users" bubble.
    expect(isStageEmpty(stage({ roleIds: ['role-admin'], userIds: ['u-hannah'] }), users)).toBe(
      false,
    );
  });

  it('is not empty with a role', () => {
    expect(isStageEmpty(stage({ roleIds: ['role-admin'] }), users)).toBe(false);
  });

  it('is not empty with an extra user', () => {
    expect(isStageEmpty(stage({ userIds: ['u-harrington'] }), users)).toBe(false);
  });
});
