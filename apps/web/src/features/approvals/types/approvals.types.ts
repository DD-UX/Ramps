/**
 * Approvals workflow — the local domain types for the snapshot-10 approval chain
 * (…/snapshots/10-approvals-add-approver.jpeg).
 *
 * A workflow is an ordered list of {@link ApprovalStageType}s. Each stage is one
 * "who signs off here" step, composed of any number of **roles** and/or
 * **individual users** the author checked in a single Add-approver commit.
 *
 * These are intentionally UI-local and mocked — they are NOT the server
 * `BillApprovalStepType` (which is a flat, already-resolved approver per step).
 * This models the *authoring* surface: picking roles/users to compound a chain.
 */

/** A named approver role — everyone who holds it can approve at that stage. */
export interface ApprovalRoleType {
  id: string;
  /** Human-readable label shown on the stage bubble ("Any Admin"). */
  name: string;
}

/** A person who can be added to a stage, either directly or via a role. */
export interface ApprovalUserType {
  id: string;
  name: string;
  /** Optional avatar image; falls back to initials in {@link Avatar}. */
  src?: string;
  /** The roles this user holds — drives the role↔user dedup on a stage. */
  roleIds: string[];
}

/**
 * One step in the chain. Holds the roles and the individually-picked users the
 * author committed together. Rendering dedups: users already covered by one of
 * this stage's roles are dropped from the trailing "Users" bubble.
 */
export interface ApprovalStageType {
  id: string;
  roleIds: string[];
  userIds: string[];
}
