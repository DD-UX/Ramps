import { clsx } from 'clsx';

/**
 * Logo — the "ramps" brand mark: TWO Ramp marks concatenated side by side.
 *
 * The project is called *ramps*, so the logo is literally two of Ramp's marks
 * in a row — each mark is the swoosh (the ramp) plus the little landing bar,
 * taken verbatim from Ramp's shipped 16×16 icon paths. The pair sits in a
 * 32×16 viewBox (a strict 2:1 lockup), the second mark translated one full
 * glyph width right so they read like letterforms, not an overlap.
 *
 * VETTING (product-overview/01-dashboard-drafts-tab.jpeg, 1px sampling):
 *  - The mark lives at the nav's top-left (x14-28 y12-26); its densest stroke
 *    junctions sample #4e4d49–#565551 — thin-stroke JPEG lightening over the
 *    limestone nav (#f1f0ec), i.e. the INK family. Default color is text-ink.
 *  - Fills use `currentColor`, so any token color can restyle it (e.g.
 *    text-limestone on a dark surface) without touching the paths.
 */
export interface LogoProps {
  /** Rendered height in px — width is always 2× (the lockup is 2:1). @default 16 */
  size?: number;
  className?: string;
  /** Accessible name for the mark. @default 'ramps' */
  'aria-label'?: string;
}

/** The landing bar under the swoosh — verbatim from Ramp's 16×16 icon. */
const RAMP_BAR = 'M15.5 13.298v.056l-8.17.003v-.06a12.8 12.8 0 0 0 2.723-2.071h3.355z';
/** The ramp itself (the diagonal swoosh) — verbatim from Ramp's 16×16 icon. */
const RAMP_SWOOSH =
  'M13.476 2.551 11.405.5h-.06s.035 3.823-3.442 7.3C4.5 11.205.5 11.212.5 11.212v.06l2.11 2.087s3.942.04 7.425-3.41c3.47-3.44 3.44-7.396 3.44-7.396';

export function Logo({ size = 16, className, 'aria-label': ariaLabel = 'ramps' }: LogoProps) {
  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 32 16"
      fill="none"
      role="img"
      aria-label={ariaLabel}
      className={clsx('text-ink', className)}
    >
      {/* First ramp. */}
      <path fill="currentColor" d={RAMP_BAR} />
      <path fill="currentColor" d={RAMP_SWOOSH} />
      {/* Second ramp — one glyph width to the right. */}
      <g transform="translate(16 0)">
        <path fill="currentColor" d={RAMP_BAR} />
        <path fill="currentColor" d={RAMP_SWOOSH} />
      </g>
    </svg>
  );
}
