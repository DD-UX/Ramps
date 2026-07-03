import { clsx } from 'clsx';

/**
 * Tabs — the lifecycle shell navigation: Overview · Drafts · For approval ·
 * For payment · History (docs/watch-youtube/README.md §1). Controlled: the
 * parent owns the active value (it maps to a route segment in the app). An
 * optional per-tab `count` renders the "N" badge the For-approval tab shows.
 *
 * Presentational only — routing/state live in the app; this draws the bar.
 */
export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onValueChange, className }: TabsProps) {
  return (
    <div role="tablist" className={clsx('flex items-center gap-rui-4 border-b border-bone', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange?.(tab.value)}
            className={clsx(
              'relative -mb-px inline-flex items-center gap-rui-2 border-b-2 px-rui-1 py-rui-3 text-sm font-heading',
              active
                ? 'border-ink text-ink'
                : 'border-transparent text-hushed hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'rounded-pill px-rui-2 text-xs font-body',
                  active ? 'bg-ink text-limestone' : 'bg-limestone text-hushed',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
