'use client';

import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type PropsWithChildren, type ReactNode, useId, useState } from 'react';

import { cn } from '../../lib/cn';

/**
 * Accordion — the expand/collapse rows from the virtual-card panel
 * (product-overview snapshot 13: "Pay with Ramp Card · Pay automatically /
 * Create a single-use virtual card number you can use for this bill").
 *
 * Vetted from the frame at 3x zoom + 1px sampling: a WHITE row with a
 * heading-weight ink title, a hushed one-line subtitle directly under it, a
 * thin caret on the far right (pointing up while open), and ONE full-width
 * hairline sitting BETWEEN the header row and its content (frame 13
 * y≈106–107; samples #e3e2de/#e4e4e4 → stone, not bone). The item WRAPPER
 * owns the stone box (1px all around); stacked items share a single
 * hairline via `[&+&]:border-t-0`, and the header/content separation is the
 * content region's own top border. Sharp corners, no card chrome — the row
 * IS the surface.
 *
 * Compound: `<Accordion>` is the stack, `<AccordionItem>` owns one row + its
 * content. Content animates height 0 ↔ auto with Motion; `mode="wait"` per
 * the house rule.
 */
export interface AccordionProps extends PropsWithChildren {
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={cn('bg-white flex flex-col', className)}>{children}</div>;
}

export interface AccordionItemProps extends PropsWithChildren {
  /** Heading-weight ink line — e.g. "Pay with Ramp Card · Pay automatically". */
  title: ReactNode;
  /** Hushed one-liner under the title (optional). */
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function AccordionItem({
  title,
  subtitle,
  defaultOpen = false,
  children,
  className,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  const wrapperClassName = cn('border border-stone [&+&]:border-t-0', className);

  return (
    <div className={wrapperClassName}>
      {/* The wrapper draws the stone box; the header button itself is
          borderless — the hairline between header and content (frame 13)
          is the region's own top border below. */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="gap-rui-4 px-rui-4 py-rui-3 flex w-full cursor-pointer items-center justify-between text-left"
      >
        <span className="min-w-0 flex flex-col">
          <span className="font-heading text-sm text-ink">{title}</span>
          {subtitle && <span className="text-sm text-hushed">{subtitle}</span>}
        </span>
        {/* One caret, rotated by state — the frame shows a THIN stroke. */}
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="text-ink shrink-0"
        >
          <ChevronDown size={16} strokeWidth={1.5} />
        </motion.span>
      </button>

      {/* mode="wait" (house rule) + height 0↔auto; overflow-hidden clips the
          content while the row breathes open/closed. */}
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <motion.div
            key="content"
            id={regionId}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-canvas p-rui-3 border-stone overflow-hidden border-t"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
