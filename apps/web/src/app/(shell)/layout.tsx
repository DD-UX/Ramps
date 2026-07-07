import type { PropsWithChildren } from 'react';

import { CommonSideMenu } from '@/features/common/components/CommonSideMenu';
import { CommonTopBar } from '@/features/common/components/CommonTopBar';
import { CommonTopBarSearch } from '@/features/common/components/CommonTopBarSearch';

/**
 * The common application shell shared by every non-detail page (bills list,
 * vendors, overview, …). It is a route-group layout, so any page placed under
 * `app/(shell)/` inherits this frame for free — the persistent SideMenu on the
 * left, the TopBar with the general search across the top, and a scrollable
 * `<main>` for the page body. Detail views live in a sibling `(detail)/` group
 * and deliberately opt out of this chrome.
 */
export default function ShellLayout({ children }: PropsWithChildren) {
  return (
    <>
      {/* Left: SideMenu (full viewport height) */}
      <CommonSideMenu />

      {/* Right: Top bar + main content column */}
      <div className="flex flex-1 flex-col overflow-auto">
        <CommonTopBar>
          <CommonTopBarSearch />
        </CommonTopBar>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </>
  );
}
