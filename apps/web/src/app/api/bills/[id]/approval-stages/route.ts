import { ApprovalStagesResponseSchema, SaveApprovalStagesSchema } from '@ramps/schemas/approvals';
import { IdSchema } from '@ramps/schemas/primitives';
import { saveApprovalStages } from '@ramps/sdk/approvals';
import { getBill } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';

import { isApprovalRouteEditable } from '@/features/bill-details/constants/approval-editable.constants';

/**
 * PUT /api/bills/[id]/approval-stages — replace a bill's editable approval route
 * (the ApprovalsWorkflow chain) with the posted stages.
 *
 * The app's first mutation handler: the browser→API hop for the chain editor.
 * It validates the id and body against the schema SSoT, refuses to edit a bill
 * whose status has locked the route (only draft/missing_info are editable —
 * mirrors the component's `readOnly`), then delegates the replace-all write to
 * the SDK facade. Returns the persisted chain (server ids echoed) so the client
 * can reconcile freshly-added stages.
 */
export async function PUT(
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

  const parsed = SaveApprovalStagesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid approval stages', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const supabase = createServerSupabase();

  // The route is only editable while the bill is a draft / missing info — once
  // it's submitted the chain is a frozen record. Guarding here backs the UI's
  // readOnly so a stale client can't rewrite a locked chain.
  const bill = await getBill(supabase, id);
  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  }
  if (!isApprovalRouteEditable(bill.status)) {
    return NextResponse.json({ error: 'This bill is no longer editable' }, { status: 409 });
  }

  const approval_stages = await saveApprovalStages(supabase, id, parsed.data);

  // Re-validate the response shape at the boundary before it crosses the wire.
  return NextResponse.json(ApprovalStagesResponseSchema.parse({ approval_stages }));
}
