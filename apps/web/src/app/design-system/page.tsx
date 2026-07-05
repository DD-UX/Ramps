import type { Metadata } from 'next';

/**
 * /design-system — the in-app entry point to the design system.
 *
 * The full component workbench (Storybook) is built into public/storybook by
 * the web app's prebuild step, so it ships on the same deploy / same domain.
 * This page frames it and embeds it, so the running product hosts and
 * advertises its own design system — one URL, no second deploy.
 */
export const metadata: Metadata = {
  title: 'Design system — ramps',
  description: 'The Ramp-inspired design system: tokens + primitives, live in Storybook.',
};

export default function DesignSystemPage() {
  return (
    <main className="bg-limestone flex h-dvh flex-col">
      <header className="border-bone px-rui-4 py-rui-3 flex items-center justify-between border-b">
        <div>
          <h1 className="text-sm font-heading text-ink">Design system</h1>
          <p className="text-xs font-body text-hushed">
            Verified Ramp tokens + primitives, rendered live in Storybook.
          </p>
        </div>
        <a
          href="/storybook/index.html"
          target="_blank"
          rel="noreferrer"
          className="rounded-square bg-accent px-rui-4 py-rui-2 text-sm font-heading text-ink"
        >
          Open Storybook ↗
        </a>
      </header>
      {/* Embed the static Storybook build. If it hasn't been built yet the
          iframe 404s gracefully; the header link is the fallback. */}
      <iframe title="Storybook" src="/storybook/index.html" className="min-h-0 flex-1 border-0" />
    </main>
  );
}
