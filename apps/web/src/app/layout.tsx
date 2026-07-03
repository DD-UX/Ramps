// globals.css imports @ramps/ui/theme.css, which pulls in Tailwind + the
// --rui-* token sheet. One import, whole design system.
import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ramps — payables',
  description: 'Accounts payable, Ramp Bill Pay-inspired.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
