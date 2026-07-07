import type {
  ApprovalRoleType,
  ApprovalStageType,
  ApprovalUserType,
} from '../types/approvals.types';

/**
 * Stage helpers — the pure logic that turns a stored {@link ApprovalStageType}
 * (ids only) into the bubbles a stage row renders. Kept side-effect-free over
 * the catalog + stage so the role↔user dedup stays unit-testable.
 *
 * The rendering contract (per the design): a stage shows one bubble **per
 * selected role** (roles first), each carrying that role's members, then a
 * single trailing "Users" bubble for the individually-picked users who are NOT
 * already covered by any of the stage's roles.
 */

/** A resolved role bubble: the role and everyone in the catalog who holds it. */
export interface StageRoleBubble {
  role: ApprovalRoleType;
  members: ApprovalUserType[];
}

/** Everyone in the catalog who holds `roleId`, in catalog order. */
export function membersOfRole(users: ApprovalUserType[], roleId: string): ApprovalUserType[] {
  return users.filter((user) => user.roleIds.includes(roleId));
}

/**
 * The role bubbles for a stage, in the stage's role order. Unknown role ids
 * (stale mock data) are dropped rather than rendered empty.
 */
export function stageRoleBubbles(
  stage: ApprovalStageType,
  roles: ApprovalRoleType[],
  users: ApprovalUserType[],
): StageRoleBubble[] {
  return stage.roleIds
    .map((roleId) => roles.find((role) => role.id === roleId))
    .filter((role): role is ApprovalRoleType => role != null)
    .map((role) => ({ role, members: membersOfRole(users, role.id) }));
}

/**
 * The individually-picked users for a stage MINUS anyone already covered by one
 * of the stage's roles — the trailing "Users" bubble. Preserves catalog order
 * and ignores unknown user ids.
 */
export function extraUsersForStage(
  stage: ApprovalStageType,
  users: ApprovalUserType[],
): ApprovalUserType[] {
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
export function isStageEmpty(stage: ApprovalStageType, users: ApprovalUserType[]): boolean {
  return stage.roleIds.length === 0 && extraUsersForStage(stage, users).length === 0;
}
