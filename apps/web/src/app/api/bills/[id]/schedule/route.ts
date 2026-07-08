import { BillMutationResponseSchema, SchedulePaymentSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { BillNotEditableError, schedulePayment } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

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
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid bill id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = SchedulePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid schedule payload', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const supabase = createServerSupabase();

  try {
    const bill = await schedulePayment(supabase, id, parsed.data);
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
