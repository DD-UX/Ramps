import { BillMutationResponseSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { BillNotEditableError, rollPaymentNow } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

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
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid bill id' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  try {
    const bill = await rollPaymentNow(supabase, id);
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
