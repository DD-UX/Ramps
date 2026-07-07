import { Badge } from '../Badge/Badge';
import { UserAvatars } from '../UserAvatars/UserAvatars';
import type { ApprovalsUser } from './stageHelpers';

/**
 * ApprovalsWorkflowApproverBubble — one "who signs off" chip inside a stage row: an
 * overlapping {@link UserAvatars} cluster of the people, then a two-line label —
 * the lead person's name over the group {@link Badge} — mirroring the frame's
 * "((HS)) Hannah Smolinski · Any Admin" (snapshot 10).
 *
 * A stage renders one of these per selected role (label = role name), then a
 * trailing one for the extra individually-picked users (label = "Users"). The
 * group label rides in a quiet subtle/neutral pill Badge, so "Any Admin" /
 * "Users" reads as the same metadata chip the rest of Bill Pay uses.
 * Presentational only — the people/label are resolved by the stage helpers.
 */
export interface ApprovalsWorkflowApproverBubbleProps {
  people: ApprovalsUser[];
  /** The group label under the lead name ("Any Admin", "Users"). */
  label: string;
}

export function ApprovalsWorkflowApproverBubble({
  people,
  label,
}: ApprovalsWorkflowApproverBubbleProps) {
  const lead = people[0];

  return (
    <span className="gap-rui-2 inline-flex items-center">
      <UserAvatars people={people} max={3} size="sm" />
      <span className="gap-rui-1 min-w-0 leading-tight inline-flex flex-col items-start">
        <span className="text-sm font-body text-ink block max-w-full truncate">
          {lead ? lead.name : label}
        </span>
        <Badge tone="neutral" variant="subtle" shape="pill" className="max-w-full">
          <span className="truncate">{label}</span>
        </Badge>
      </span>
    </span>
  );
}
