import type { BillStatusType } from '@ramps/schemas/bills';

/**
 * The product vocabulary for each bill lifecycle state, as PLAIN TEXT — the
 * words the detail screen uses where a pill would be too loud: the pinned
 * header's "Draft" (frame 06) and the rail's status group headings ("Missing
 * info", frame 1). Same labels as the design system's StatusPill; that map is
 * private to the pill (its tone pairing is a DS concern), so the app owns its
 * own copy of the words.
 */
export const BILL_STATUS_LABEL: Record<BillStatusType, string> = {
  draft: 'Draft',
  missing_info: 'Missing info',
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  partially_paid: 'Partially paid',
  paid: 'Paid',
  rejected: 'Rejected',
  archived: 'Archived',
};
