import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * `cn` — the design system's single className resolver.
 *
 * `clsx` alone (what every primitive used before) only *concatenates* strings;
 * it has no idea that `bg-accent` and `bg-white` are the same CSS property, so a
 * consumer-passed `className` never actually overrides the variant's base — the
 * winner falls out of CSS source order, not intent. `tailwind-merge` fixes that
 * by keeping only the LAST class in each conflicting group.
 *
 * We `extend` the default merge so it understands this system's bespoke scales
 * that ride on the `--rui-*` theme bridge (theme.css):
 *  - the `rui-*` SPACING scale (`--spacing-rui-1…8`) is registered on the theme
 *    so every padding/margin/gap/inset group knows `px-rui-3` and `px-rui-2`
 *    conflict (→ `px-rui-2` wins). Without this, tailwind-merge sees `rui-3` as
 *    an unknown value and lets BOTH survive — the exact bug we're fixing.
 *  - `rounded-square` / `rounded-pill` are the ONLY two border-radius values, so
 *    they live in one conflict group (`rounded-square` then `rounded-pill` →
 *    `rounded-pill` wins), replacing Tailwind's numeric radii.
 *
 * Colour utilities (`bg-accent`, `text-ink`, `border-bone`, …) map onto the
 * standard `bg`/`text`/`border` groups by prefix and dedupe out of the box.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      // The additive 4px `rui-*` spacing scale (theme.css `--spacing-rui-*`).
      // Registering it here lets padding/margin/gap/space/inset groups treat
      // `rui-2` as a real value, so `px-rui-3 px-rui-2` collapses to the last.
      spacing: ['rui-1', 'rui-2', 'rui-3', 'rui-4', 'rui-5', 'rui-6', 'rui-8'],
    },
    classGroups: {
      // Collapse the custom radius names into ONE border-radius group so
      // `rounded-square` and `rounded-pill` conflict (and the last one wins),
      // instead of both surviving into the output.
      rounded: [{ rounded: ['square', 'pill'] }],
    },
  },
});

export type { ClassValue };

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
