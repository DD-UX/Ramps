import { z } from 'zod';

import { IdSchema } from './primitives.js';

/**
 * Policies & roles — the unified permission model (ANALYSIS §9.2).
 *
 * A **policy** is one atomic capability. A **role** is the sum of a set of
 * policies. A **user** is a role plus per-user overrides:
 * `effective(user) = (policies(role) ∪ included) \ excluded` — exclude wins,
 * which encodes Ramp's Separation of Duties (subtract despite the role).
 *
 * This file is the CATALOG's single source of truth; the DB `policies` /
 * `role_policies` / `user_policy_overrides` tables are seeded FROM these
 * values and the SQL enums mirror them (ANALYSIS §4 contract flow).
 */

/** Every atomic capability in the demo (ANALYSIS §9.2 policy catalog). */
export const PolicyKeySchema = z.enum([
  'employee.all', // the non-AP realm: employee dashboard
  'billpay.view',
  'bill.create',
  'bill.submit',
  'bill.edit',
  'bill.approve',
  'bill.pay',
  'vendor.view',
  'vendor.manage',
  'payment.view',
  'policy.manage',
  'user.manage',
]);
export type PolicyKeyType = z.infer<typeof PolicyKeySchema>;

/**
 * Bill Pay capability roles (Ramp-founded, support.ramp.com — ANALYSIS §4):
 * `admin` is the Owner/Admin super-user, `accounts_payable` is the AP add-on,
 * `employee` has no Bill Pay by default. "Approver" is NOT a role — it is
 * approval-chain membership.
 */
export const RoleSchema = z.enum(['admin', 'accounts_payable', 'employee']);
export type RoleType = z.infer<typeof RoleSchema>;

/**
 * Role → policies (seeded into `role_policies`). Notable: `accounts_payable`
 * deliberately lacks `bill.approve` — separation of duties; an AP clerk can
 * create/submit/pay but only approves when a policy names them.
 */
export const ROLE_POLICIES: Record<RoleType, readonly PolicyKeyType[]> = {
  admin: PolicyKeySchema.options,
  accounts_payable: [
    'employee.all',
    'billpay.view',
    'bill.create',
    'bill.submit',
    'bill.edit',
    'bill.pay',
    'vendor.view',
    'vendor.manage',
    'payment.view',
  ],
  employee: ['employee.all'],
};

/** Per-user policy override row (`user_policy_overrides`). Exclude wins. */
export const UserPolicyOverrideSchema = z.object({
  user_id: IdSchema,
  policy_key: PolicyKeySchema,
  mode: z.enum(['include', 'exclude']),
});
export type UserPolicyOverrideType = z.infer<typeof UserPolicyOverrideSchema>;

/**
 * The one permission computation, kept beside the catalog so every consumer
 * (route handlers, RLS mirrors, UI "Customized" badges) agrees:
 * `(policies(role) ∪ included) \ excluded`.
 */
export function effectivePolicies(
  role: RoleType,
  overrides: readonly UserPolicyOverrideType[] = [],
): Set<PolicyKeyType> {
  const effective = new Set<PolicyKeyType>(ROLE_POLICIES[role]);
  for (const o of overrides) if (o.mode === 'include') effective.add(o.policy_key);
  for (const o of overrides) if (o.mode === 'exclude') effective.delete(o.policy_key);
  return effective;
}
