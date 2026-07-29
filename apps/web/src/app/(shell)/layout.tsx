import type { PropsWithChildren } from 'react';

import { CommandPaletteTrigger } from '@/features/command-palette/components/CommandPaletteTrigger';
import { CommonSideMenu } from '@/features/common/components/CommonSideMenu';
import { CommonTopBar } from '@/features/common/components/CommonTopBar';

/**
 * The common application shell shared by every non-detail page (bills list,
 * vendors, overview, …). It is a route-group layout, so any page placed under
 * `app/(shell)/` inherits this frame for free — the persistent SideMenu on the
 * left, the TopBar with the general search across the top, and a scrollable
 * `<main>` for the page body. Detail views live in a sibling `(detail)/` group
 * and deliberately opt out of this chrome.
 *
 * The top bar's search is a TRIGGER, not a field: the palette it opens is
 * mounted at the ROOT layout instead, precisely because `(detail)/` skips this
 * frame and ⌘K has to work there too.
 */
export default function ShellLayout({ children }: PropsWithChildren) {
  return (
    <>
      {/* Left: SideMenu (full viewport height) */}
      <CommonSideMenu />

      {/* Right: Top bar + main content column.
          `scrollbar-gutter: stable` reserves the scrollbar's width WHETHER OR
          NOT one is showing. Without it, any change in page height (switching a
          Bills tab from 12 rows to 3, an empty state replacing a table) toggles
          the scrollbar, which resizes this column — and everything inside it,
          including the top bar's search field, jumps sideways. Reserving the
          gutter up front makes that shift structurally impossible. */}
      <div className="flex flex-1 [scrollbar-gutter:stable] flex-col overflow-auto">
        <CommonTopBar>
          <CommandPaletteTrigger />
        </CommonTopBar>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </>
  );
}
