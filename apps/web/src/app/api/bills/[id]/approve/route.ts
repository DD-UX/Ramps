import { ApproveBillSchema } from '@ramps/schemas/bills';
import { approveBill } from '@ramps/sdk/bills';
import type { NextResponse } from 'next/server';

import { requireBillId, requireBody, respondWithBillMutation } from '../helpers/bill-route.helpers';

/**
 * POST /api/bills/[id]/approve — APPROVE. Advances a bill out of the approval
 * queue. Like submit it saves the same edit form first (the bill is still
 * editable while `awaiting_approval`), then moves it: with a complete
 * `schedule` in the body it books the payment and lands on `scheduled`;
 * without, on `approved` (scheduling becomes a later, explicit step).
 *
 * Same id + body validation as the submit route; `approveBill` runs the
 * persistence and the guarded transition, raising {@link BillNotEditableError}
 * (→ 409) if the bill's status has already moved past the queue. Returns the
 * re-read bill in its new state so the client refreshes onto the right footer.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  const { value: payload, response: badBody } = await requireBody(
    request,
    ApproveBillSchema,
    'approve payload',
  );
  if (badBody) return badBody;

  const { schedule, ...form } = payload;
  return respondWithBillMutation((supabase) => approveBill(supabase, id, form, schedule));
}
