import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardPadding = "compact" | "default";

const PADDING_CLASSES: Record<CardPadding, string> = {
  compact: "p-3",
  default: "p-4",
};

export interface CardProps {
  children: ReactNode;
  /** Makes the whole card an interactive, keyboard-operable surface. */
  onClick?: () => void;
  selected?: boolean;
  /** Renders a loading overlay in place of content. */
  isLoading?: boolean;
  padding?: CardPadding;
  className?: string;
}

/**
 * Canonical Card — container for a single concept or object: summaries, KPI
 * modules, quick actions, or grouped detail blocks. Elevation reads via
 * `shadow-sm` on `bg-surface-raised`, never a darker fill (DESIGN.md
 * "Structured Depth"). Compose `CardHeader` / `CardBody` / `CardFooter` for
 * the standard header/body/footer layout, or pass raw `children` for a
 * simpler block.
 */
export function Card({ children, onClick, selected = false, isLoading = false, padding = "default", className }: CardProps) {
  const isInteractive = Boolean(onClick) && !isLoading;
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={isInteractive ? onClick : undefined}
      aria-busy={isLoading || undefined}
      className={cn(
        "relative w-full rounded-lg border bg-surface-raised text-left shadow-sm transition-shadow",
        selected ? "border-border-strong" : "border-border-subtle",
        isInteractive && "cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <div className={cn(PADDING_CLASSES[padding], isLoading && "invisible")}>{children}</div>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-surface-raised">
          <span className="size-5 animate-spin rounded-full border-2 border-border-subtle border-t-primary-700" aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </div>
      ) : null}
    </Component>
  );
}

export interface CardHeaderProps {
  children?: ReactNode;
  title?: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Leading media/icon slot. */
  media?: ReactNode;
  /** Trailing actions — icon buttons, a Menu trigger. */
  actions?: ReactNode;
  className?: string;
}

/** Card's header row: optional media, title/description stack, trailing actions. */
export function CardHeader({ children, title, description, media, actions, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {media ? <span className="flex shrink-0 items-center text-fg-secondary" aria-hidden="true">{media}</span> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title ? <h3 className="truncate text-heading-l font-semibold text-fg-primary">{title}</h3> : null}
        {description ? <p className="text-body-s text-fg-muted">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  );
}

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

/** Card's main content region — spaced from the header/footer. */
export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn("mt-3 text-body-m text-fg-secondary", className)}>{children}</div>;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/** Card's footer row — typically actions, aligned to the trailing edge. */
export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn("mt-4 flex items-center justify-end gap-2 border-t border-border-subtle pt-3", className)}>{children}</div>;
}
