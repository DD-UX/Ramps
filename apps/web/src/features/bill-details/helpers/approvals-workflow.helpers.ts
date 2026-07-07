import type { ApprovalStageType, SaveApprovalStagesType } from '@ramps/schemas/approvals';
import { RoleSchema, type RoleType } from '@ramps/schemas/policies';
import { roleGroupLabel, type UserType } from '@ramps/schemas/users';
import type { ApprovalsRole, ApprovalsStage, ApprovalsUser } from '@ramps/ui/ApprovalsWorkflow';

/**
 * The seam between our domain model and the DS ApprovalsWorkflow's domain-free
 * shapes. The component speaks `ApprovalsRole` / `ApprovalsUser` /
 * `ApprovalsStage` (opaque string ids); our data speaks role ENUMS and user
 * UUIDs. These pure mappers translate both ways so the component stays free of
 * `@ramps/schemas` and our persistence stays free of `@ramps/ui`.
 *
 * The role catalog uses the role enum string AS the DS role id — stable,
 * collision-free, and directly reversible back to a `RoleType` on save.
 */

/** Every role, as the DS "Any Admin"-style group catalog (id = role enum). */
export function toApprovalsRoles(): ApprovalsRole[] {
  return RoleSchema.options.map((role) => ({ id: role, name: roleGroupLabel(role) }));
}

/**
 * The user catalog for the picker: each person with the role(s) they hold and
 * an optional avatar. A user holds exactly one role here, so `roleIds` is a
 * singleton — but the DS models it as an array, and role membership drives the
 * "already covered by a role" dedup.
 */
export function toApprovalsUsers(users: readonly UserType[]): ApprovalsUser[] {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    src: user.avatar_url ?? undefined,
    roleIds: [user.role],
  }));
}

/** Our persisted stages → the component's `initialStages` (enum → role id). */
export function toWorkflowStages(stages: readonly ApprovalStageType[]): ApprovalsStage[] {
  return stages.map((stage) => ({
    id: stage.id,
    roleIds: [...stage.roles],
    userIds: [...stage.user_ids],
  }));
}

/** A DS role id is valid iff it round-trips to a known `RoleType`. */
function toRole(roleId: string): RoleType | null {
  const parsed = RoleSchema.safeParse(roleId);
  return parsed.success ? parsed.data : null;
}

/**
 * The component's chain → the PUT payload. Sequence is positional (the route
 * derives it), so we send only each stage's picks. Unknown role ids (stale DS
 * data) are dropped; a stage that empties out after that is skipped so we never
 * post an invalid all-empty stage.
 */
export function fromWorkflowStages(stages: readonly ApprovalsStage[]): SaveApprovalStagesType {
  return {
    stages: stages
      .map((stage) => ({
        roles: stage.roleIds
          .map(toRole)
          .filter((role): role is RoleType => role !== null),
        user_ids: [...stage.userIds],
      }))
      .filter((stage) => stage.roles.length > 0 || stage.user_ids.length > 0),
  };
}
