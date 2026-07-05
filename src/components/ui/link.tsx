import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import NextLink from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** Renders an external-link icon and forces target=_blank + rel safety. */
  external?: boolean;
  /** Inline within a text run — no independent block spacing implied. */
  inline?: boolean;
  /** Marks the link visually as visited (rarely needed in app UI). */
  visited?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

/**
 * Canonical Link — use for navigation to another page, route, section, or
 * external resource. Use Button instead if the intent is an action.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, external = false, inline = false, visited = false, disabled = false, className, children, ...props },
  ref,
) {
  const content = (
    <span
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1",
        "rounded-sm text-link underline-offset-2 hover:text-link-hover hover:underline",
        inline ? "inline" : "inline-flex items-center gap-1",
        visited && "text-fg-secondary",
        disabled && "pointer-events-none text-fg-disabled no-underline",
        className,
      )}
    >
      {children}
      {external ? <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /> : null}
    </span>
  );

  if (disabled) {
    return (
      <a
        ref={ref}
        aria-disabled="true"
        className="pointer-events-none"
        {...props}
      >
        {content}
      </a>
    );
  }

  if (external) {
    return (
      <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }

  return (
    <NextLink ref={ref} href={href} {...props}>
      {content}
    </NextLink>
  );
});
