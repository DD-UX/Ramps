import { describe, expect, it } from 'vitest';

import {
  ROLE_GROUP_LABEL,
  resolveRoleGroup,
  resolveRoleGroups,
  roleGroupLabel,
  type UserType,
} from './users';

/**
 * The role→group resolver backs "Add approver by role" (snapshot 10): a role
 * step ("Any Admin") must resolve to the one-OR-MORE people who share it, for
 * the stacked-avatar chip. These are pure functions — no DB — so the SDK facade,
 * the add-approver menu and any RLS mirror all group the same way.
 */

const user = (id: string, name: string, role: UserType['role']): UserType => ({
  id,
  name,
  email: `${name.toLowerCase()}@ramps.demo`,
  role,
  avatar_url: null,
});

// A directory mirroring the seed: three per role, so a role is a real group.
const DIRECTORY: UserType[] = [
  user('11111111-1111-1111-1111-111111111101', 'Diego', 'admin'),
  user('11111111-1111-1111-1111-111111111104', 'Priya', 'admin'),
  user('11111111-1111-1111-1111-111111111106', 'Nadia', 'admin'),
  user('11111111-1111-1111-1111-111111111102', 'Ava', 'accounts_payable'),
  user('11111111-1111-1111-1111-111111111103', 'Marcus', 'accounts_payable'),
  user('11111111-1111-1111-1111-111111111107', 'Sofia', 'accounts_payable'),
  user('11111111-1111-1111-1111-111111111105', 'Tom', 'employee'),
  user('11111111-1111-1111-1111-111111111108', 'Leo', 'employee'),
  user('11111111-1111-1111-1111-111111111109', 'Hannah', 'employee'),
];

describe('roleGroupLabel', () => {
  it('maps each role to its chip label', () => {
    expect(roleGroupLabel('admin')).toBe('Any Admin');
    expect(roleGroupLabel('accounts_payable')).toBe('Any Accounts Payable');
    expect(roleGroupLabel('employee')).toBe('Any Employee');
  });

  it('has a label for every role in the catalog', () => {
    expect(Object.keys(ROLE_GROUP_LABEL).sort()).toEqual(
      ['accounts_payable', 'admin', 'employee'].sort(),
    );
  });
});

describe('resolveRoleGroup', () => {
  it('resolves a role to the users who share it (one or more)', () => {
    const group = resolveRoleGroup('admin', DIRECTORY);
    expect(group.role).toBe('admin');
    expect(group.label).toBe('Any Admin');
    expect(group.users.map((u) => u.name)).toEqual(['Diego', 'Priya', 'Nadia']);
  });

  it('preserves input order for a stable avatar stack', () => {
    const group = resolveRoleGroup('accounts_payable', DIRECTORY);
    expect(group.users.map((u) => u.name)).toEqual(['Ava', 'Marcus', 'Sofia']);
  });

  it('returns an empty group when no user has the role', () => {
    const group = resolveRoleGroup('admin', [user('x', 'Solo', 'employee')]);
    expect(group.users).toEqual([]);
    expect(group.label).toBe('Any Admin');
  });
});

describe('resolveRoleGroups', () => {
  it('returns every role as a group, in catalog order', () => {
    const groups = resolveRoleGroups(DIRECTORY);
    expect(groups.map((g) => g.role)).toEqual(['admin', 'accounts_payable', 'employee']);
    expect(groups.map((g) => g.users.length)).toEqual([3, 3, 3]);
  });

  it('still lists a role with no members (empty users)', () => {
    const groups = resolveRoleGroups([user('x', 'Solo', 'employee')]);
    const admin = groups.find((g) => g.role === 'admin');
    expect(admin?.users).toEqual([]);
    const employee = groups.find((g) => g.role === 'employee');
    expect(employee?.users.map((u) => u.name)).toEqual(['Solo']);
  });
});
