import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Compile the workspace design system / SDK from source (no prebuilt step
  // needed in dev). Turbopack resolves the TS directly.
  transpilePackages: ['@ramps/ui', '@ramps/sdk', '@ramps/schemas'],

  /**
   * `/` → `/bills`. Bill Pay IS the product here, so the root has no separate
   * home of its own to render — it just hands you the app.
   *
   * Done at the ROUTING layer rather than as a `page.tsx` calling `redirect()`
   * on purpose: this resolves before any React work happens, so the first
   * impression is Bill Pay itself and not a shell that renders, throws a
   * redirect, and re-renders. `permanent: false` (307) keeps the mapping out of
   * the browser's permanent cache, so a real home page can claim `/` later.
   */
  async redirects() {
    return [{ source: '/', destination: '/bills', permanent: false }];
  },
};

export default nextConfig;
