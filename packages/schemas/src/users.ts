import { z } from 'zod';

import { RoleSchema, type RoleType } from './policies.js';
import { IdSchema } from './primitives.js';

/**
 * Users — seeded identities, no signup (ANALYSIS §9.1). The role switcher
 * changes who we're "acting as"; authorization stays real via
 * `effectivePolicies()` in ./policies.
 */
export const UserSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  email: z.email(),
  role: RoleSchema,
  /** Initials-avatar seed / optional image. Null → render initials. */
  avatar_url: z.url().nullable(),
});
export type UserType = z.infer<typeof UserSchema>;

/**
 * Role → group approvals (snapshot 10, "Add approver by role").
 *
 * A policy/chain step may name a ROLE rather than a person — the "Any Admin"
 * chip. That role resolves to the set of users who share it: one OR MORE real
 * people, rendered as a stacked-avatar group. These pure helpers own that
 * resolution so the SDK facade, the add-approver menu and any RLS mirror all
 * agree on the same grouping — no per-caller `filter(u => u.role === …)` drift.
 */

/**
 * The human label for a role's approver group — the chip text next to a
 * role-typed step ("Any Admin", "Any Accounts Payable", "Any Employee").
 */
export const ROLE_GROUP_LABEL: Record<RoleType, string> = {
  admin: 'Any Admin',
  accounts_payable: 'Any Accounts Payable',
  employee: 'Any Employee',
};

/** The label for a role's approver group. */
export function roleGroupLabel(role: RoleType): string {
  return ROLE_GROUP_LABEL[role];
}

/**
 * A role resolved to its members — the shape the add-approver menu and the
 * chain chip render from. `users` is one or more people who share `role`
 * (possibly empty if a role has no members yet); `label` is the chip text.
 */
export interface ApproverGroupType {
  role: RoleType;
  label: string;
  users: UserType[];
}

/**
 * Resolve a single role to its approver group by filtering a user list. Pure
 * and DB-free: the SDK fetches `users` once, then this groups them. Order is
 * preserved from the input (the facade name-orders), so the avatar stack is
 * stable.
 */
export function resolveRoleGroup(role: RoleType, users: readonly UserType[]): ApproverGroupType {
  return {
    role,
    label: roleGroupLabel(role),
    users: users.filter((u) => u.role === role),
  };
}

/**
 * Resolve every role to its group, in {@link RoleSchema} declaration order —
 * the full "Add approver by role" menu. A role with no members still appears
 * (empty `users`) so the menu is complete and predictable.
 */
export function resolveRoleGroups(users: readonly UserType[]): ApproverGroupType[] {
  return RoleSchema.options.map((role) => resolveRoleGroup(role, users));
}
