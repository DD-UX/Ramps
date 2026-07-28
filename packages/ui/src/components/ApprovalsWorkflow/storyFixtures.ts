import type { ApprovalsRole, ApprovalsUser } from './stageHelpers';

/**
 * Shared fixtures for the ApprovalsWorkflow story family. The components are
 * domain-free — every story hands them a plain catalog (roles + users) exactly
 * as an app would pass real data — and all three story files were handing over
 * the SAME demo company, so it lives once here. Not a story module itself:
 * Storybook only loads `*.stories.tsx`.
 */
export const STORY_ROLES: ApprovalsRole[] = [
  { id: 'role-admin', name: 'Any Admin' },
  { id: 'role-approver', name: 'Any Approver' },
  { id: 'role-bookkeeper', name: 'Any Bookkeeper' },
];

export const STORY_USERS: ApprovalsUser[] = [
  { id: 'user-hannah', name: 'Hannah Smolinski', roleIds: ['role-admin'] },
  { id: 'user-diego', name: 'Diego Díaz', roleIds: ['role-admin', 'role-approver'] },
  { id: 'user-jane', name: 'Jane Doe', roleIds: ['role-approver'] },
  { id: 'user-harrington', name: 'Harrington Smith', roleIds: [] },
  { id: 'user-michael', name: 'Michael Scott', roleIds: ['role-admin'] },
  { id: 'user-pam', name: 'Pam Beesly', roleIds: ['role-bookkeeper'] },
  { id: 'user-oscar', name: 'Oscar Martinez', roleIds: ['role-bookkeeper', 'role-approver'] },
  { id: 'user-angela', name: 'Angela Martin', roleIds: ['role-bookkeeper'] },
];
