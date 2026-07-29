// globals.css imports @ramps/ui/theme.css, which pulls in Tailwind + the
// --rui-* token sheet. One import, whole design system.
import './globals.css';

import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

import { CommandPaletteHost } from '@/features/command-palette/components/CommandPaletteHost';
import { CommandPaletteProvider } from '@/features/command-palette/context/CommandPalette.context';
import { SwrProvider } from '@/features/common/context/SwrProvider.context';

export const metadata: Metadata = {
  title: 'Ramps — payables',
  description: 'Accounts payable, Ramp Bill Pay-inspired.',
};

/**
 * The root layout owns only the document shell — `<html>` + `<body>` and the
 * global stylesheet. It is intentionally chrome-free so route groups can pick
 * their own frame: `(shell)/` adds the persistent SideMenu + TopBar for the
 * list/overview pages, while `(detail)/` gives each detail entity its own
 * focused layout. Both compose *inside* this body.
 *
 * The ⌘K palette is the one piece of chrome that lives HERE rather than in a
 * group. It has to outrank the split: the bill detail pages opt out of the
 * shell, and they are exactly where jumping to another bill is most useful, so
 * a shell-mounted palette would be missing from its best screen.
 */
export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="flex h-dvh min-h-dvh flex-row overflow-hidden">
        <SwrProvider>
          <CommandPaletteProvider>
            {/* Rendered BEFORE the page. Both the palette and the DS Modal sit
                at `z-50`, so DOM order is the tie-break: a page-level dialog —
                the unsaved-changes gate the palette's own links can trip —
                must be able to layer over it. */}
            <CommandPaletteHost />
            {children}
          </CommandPaletteProvider>
        </SwrProvider>
      </body>
    </html>
  );
}
