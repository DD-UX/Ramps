import {
  UserSchema,
  resolveRoleGroups,
  type ApproverGroupType,
  type UserType,
} from '@ramps/schemas/users';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk users facade — the API→DB contract for the people directory.
 *
 * The sibling of `vendors.ts`, re-grained for users: it turns the `users` table
 * into validated `UserType` rows and groups them by role for the Approvals
 * block's "Add approver by role" menu (snapshot 10). `UserSchema.parse` is the
 * boundary guard; callers get parsed models, never raw PostgREST JSON. Role
 * grouping is delegated to the pure `resolveRoleGroups` in @ramps/schemas so the
 * SDK, the add-approver UI and any RLS mirror share one grouping rule.
 */

const USER_SELECT = `id, name, email, role, avatar_url` as const;

/** The row shape PostgREST returns for {@link USER_SELECT}. */
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

/**
 * List all users, name-ordered — the raw people directory behind both the
 * "specific user" approver picker and role grouping. Returns validated models;
 * a shape the DB shouldn't produce fails loudly at `UserSchema.parse`.
 */
export async function listUsers(supabase: ServerSupabase): Promise<UserType[]> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_SELECT)
    .order('name', { ascending: true });
  if (error) throw toSdkError(error);

  const rows = (data ?? []) as unknown as UserRow[];
  return rows.map((row) => UserSchema.parse(row));
}

/**
 * Resolve every role to its approver group — the full "Add approver by role"
 * menu, each role a chip ("Any Admin") over one or more real people for the
 * stacked-avatar display. One `listUsers` fetch grouped by the pure schema
 * helper; a role with no members still appears with an empty `users` list.
 */
export async function listApproverGroups(supabase: ServerSupabase): Promise<ApproverGroupType[]> {
  const users = await listUsers(supabase);
  return resolveRoleGroups(users);
}
