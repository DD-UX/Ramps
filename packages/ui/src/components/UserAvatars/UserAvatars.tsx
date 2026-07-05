import { clsx } from 'clsx';

import { Avatar, type AvatarSize } from '../Avatar/Avatar';

/**
 * UserAvatars — an overlapping cluster of {@link Avatar}s for the **approval
 * chain** and any "who's on this" group (snapshot 10: Hannah Smolinski & the
 * approvers on a draft; the "David Wallace & 0 more" line in the vendor
 * hovercard).
 *
 * Avatars overlap left-to-right with a white ring separating each from the one
 * behind, so a chain of approvers reads as a single compact unit. When there are
 * more people than `max`, the overflow collapses into a "+N" chip. Stacking runs
 * **deepest → closest**: each avatar tucks UNDER the one after it, so the last
 * item (and the "+N" chip) sits on top. Vetted on product-overview snapshot 13
 * ("Any Admin" approver chip) at 8x zoom: the orange "J" bites into the green
 * "M", and "+3" bites into "J" — later is always closer.
 *
 * Tokens only; sizes come from Avatar. Presentational — hover/click behaviour
 * (e.g. opening a Popover per person) lives in the app.
 */
export interface UserAvatarsPerson {
  name: string;
  src?: string;
}

export interface UserAvatarsProps {
  people: UserAvatarsPerson[];
  /** How many avatars to show before collapsing into "+N". */
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Negative margin per size so the ring-bordered circles tuck under each other. */
const OVERLAP: Record<AvatarSize, string> = {
  sm: '-ml-1.5',
  md: '-ml-2',
  lg: '-ml-2.5',
};

export function UserAvatars({ people, max = 4, size = 'md', className }: UserAvatarsProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <div
      className={clsx('flex items-center', className)}
      role="group"
      aria-label={`${people.length} people`}
    >
      {shown.map((person, i) => (
        <span
          key={`${person.name}-${i}`}
          data-testid="stacked-avatar"
          // Later avatars overlap on top (deepest → closest, per snapshot 13) —
          // that's the natural flex paint order, so NO z-index: forcing an
          // inverted stack here is exactly the bug this replaced.
          className={clsx('rounded-pill ring-2 ring-white', i > 0 && OVERLAP[size])}
        >
          <Avatar name={person.name} src={person.src} size={size} />
        </span>
      ))}

      {overflow > 0 && (
        <span
          data-testid="stacked-avatar"
          className={clsx(
            'inline-flex items-center justify-center rounded-pill ring-2 ring-white',
            'bg-tone-neutral-surface font-heading text-tone-neutral-on',
            OVERLAP[size],
            size === 'sm' ? 'size-6 text-[0.625rem]' : size === 'lg' ? 'size-10 text-sm' : 'size-8 text-xs',
          )}
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
