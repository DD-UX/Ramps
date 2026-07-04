import { clsx } from 'clsx';

/**
 * Avatar — the vendor/user identity chip that anchors every table row, approval
 * chain and detail header in Bill Pay.
 *
 * In Ramp's AP table the first thing your eye lands on per row is a small
 * circular monogram (CR, BI, ZF, CO …) beside the vendor name
 * (docs/watch-youtube/.../snapshots/18-overview-grouped-by-status.jpeg). When a
 * brand logo is known it fills the circle; otherwise we derive up-to-two
 * initials and tint the circle from a stable, token-sourced palette so the same
 * vendor always reads the same colour.
 *
 * Tokens only — sizes come from the spacing scale, colours from the tone
 * families; never a raw hex.
 */
export type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_STYLE: Record<AvatarSize, string> = {
  sm: 'size-6 text-[0.625rem]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
};

/**
 * Deterministic tone per identity so a vendor keeps one colour across every
 * surface. Uses the same restrained tone families as StatusPill (never raw hex).
 */
const TONE_CYCLE = [
  'bg-tone-info-surface text-tone-info-on',
  'bg-tone-positive-surface text-tone-positive-on',
  'bg-tone-warning-surface text-tone-warning-on',
  'bg-tone-accent-surface text-tone-accent-on',
  'bg-tone-neutral-surface text-tone-neutral-on',
] as const;

/** Up-to-two initials from a name: "Culver Rug Co" → "CR", "Ziply" → "Z". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return '?';
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  const last = words[words.length - 1] ?? first;
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

/** Stable index into the tone cycle from the name's characters. */
function toneIndexOf(name: string): number {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return sum % TONE_CYCLE.length;
}

export interface AvatarProps {
  /** Display name — drives initials and the deterministic tint. */
  name: string;
  /** Optional brand/user image; when it loads it replaces the monogram. */
  src?: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = initialsOf(name);
  const tone = TONE_CYCLE[toneIndexOf(name)];
  return (
    <span
      // aria-label carries the full name; the visible glyph is decorative.
      role="img"
      aria-label={name}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill font-heading select-none',
        SIZE_STYLE[size],
        !src && tone,
        className,
      )}
    >
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}
