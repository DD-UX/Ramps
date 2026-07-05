import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

/**
 * Foundations/Tokens — the living token sheet.
 *
 * Every swatch reads its color STRAIGHT from the `--rui-*` custom property at
 * render time (no hex is repeated here), so this page can never drift from
 * src/tokens/tokens.css — it IS tokens.css, painted. The notes carry the
 * vetting provenance from the token sheet so a reviewer can trace each value
 * back to the product frame it was sampled from.
 *
 * FILENAME NOTE: this file is `DesignTokens.stories.tsx` (not `Tokens.…`) on
 * purpose — graphify's secret-hygiene heuristic silently skips any file whose
 * name ends in a bare "token(s)" word, dropping it from the knowledge graph.
 * The Storybook title stays 'Foundations/Tokens'. Do not rename it back.
 */
const meta = {
  title: 'Foundations/Tokens',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** Resolve a custom property's live value off :root (kept in sync by definition). */
function useResolvedToken(token: string): string {
  // Lazy initializer: read once at mount — Storybook renders client-side only,
  // and the sheet is static, so no effect/subscription is needed.
  const [value] = useState(() =>
    getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
  );
  return value;
}

function Swatch({ token, note }: { token: string; note: string }) {
  const value = useResolvedToken(token);
  return (
    <div className="flex items-center gap-rui-3">
      <div
        className="h-10 w-10 flex-shrink-0 rounded-square border border-bone"
        style={{ background: `var(${token})` }}
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-rui-2">
          <code className="text-sm font-heading text-ink">{token}</code>
          <code className="text-xs font-body text-hushed">{value}</code>
        </div>
        <p className="text-xs font-body text-hushed">{note}</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-rui-3 mt-rui-6 text-sm font-heading text-ink first:mt-0">{children}</h2>;
}

/** The core palette — the neutrals ladder plus the three signal colors. */
export const Palette: Story = {
  render: () => (
    <div className="max-w-xl">
      <SectionTitle>Palette</SectionTitle>
      <div className="flex flex-col gap-rui-3">
        <Swatch token="--rui-ink" note="Primary text; pairs with accent lime." />
        <Swatch token="--rui-ink-strong" note="The darkest step — display headings." />
        <Swatch token="--rui-hushed" note="Secondary text, inactive nav items, meta." />
        <Swatch token="--rui-bone" note="Hairlines: dividers, control borders at rest." />
        <Swatch token="--rui-stone" note="Mid gray — active nav item, split grips (vetted frame 7)." />
        <Swatch token="--rui-limestone" note="Surface gray — nav background, subtle chips." />
        <Swatch token="--rui-canvas" note="Warm near-white the product paints behind surfaces." />
        <Swatch token="--rui-accent" note="The lime — always paired with ink, never with white." />
        <Swatch token="--rui-destructive" note="Orange family — the product never uses red for actions." />
        <Swatch token="--rui-positive" note="Ryu's constructive green (checked checkboxes, §15)." />
        <Swatch token="--rui-alert" note="The ONE true red: flagged-bill annotation text (§01/02)." />
        <Swatch token="--rui-alert-surface" note="Rose whisper behind flagged-bill annotation bands." />
      </div>
    </div>
  ),
};

const TONES = [
  { tone: 'neutral', label: 'Neutral' },
  { tone: 'info', label: 'Info' },
  { tone: 'accent', label: 'Accent' },
  { tone: 'positive', label: 'Positive' },
  { tone: 'warning', label: 'Warning' },
  { tone: 'critical', label: 'Critical' },
] as const;

/** Status tones — the surface/on pairs StatusPill and Badge draw from. */
export const StatusTones: Story = {
  render: () => (
    <div className="max-w-xl">
      <SectionTitle>Status tones (surface + on pairs)</SectionTitle>
      <div className="flex flex-col gap-rui-3">
        {TONES.map(({ tone, label }) => (
          <div key={tone} className="flex items-center gap-rui-3">
            <span
              className="inline-flex items-center rounded-square px-rui-2 py-0.5 text-xs font-heading"
              style={{
                background: `var(--rui-tone-${tone}-surface)`,
                color: `var(--rui-tone-${tone}-on)`,
              }}
            >
              {label}
            </span>
            <code className="text-xs font-body text-hushed">
              --rui-tone-{tone}-surface / --rui-tone-{tone}-on
            </code>
          </div>
        ))}
        <Swatch
          token="--rui-tone-selected-surface"
          note="Selected-row wash — a whisper, far paler than the positive surface."
        />
      </div>
    </div>
  ),
};

/** Radii + elevation — 0px squares, round pills, and the four soft shadows. */
export const RadiiAndElevation: Story = {
  render: () => (
    <div className="max-w-xl">
      <SectionTitle>Radii — square (0px) or pill, nothing in between</SectionTitle>
      <div className="flex items-center gap-rui-4">
        <div className="flex h-16 w-24 items-center justify-center rounded-square border border-bone bg-limestone text-xs font-body text-hushed">
          square
        </div>
        <div className="flex h-8 items-center rounded-pill bg-accent px-rui-3 text-xs font-heading text-ink">
          pill
        </div>
      </div>
      <SectionTitle>Elevation — soft shadows over hard borders</SectionTitle>
      <div className="flex flex-wrap gap-rui-6 pb-rui-4">
        <div className="flex h-20 w-32 items-center justify-center rounded-square bg-white text-xs font-body text-hushed shadow-card">
          shadow-card
        </div>
        <div className="flex h-20 w-32 items-center justify-center rounded-square bg-white text-xs font-body text-hushed shadow-popover">
          shadow-popover
        </div>
        <div className="flex h-20 w-32 items-center justify-center rounded-square bg-white text-xs font-body text-hushed shadow-glow">
          shadow-glow
        </div>
        <div className="flex h-8 w-32 items-center justify-center rounded-square bg-white text-xs font-body text-hushed shadow-key">
          shadow-key
        </div>
      </div>
    </div>
  ),
};

const SPACES = ['1', '2', '3', '4', '5', '6', '8'] as const;

/** The 4px spacing scale — rui-1 through rui-8. */
export const Spacing: Story = {
  render: () => (
    <div className="max-w-xl">
      <SectionTitle>Spacing (4px scale)</SectionTitle>
      <div className="flex flex-col gap-rui-2">
        {SPACES.map((step) => (
          <SpacingRow key={step} step={step} />
        ))}
      </div>
    </div>
  ),
};

function SpacingRow({ step }: { step: (typeof SPACES)[number] }) {
  const value = useResolvedToken(`--rui-space-${step}`);
  return (
    <div className="flex items-center gap-rui-3">
      <code className="w-28 flex-shrink-0 text-xs font-body text-hushed">--rui-space-{step}</code>
      <div className="h-4 bg-accent" style={{ width: `var(--rui-space-${step})` }} />
      <code className="text-xs font-body text-hushed">{value}</code>
    </div>
  );
}
