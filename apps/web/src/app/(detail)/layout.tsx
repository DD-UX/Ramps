import type { PropsWithChildren } from 'react';

/**
 * The frame shared by every detail view (a single bill, a single vendor, …).
 *
 * Detail entities deliberately opt out of the `(shell)` chrome: no SideMenu, no
 * global search — a focused, full-bleed white surface. This shared layout owns
 * only what *all* detail views have in common (the surface itself); each entity
 * nests its own segment layout (e.g. `bills/[id]/layout.tsx`) inside it for the
 * concern that's specific to that entity, such as where "back" returns to.
 */
export default function DetailLayout({ children }: PropsWithChildren) {
  return <div className="bg-white flex flex-1 flex-col overflow-auto">{children}</div>;
}
