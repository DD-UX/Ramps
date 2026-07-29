'use client';

import { Kbd } from '@ramps/ui/Kbd';

import { CommonCommandKey } from '@/features/common/components/CommonCommandKey';

import { useCommandPalette } from '../context/CommandPalette.context';

/**
 * CommandPaletteTrigger — the top bar's search affordance, now a BUTTON that
 * opens the ⌘K palette.
 *
 * It replaces `CommonTopBarSearch`, which was a real `<input type="search">`
 * that ⌘K focused and that searched nothing: the most convincing dead control
 * in the shell, because it accepted your typing before ignoring it. A button
 * makes the same promise honestly — press it (or the chord it advertises) and
 * a search opens.
 *
 * It keeps the frame's LOOK exactly (vetted against
 * docs/…/snapshots/01-home-dashboard-left-nav.jpeg): a flat, borderless bar
 * across the top bar's flexible middle, keycaps leading on the left, "Search
 * for anything" beside them, no magnifying glass. Same `h-10`, same
 * `rounded-square`, same limestone fill as the Input it stands in for, so the
 * bar's rhythm is unchanged.
 *
 * The chord itself is NOT bound here. `CommandPaletteHost` owns it, because
 * the palette must open from the `(detail)/` routes too — which have no top
 * bar, and so no trigger. Binding it in both places would fire it twice.
 */
export interface CommandPaletteTriggerProps {
  /** Placeholder copy; defaults to the generic product-wide prompt. */
  placeholder?: string;
  className?: string;
}

export function CommandPaletteTrigger({
  placeholder = 'Search for anything',
  className,
}: CommandPaletteTriggerProps) {
  const { openPalette } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Search"
      aria-keyshortcuts="Meta+K Control+K"
      className={
        'gap-rui-2 rounded-square h-10 px-rui-3 bg-limestone text-hushed hover:bg-bone flex w-full items-center text-left transition-colors ' +
        (className ?? '')
      }
    >
      {/* Keycaps lead on the LEFT (⌘/Ctrl then K), matching the frame. */}
      <span className="gap-rui-1 flex shrink-0 items-center" aria-hidden>
        <CommonCommandKey />
        <Kbd>K</Kbd>
      </span>
      <span className="min-w-0 text-sm flex-1 truncate">{placeholder}</span>
    </button>
  );
}
