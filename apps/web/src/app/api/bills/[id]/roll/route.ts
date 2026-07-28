import { rollPaymentNow } from '@ramps/sdk/bills';
import type { NextResponse } from 'next/server';

import { requireBillId, respondWithBillMutation } from '../helpers/bill-route.helpers';

/**
 * POST /api/bills/[id]/roll — COMPLETE PAYMENT ("roll it now"). Releases a
 * `scheduled` bill's payment immediately: settles the live payment row (→ paid,
 * arrival = today) and moves the bill `scheduled → paid`.
 *
 * No body — the account + amount are already booked on the payment row, so this
 * is a pure state advance. `rollPaymentNow` guards the transition against the
 * map, raising {@link BillNotEditableError} (→ 409) for a bill that isn't
 * sitting on `scheduled`. Returns the re-read `paid` bill.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  return respondWithBillMutation((supabase) => rollPaymentNow(supabase, id));
}
