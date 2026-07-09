import { BillMutationResponseSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { BillNotEditableError, rejectBill } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

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
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid bill id' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  try {
    const bill = await rejectBill(supabase, id);
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
