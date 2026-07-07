/**
 * ApprovalsWorkflow types + stage helpers — the domain-free model the DS
 * component renders over, plus the pure logic that turns a stored
 * {@link ApprovalsStage} (ids only) into the bubbles a stage row shows.
 *
 * The DS never imports a domain package, so the "approver catalog" is expressed
 * as three plain shapes the CONSUMER supplies via props: a {@link ApprovalsRole}
 * (a named group), a {@link ApprovalsUser} (a person who may hold roles), and an
 * {@link ApprovalsStage} (one step's picked role + user ids). Whether those come
 * from Supabase, a mock, or Storybook fixtures is the caller's concern.
 *
 * The rendering contract (per snapshot 10): a stage shows one bubble **per
 * selected role** (roles first, each carrying that role's members), then a
 * single trailing "Users" bubble for the individually-picked users who are NOT
 * already covered by any of the stage's roles. The role↔user dedup lives here so
 * a person never renders twice on the same stage — and stays unit-testable.
 */

/**
 * The round marker used for BOTH a stage's sequence number and the "＋ Add
 * approver" circle, so the add affordance reads as the next item in the list.
 * A filled limestone pill — the frame's numbered chip (snapshot 10).
 */
export const APPROVALS_CHIP_CLASS =
  'size-6 rounded-pill bg-limestone text-xs font-heading text-hushed inline-flex shrink-0 items-center justify-center tabular-nums';

/** A named group of approvers (e.g. "Any Admin"). */
export interface ApprovalsRole {
  id: string;
  name: string;
}

/** A person who can approve, and the roles they hold in the catalog. */
export interface ApprovalsUser {
  id: string;
  name: string;
  src?: string;
  roleIds: string[];
}

/** One step in the chain: the roles and individual users picked for it. */
export interface ApprovalsStage {
  id: string;
  roleIds: string[];
  userIds: string[];
}

/** A resolved role bubble: the role and everyone in the catalog who holds it. */
export interface ApprovalsStageRoleBubble {
  role: ApprovalsRole;
  members: ApprovalsUser[];
}

/** Everyone in the catalog who holds `roleId`, in catalog order. */
export function membersOfRole(users: ApprovalsUser[], roleId: string): ApprovalsUser[] {
  return users.filter((user) => user.roleIds.includes(roleId));
}

/**
 * The role bubbles for a stage, in the stage's role order. Unknown role ids
 * (stale data) are dropped rather than rendered empty. A `Map` keyed by role id
 * avoids a per-role `find` scan.
 */
export function stageRoleBubbles(
  stage: ApprovalsStage,
  roles: ApprovalsRole[],
  users: ApprovalsUser[],
): ApprovalsStageRoleBubble[] {
  const byId = new Map(roles.map((role) => [role.id, role]));
  return stage.roleIds
    .map((roleId) => byId.get(roleId))
    .filter((role): role is ApprovalsRole => role != null)
    .map((role) => ({ role, members: membersOfRole(users, role.id) }));
}

/**
 * The individually-picked users for a stage MINUS anyone already covered by one
 * of the stage's roles — the trailing "Users" bubble. Preserves catalog order
 * and ignores unknown user ids.
 */
export function extraUsersForStage(stage: ApprovalsStage, users: ApprovalsUser[]): ApprovalsUser[] {
  const roleSet = new Set(stage.roleIds);
  const picked = new Set(stage.userIds);
  return users.filter(
    (user) => picked.has(user.id) && !user.roleIds.some((roleId) => roleSet.has(roleId)),
  );
}

/**
 * A stage is empty (nothing to render / shouldn't be committed) when it has no
 * roles and no *extra* users after dedup — e.g. the author only checked users
 * who are all already inside a checked role.
 */
export function isStageEmpty(stage: ApprovalsStage, users: ApprovalsUser[]): boolean {
  return stage.roleIds.length === 0 && extraUsersForStage(stage, users).length === 0;
}

/**
 * The role ids already committed across the chain — the picker hides these so a
 * role can only approve once. `exceptStageId` excludes one stage's own roles
 * (the stage being edited), so Edit can still see and uncheck them. Users are
 * never excluded this way; only roles are one-per-chain.
 */
export function usedRoleIds(stages: ApprovalsStage[], exceptStageId?: string): Set<string> {
  const used = new Set<string>();
  for (const stage of stages) {
    if (stage.id === exceptStageId) continue;
    for (const roleId of stage.roleIds) used.add(roleId);
  }
  return used;
}
