import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Compile the workspace design system / SDK from source (no prebuilt step
  // needed in dev). Turbopack resolves the TS directly.
  transpilePackages: ['@ramps/ui', '@ramps/sdk', '@ramps/schemas'],
};

export default nextConfig;
