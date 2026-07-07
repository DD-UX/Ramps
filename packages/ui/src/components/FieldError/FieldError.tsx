import { cn } from '../../lib/cn';

/**
 * FieldError — the one destructive-toned message block shown beneath a control
 * (or any surface) when something is wrong.
 *
 * A tiny, tokens-only primitive extracted so no consumer hand-rolls
 * `role="alert" … text-destructive` again: `FieldInput` renders its validation
 * lines through it, and one-off surfaces (a failed save banner, a form-level
 * error) get the same voice for free. It accepts either a single message or a
 * list — mirroring react-hook-form's `error.message` (`string | string[]`) and
 * zod's `flatten().fieldErrors[name]` — and renders one line each, announced
 * together as a single `role="alert"` group.
 *
 * Colour is the design system's **orange** `destructive` token (never a raw
 * red). Empty/whitespace-only messages are filtered out, so an empty list
 * renders nothing at all (the caller need not guard).
 */
export interface FieldErrorProps {
  /** One message, a list of messages, or nullish (renders nothing). */
  children?: string | string[] | null;
  /**
   * Stable id so a field can point `aria-describedby` at this group. Omit for a
   * standalone error that nothing else references.
   */
  id?: string;
  /** Text size — `xs` beneath a compact field (default), `sm` for a standalone. */
  size?: 'xs' | 'sm';
  className?: string;
}

/** Normalise `string | string[] | null` to a clean, non-empty list. */
function toMessages(children: FieldErrorProps['children']): string[] {
  const list = Array.isArray(children) ? children : children != null ? [children] : [];
  return list.filter((message) => message.trim() !== '');
}

export function FieldError({ children, id, size = 'xs', className }: FieldErrorProps) {
  const messages = toMessages(children);
  if (messages.length === 0) return null;

  return (
    <div
      id={id}
      role="alert"
      data-testid="field-error"
      className={cn(
        'font-body text-destructive gap-rui-1 flex flex-col',
        size === 'sm' ? 'text-sm' : 'text-xs',
        className,
      )}
    >
      {messages.map((message, index) => (
        <span key={`${message}-${index}`}>{message}</span>
      ))}
    </div>
  );
}
