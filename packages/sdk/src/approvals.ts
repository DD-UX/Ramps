import {
  ApprovalStageSchema,
  SaveApprovalStagesSchema,
  type ApprovalStageType,
  type SaveApprovalStagesType,
} from '@ramps/schemas/approvals';

import { toSdkError, type ServerSupabase } from './server.js';

/**
 * @ramps/sdk approvals facade — the API→DB contract for the editable approval
 * ROUTE (the ApprovalsWorkflow chain), distinct from the materialized,
 * status-bearing `approvals` rows the bill detail also reads.
 *
 * A stage is roles ∪ users across three tables (`approval_stages` +
 * `approval_stage_roles` + `approval_stage_users`). {@link saveApprovalStages}
 * owns the replace-all write; reads ride along on `getBill`'s embed in
 * `bills.ts`. `SaveApprovalStagesSchema.parse` is the boundary guard.
 */

/** The row shape PostgREST returns for a stage insert (id echoed back). */
interface InsertedStageRow {
  id: string;
  sequence: number;
}

/**
 * Replace a bill's whole approval route with `input.stages`, in array order.
 *
 * Replace-all, not a diff: the chain is small and the editor always emits the
 * full ordered list, so the simplest correct write is delete-then-insert.
 * Deleting the parent `approval_stages` cascades to the role/user child rows
 * (FK `on delete cascade`), so one delete clears the bill. Sequence is derived
 * from array index (1-based) — the client never sends it. Returns the freshly
 * persisted stages (validated) so the caller can echo server ids back to the UI.
 *
 * NOTE: this is not a single DB transaction (PostgREST has no multi-statement
 * tx); it's a delete followed by ordered inserts. For this demo's single-author
 * chain that's acceptable — a concurrent editor is out of scope. Each step
 * throws through {@link toSdkError} on failure.
 */
export async function saveApprovalStages(
  supabase: ServerSupabase,
  billId: string,
  input: SaveApprovalStagesType,
): Promise<ApprovalStageType[]> {
  const { stages } = SaveApprovalStagesSchema.parse(input);

  // Clear the existing route first (cascades to role/user children).
  const del = await supabase.from('approval_stages').delete().eq('bill_id', billId);
  if (del.error) throw toSdkError(del.error);

  if (stages.length === 0) return [];

  // Insert the stage parents in order, sequence = position. `select()` echoes
  // the generated ids so we can attach the children and return the full model.
  const stageRows = stages.map((_, index) => ({ bill_id: billId, sequence: index + 1 }));
  const { data: inserted, error: insErr } = await supabase
    .from('approval_stages')
    .insert(stageRows)
    .select('id, sequence');
  if (insErr) throw toSdkError(insErr);

  const rows = (inserted ?? []) as unknown as InsertedStageRow[];
  const idBySequence = new Map(rows.map((r) => [r.sequence, r.id]));

  // Fan out each stage's picks into the two child tables.
  const roleRows: { stage_id: string; role: string }[] = [];
  const userRows: { stage_id: string; user_id: string }[] = [];
  stages.forEach((stage, index) => {
    const stageId = idBySequence.get(index + 1);
    if (!stageId) return; // insert count mismatch — guarded below by the reparse
    for (const role of stage.roles) roleRows.push({ stage_id: stageId, role });
    for (const userId of stage.user_ids) userRows.push({ stage_id: stageId, user_id: userId });
  });

  if (roleRows.length > 0) {
    const { error } = await supabase.from('approval_stage_roles').insert(roleRows);
    if (error) throw toSdkError(error);
  }
  if (userRows.length > 0) {
    const { error } = await supabase.from('approval_stage_users').insert(userRows);
    if (error) throw toSdkError(error);
  }

  // Return the persisted model, validated — the same shape `getBill` embeds.
  return stages.map((stage, index) =>
    ApprovalStageSchema.parse({
      id: idBySequence.get(index + 1),
      bill_id: billId,
      sequence: index + 1,
      roles: stage.roles,
      user_ids: stage.user_ids,
    }),
  );
}
