import { rejectBill } from '@ramps/sdk/bills';
import type { NextResponse } from 'next/server';

import { requireBillId, respondWithBillMutation } from '../helpers/bill-route.helpers';

/**
 * POST /api/bills/[id]/reject — REJECT. The reviewer's "send it back", moving
 * an `awaiting_approval` bill → `rejected`. No body — it's a pure state advance
 * behind the row/footer overflow menu. `rejectBill` guards the move against the
 * transition map (reject is legal only from `awaiting_approval`), raising
 * {@link BillNotEditableError} (→ 409) from anywhere else. Returns the re-read
 * `rejected` bill.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  return respondWithBillMutation((supabase) => rejectBill(supabase, id));
}
