import { ApproveBillSchema, BillMutationResponseSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { approveBill, BillNotEditableError } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

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

  const parsed = ApproveBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid approve payload', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { schedule, ...form } = parsed.data;
  const supabase = createServerSupabase();

  try {
    const bill = await approveBill(supabase, id, form, schedule);
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}
