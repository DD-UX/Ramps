import { archiveBill } from '@ramps/sdk/bills';
import type { NextResponse } from 'next/server';

import { requireBillId, respondWithBillMutation } from '../helpers/bill-route.helpers';

/**
 * POST /api/bills/[id]/archive — ARCHIVE. Files a bill out of the working set
 * (→ `archived`). No body — it's a pure state advance behind the row/footer
 * overflow menu. `archiveBill` guards the move against the transition map,
 * raising {@link BillNotEditableError} (→ 409) for an already-archived bill.
 * Returns the re-read `archived` bill.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { value: id, response: badId } = await requireBillId(params);
  if (badId) return badId;

  return respondWithBillMutation((supabase) => archiveBill(supabase, id));
}
