import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ListProps {
  children: ReactNode;
  /** Tightens vertical rhythm for information-dense contexts. */
  dense?: boolean;
  /** Renders a visible divider between items instead of relying on spacing alone. */
  segmented?: boolean;
  className?: string;
}

/**
 * Canonical List — vertically stacked, independent, quick-to-scan items.
 * Good for task queues, alerts, stops, or recent activity. If data needs
 * columns that relate to one another, use Data Table instead; if hierarchy
 * matters, use Tree View instead.
 */
export function List({ children, dense = false, segmented = false, className }: ListProps) {
  return (
    <ul
      role="list"
      className={cn(
        "flex flex-col",
        segmented ? "divide-y divide-border-subtle" : dense ? "gap-0.5" : "gap-1",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export interface ListItemProps {
  children?: ReactNode;
  /** Leading visual — icon, Avatar, or status dot. */
  leadingVisual?: ReactNode;
  /** Primary label. */
  title?: ReactNode;
  /** Supporting text under the title. */
  supportingText?: ReactNode;
  /** Trailing action — icon button, Badge, or menu trigger. */
  trailingAction?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  dense?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * A single List row. Pass `onClick` to make the row interactive (button
 * semantics, keyboard-operable); omit it for a static display row.
 *
 * ### Icon-forward two-line row (status-per-row convention)
 *
 * For rows that need to carry per-item status/urgency (document checklists,
 * readiness checks, escalation queues), use this content pattern with the
 * existing slots. No new props are needed.
 *
 * - **`leadingVisual`**: a 16x16 (`size-4`) status icon from `lucide-react`,
 *   colored via `currentColor` on a `text-*` utility so the icon inherits
 *   its semantic color. Map icon shape and color to state:
 *   - success (present/resolved) uses `CheckCircle2`, `text-success-emphasis`
 *   - warning (pending/at-risk) uses `Clock`, `text-warning-emphasis`
 *   - danger (missing/breached) uses `AlertCircle`, `text-severity-emphasis`
 *   - muted (on-track/informational) uses `Clock`, `text-fg-muted`
 * - **`title`**: primary label. Already styled `text-body-m font-medium
 *   text-fg-primary`, single-line truncated.
 * - **`supportingText`**: either plain supporting copy, or a composite
 *   metadata line (SLA-tier label plus separator dot plus countdown) built
 *   as a `<span>` with nested `<span>`s. Separator dot is colored
 *   `text-border-strong` (e.g. a `·` character or a small rounded dot).
 *   Countdown is colored per state:
 *   - danger (overdue/breached) uses `text-severity-fg` (e.g. "overdue 12m")
 *   - warning (breaching soon) uses `text-warning-fg` (e.g. "breaches in 22m")
 *   - neutral (on-track) uses `text-fg-muted` (e.g. "3h 10m left")
 *   Render the countdown as plain colored text only. No meter, ring, or bar.
 * - **`trailingAction`**: reserve for a status `Badge` only where a discrete
 *   final-state label adds information the icon doesn't already carry (e.g.
 *   a document checklist's "Present" / "Incomplete" / "Missing"). Omit
 *   entirely when the leading icon and/or countdown text already communicate
 *   status on their own (e.g. readiness checklists, escalation queues). Do
 *   not add a badge just to fill the slot.
 *   For success/warning states use `Badge`'s own `tone="success"` /
 *   `tone="warning"`. `Badge` has no `severity` tone (its `danger` tone is
 *   reserved for form-validation per `DESIGN.md`, aliasing the same ramp for
 *   a different role), so for a true alert/exception state (e.g. "Missing")
 *   pass the severity tokens directly via `className`, e.g.
 *   `className="bg-severity-surface text-severity-fg"`, rather than reaching
 *   for `tone="danger"`.
 *
 * See `list.stories.tsx` (Document checklist / Warehouse readiness /
 * Escalation queue stories) for worked examples of all three shapes.
 */
export function ListItem({
  children,
  leadingVisual,
  title,
  supportingText,
  trailingAction,
  selected = false,
  disabled = false,
  dense = false,
  onClick,
  className,
}: ListItemProps) {
  const isInteractive = Boolean(onClick) && !disabled;
  const Component = onClick ? "button" : "div";

  const content = children ?? (
    <div className="flex min-w-0 flex-1 flex-col">
      {title ? <span className="truncate text-body-m font-medium text-fg-primary">{title}</span> : null}
      {supportingText ? <span className="truncate text-body-s text-fg-muted">{supportingText}</span> : null}
    </div>
  );

  return (
    <li role="listitem">
      <Component
        type={onClick ? "button" : undefined}
        disabled={onClick ? disabled : undefined}
        aria-current={selected || undefined}
        onClick={isInteractive ? onClick : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-md text-left transition-colors",
          dense ? "px-2 py-1.5" : "px-3 py-2.5",
          isInteractive && "cursor-pointer hover:bg-option-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
          selected && "bg-option-hover",
          disabled && "cursor-not-allowed text-fg-disabled [&_span]:text-fg-disabled",
          className,
        )}
      >
        {leadingVisual ? (
          <span className="flex shrink-0 items-center justify-center text-fg-secondary" aria-hidden="true">
            {leadingVisual}
          </span>
        ) : null}
        {content}
        {trailingAction ? <span className="flex shrink-0 items-center gap-2">{trailingAction}</span> : null}
      </Component>
    </li>
  );
}
