import type {
  ApprovalRoleType,
  ApprovalStageType,
  ApprovalUserType,
} from '../types/approvals.types';

/**
 * Mocked approver catalog for the Approvals workflow demo. Stands in for what
 * would otherwise come from the org's members/roles API — enough shape to
 * exercise the compounding chain (multi-role users, role↔user dedup, overflow
 * "+N" clusters) without a backend.
 *
 * Names echo the snapshot-10 frame ("Hannah Smolinski", "Any Admin"). Some
 * users hold multiple roles on purpose, so a stage that picks a role AND one of
 * its members proves the dedup (the member never double-renders).
 */
export const APPROVAL_ROLES: ApprovalRoleType[] = [
  { id: 'role-admin', name: 'Any Admin' },
  { id: 'role-approver', name: 'Any Approver' },
  { id: 'role-bookkeeper', name: 'Any Bookkeeper' },
];

export const APPROVAL_USERS: ApprovalUserType[] = [
  { id: 'user-hannah', name: 'Hannah Smolinski', roleIds: ['role-admin'] },
  { id: 'user-diego', name: 'Diego Díaz', roleIds: ['role-admin', 'role-approver'] },
  { id: 'user-jane', name: 'Jane Doe', roleIds: ['role-approver'] },
  { id: 'user-harrington', name: 'Harrington Smith', roleIds: [] },
  { id: 'user-michael', name: 'Michael Scott', roleIds: ['role-admin'] },
  { id: 'user-pam', name: 'Pam Beesly', roleIds: ['role-bookkeeper'] },
  { id: 'user-oscar', name: 'Oscar Martinez', roleIds: ['role-bookkeeper', 'role-approver'] },
  { id: 'user-angela', name: 'Angela Martin', roleIds: ['role-bookkeeper'] },
];

/**
 * The starter chain the demo opens with — mirrors the frame's first row
 * ("① Hannah Smolinski · Any Admin"). A single stage carrying the Admin role.
 */
export const INITIAL_APPROVAL_STAGES: ApprovalStageType[] = [
  { id: 'stage-1', roleIds: ['role-admin'], userIds: [] },
];
