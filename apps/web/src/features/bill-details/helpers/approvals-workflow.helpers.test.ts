import type { ApprovalStageType } from '@ramps/schemas/approvals';
import { RoleSchema } from '@ramps/schemas/policies';
import { roleGroupLabel, type UserType } from '@ramps/schemas/users';
import { describe, expect, it } from 'vitest';

import {
  fromWorkflowStages,
  toApprovalsRoles,
  toApprovalsUsers,
  toWorkflowStages,
} from './approvals-workflow.helpers';

/**
 * The mappers are the seam between our domain model (role ENUMS + user UUIDs)
 * and the DS ApprovalsWorkflow's opaque string ids. These tests pin the round
 * trip both ways and the drop-invalid rules, so a chain edited in the component
 * persists back as the exact roles/users it started from.
 */

const USER_ID = '11111111-1111-4111-8111-111111111109';
const USER_ID_2 = '11111111-1111-4111-8111-111111111107';

function makeUser(overrides: Partial<UserType> = {}): UserType {
  return {
    id: USER_ID,
    name: 'Hannah Smolinski',
    email: 'hannah@ramps.demo',
    role: 'employee',
    avatar_url: null,
    ...overrides,
  };
}

describe('toApprovalsRoles', () => {
  it('maps every role to a group with the enum as id and the "Any …" label', () => {
    const roles = toApprovalsRoles();
    expect(roles).toHaveLength(RoleSchema.options.length);
    for (const role of RoleSchema.options) {
      expect(roles).toContainEqual({ id: role, name: roleGroupLabel(role) });
    }
  });
});

describe('toApprovalsUsers', () => {
  it('maps a user to id/name/singleton roleIds and null avatar → undefined src', () => {
    const [mapped] = toApprovalsUsers([makeUser()]);
    expect(mapped).toEqual({
      id: USER_ID,
      name: 'Hannah Smolinski',
      src: undefined,
      roleIds: ['employee'],
    });
  });

  it('passes an avatar url through as src', () => {
    const [mapped] = toApprovalsUsers([makeUser({ avatar_url: 'https://x/y.png' })]);
    expect(mapped?.src).toBe('https://x/y.png');
  });
});

describe('toWorkflowStages ↔ fromWorkflowStages', () => {
  it('round-trips a role stage and a user stage back to the same picks', () => {
    const persisted: ApprovalStageType[] = [
      { id: 'a1', bill_id: 'b1', sequence: 1, roles: ['admin'], user_ids: [] },
      { id: 'a2', bill_id: 'b1', sequence: 2, roles: [], user_ids: [USER_ID] },
    ];

    const workflow = toWorkflowStages(persisted);
    expect(workflow).toEqual([
      { id: 'a1', roleIds: ['admin'], userIds: [] },
      { id: 'a2', roleIds: [], userIds: [USER_ID] },
    ]);

    // Back to the save payload — positional sequence, so only the picks survive.
    const save = fromWorkflowStages(workflow);
    expect(save).toEqual({
      stages: [
        { roles: ['admin'], user_ids: [] },
        { roles: [], user_ids: [USER_ID] },
      ],
    });
  });

  it('drops unknown role ids (stale DS data) and keeps the users', () => {
    const save = fromWorkflowStages([
      { id: 's1', roleIds: ['admin', 'not_a_role'], userIds: [USER_ID_2] },
    ]);
    expect(save.stages).toEqual([{ roles: ['admin'], user_ids: [USER_ID_2] }]);
  });

  it('skips a stage that empties out after dropping unknown roles', () => {
    const save = fromWorkflowStages([{ id: 's1', roleIds: ['not_a_role'], userIds: [] }]);
    expect(save.stages).toEqual([]);
  });
});
