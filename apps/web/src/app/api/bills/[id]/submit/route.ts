import { BillSaveSchema } from '@ramps/schemas/bills';
import { submitBill } from '@ramps/sdk/bills';
import type { NextResponse } from 'next/server';

import { requireBillId, requireBody, respondWithBillMutation } from '../helpers/bill-route.helpers';

/**
 * POST /api/bills/[id]/submit — CREATE BILL. A superset of the Save-draft PUT:
 * it saves the same edit form, THEN moves the bill `draft`/`missing_info` →
 * `awaiting_approval` so it enters the approval queue.
 *
 * The browser→API hop for the footer's "Create bill". Same id + body validation
 * as the save route; `submitBill` runs the persistence and the guarded
 * transition, raising {@link BillNotEditableError} (→ 409) if the bill's status
 * has already frozen it. Returns the re-read bill now in `awaiting_approval` so
 * the client can redirect into the "For approval" list confident of the move.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  const { value: form, response: badBody } = await requireBody(
    request,
    BillSaveSchema,
    'bill payload',
  );
  if (badBody) return badBody;

  return respondWithBillMutation((supabase) => submitBill(supabase, id, form));
}
