'use client';

import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode,useId, useState } from 'react';

/**
 * Accordion — the expand/collapse rows from the virtual-card panel
 * (product-overview snapshot 13: "Pay with Ramp Card · Pay automatically /
 * Create a single-use virtual card number you can use for this bill").
 *
 * Vetted from the frame at 3x zoom: a WHITE row with a heading-weight ink
 * title, a hushed one-line subtitle directly under it, a thin caret on the
 * far right (pointing up while open), and a single bone hairline under the
 * row. Sharp corners, no card chrome — the row IS the surface.
 *
 * Compound: `<Accordion>` is the stack (it draws the hairlines),
 * `<AccordionItem>` owns one row + its content. Content animates height
 * 0 ↔ auto with Motion; `mode="wait"` per the house rule.
 */
export interface AccordionProps {
  children: ReactNode;
  className?: string;
}

export function Accordion({ children, className }: AccordionProps) {
  return <div className={clsx('flex flex-col bg-white', className)}>{children}</div>;
}

export interface AccordionItemProps {
  /** Heading-weight ink line — e.g. "Pay with Ramp Card · Pay automatically". */
  title: ReactNode;
  /** Hushed one-liner under the title (optional). */
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
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

  return (
    <div className={clsx('border-b border-bone', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-rui-4 px-rui-4 py-rui-3 text-left"
      >
        <span className="flex min-w-0 flex-col">
          <span className="font-heading text-sm text-ink">{title}</span>
          {subtitle && <span className="text-sm text-hushed">{subtitle}</span>}
        </span>
        {/* One caret, rotated by state — the frame shows a THIN stroke. */}
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="shrink-0 text-ink"
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
            className="overflow-hidden"
          >
            <div className="px-rui-4 pb-rui-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
