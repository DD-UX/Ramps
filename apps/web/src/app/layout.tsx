// globals.css imports @ramps/ui/theme.css, which pulls in Tailwind + the
// --rui-* token sheet. One import, whole design system.
import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CommonSideMenu } from '@/features/common/components/CommonSideMenu';
import { CommonTopBar } from '@/features/common/components/CommonTopBar';

export const metadata: Metadata = {
  title: 'ramps — payables',
  description: 'Accounts payable, Ramp Bill Pay-inspired.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-dvh min-h-dvh flex-row overflow-hidden">
        {/* Left: SideMenu (full viewport height) */}
        <CommonSideMenu />

        {/* Right: Top bar + main content column */}
        <div className="flex flex-1 flex-col overflow-auto">
          <CommonTopBar />
          <main className="flex flex-1 flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
