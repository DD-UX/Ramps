import { BillMutationResponseSchema } from '@ramps/schemas/bills';
import { IdSchema } from '@ramps/schemas/primitives';
import { BillMissingApproversError, BillNotEditableError } from '@ramps/sdk/bills';
import { createServerSupabase } from '@ramps/sdk/server';
import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';

/**
 * bill-route.helpers — the boilerplate every `/api/bills/[id]/*` handler was
 * repeating verbatim, said once: the id gate (400), the body gate (400 bad
 * JSON / 422 bad shape), and the mutation envelope (SDK call →
 * {@link BillMutationResponseSchema} → {@link BillNotEditableError} as 409).
 * A handler now reads as its three moves and nothing else:
 *
 *   const { value: id, response: badId } = await requireBillId(params);
 *   if (badId) return badId;
 *   return respondWithBillMutation((supabase) => archiveBill(supabase, id));
 *
 * NOT a framework: each gate returns a {@link RouteGate} pair the route
 * early-returns itself, so a handler with its own verdicts (the GET's 404,
 * approval-stages' editability 409) reuses the gates and keeps its flow.
 */

/**
 * A gate's outcome: the parsed value, or the error response to return as-is —
 * a discriminated pair, so `if (response) return response;` narrows `value`.
 */
export type RouteGate<T> = { value: T; response: null } | { value: null; response: NextResponse };

/** The `[id]` segment, validated — or the 400 every handler answers alike. */
export async function requireBillId(params: Promise<{ id: string }>): Promise<RouteGate<string>> {
  const { id } = await params;
  if (!IdSchema.safeParse(id).success) {
    return {
      value: null,
      response: NextResponse.json({ error: 'Invalid bill id' }, { status: 400 }),
    };
  }
  return { value: id, response: null };
}

/**
 * The request body, JSON-parsed and schema-validated — or the 400 (not JSON)
 * / 422 (wrong shape, issues attached) every bodied handler answers alike.
 * `label` names the payload in the 422 ("approve payload", "bill payload").
 */
export async function requireBody<T>(
  request: Request,
  schema: ZodType<T>,
  label: string,
): Promise<RouteGate<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      value: null,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      value: null,
      response: NextResponse.json(
        { error: `Invalid ${label}`, issues: parsed.error.issues },
        { status: 422 },
      ),
    };
  }
  return { value: parsed.data, response: null };
}

/**
 * The mutation envelope: run the SDK call and answer with the re-read bill.
 * The SDK owns the transition guards, so an illegal move surfaces here as
 * {@link BillNotEditableError} → 409 — a stale client can't rewrite a frozen
 * record — and a submit whose approval route is empty as
 * {@link BillMissingApproversError} → 422 (the record is fine, the
 * approvers-required rule isn't met); anything else is a genuine 500 and
 * rethrows. The response shape is re-validated at the boundary before it
 * crosses the wire.
 */
export async function respondWithBillMutation(
  mutate: (supabase: ReturnType<typeof createServerSupabase>) => Promise<unknown>,
): Promise<NextResponse> {
  const supabase = createServerSupabase();
  try {
    const bill = await mutate(supabase);
    return NextResponse.json(BillMutationResponseSchema.parse({ bill }));
  } catch (error) {
    if (error instanceof BillNotEditableError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof BillMissingApproversError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
