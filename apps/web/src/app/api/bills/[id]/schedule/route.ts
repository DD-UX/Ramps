import { SchedulePaymentSchema } from '@ramps/schemas/bills';
import { schedulePayment } from '@ramps/sdk/bills';
import type { NextResponse } from 'next/server';

import { requireBillId, requireBody, respondWithBillMutation } from '../helpers/bill-route.helpers';

/**
 * POST /api/bills/[id]/schedule — SCHEDULE PAYMENT. Books the money movement
 * for an already-`approved` bill: a `payments` row (pay-from account + date;
 * the ACH rail and the bill's amount are the server's) and the move
 * `approved → scheduled`.
 *
 * `schedulePayment` guards the transition against the map, raising
 * {@link BillNotEditableError} (→ 409) for a bill that isn't sitting on
 * `approved`. Returns the re-read `scheduled` bill now carrying its `payment`,
 * so the client's "Schedule payment" flips to a read-only "View schedule".
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  const { value: schedule, response: badBody } = await requireBody(
    request,
    SchedulePaymentSchema,
    'schedule payload',
  );
  if (badBody) return badBody;

  return respondWithBillMutation((supabase) => schedulePayment(supabase, id, schedule));
}
