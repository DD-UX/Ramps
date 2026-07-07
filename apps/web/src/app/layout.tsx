// globals.css imports @ramps/ui/theme.css, which pulls in Tailwind + the
// --rui-* token sheet. One import, whole design system.
import './globals.css';

import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

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
 */
export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="flex h-dvh min-h-dvh flex-row overflow-hidden">{children}</body>
    </html>
  );
}
