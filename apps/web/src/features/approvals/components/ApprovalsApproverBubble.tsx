import { UserAvatars } from '@ramps/ui/UserAvatars';

import type { ApprovalUserType } from '../types/approvals.types';

/**
 * ApprovalsApproverBubble — one "who signs off" chip inside a stage row: an
 * overlapping {@link UserAvatars} cluster of the people, then a two-line label —
 * the lead person's name over the group label — mirroring the frame's
 * "((HS)) Hannah Smolinski · Any Admin" (snapshot 10).
 *
 * A stage renders one of these per selected role (label = role name), then a
 * trailing one for the extra individually-picked users (label = "Users").
 * Presentational only — the people/label are resolved by the stage helpers.
 */
export interface ApprovalsApproverBubbleProps {
  people: ApprovalUserType[];
  /** The group label under the lead name ("Any Admin", "Users"). */
  label: string;
}

export function ApprovalsApproverBubble({ people, label }: ApprovalsApproverBubbleProps) {
  const lead = people[0];

  return (
    <span className="gap-rui-2 inline-flex items-center">
      <UserAvatars people={people} max={3} size="sm" />
      <span className="min-w-0 leading-tight">
        <span className="text-sm font-body text-ink block truncate">
          {lead ? lead.name : label}
        </span>
        <span className="text-xs font-body text-hushed block truncate">{label}</span>
      </span>
    </span>
  );
}
