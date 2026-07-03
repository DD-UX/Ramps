/**
 * Tailwind v4 for Next.js is wired through PostCSS. The plugin scans class
 * usage across the app + the transpiled @ramps/ui components and compiles the
 * theme defined in @ramps/ui/theme.css (imported at the top of globals.css).
 */
const config = {
  plugins: ['@tailwindcss/postcss'],
};

export default config;
