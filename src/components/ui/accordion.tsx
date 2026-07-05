"use client";

import { createContext, useContext, useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openIds: Set<string>;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface AccordionProps {
  children: ReactNode;
  /** Allows more than one item open at once. Defaults to single-open. */
  multiple?: boolean;
  /** Uncontrolled default-open item id(s). */
  defaultOpenIds?: string[];
  className?: string;
}

/**
 * Canonical Accordion — progressively discloses sections on a page to
 * reduce scrolling, especially in dense detail views and settings groups.
 * Use for show/hide sections, not hierarchy — for hierarchy, use Tree View.
 */
export function Accordion({ children, multiple = false, defaultOpenIds = [], className }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenIds));

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) {
        if (multiple) next.delete(id);
        // single-open mode: toggling the already-open item closes it (next stays empty)
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openIds, toggle }}>
      <div className={cn("flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  id: string;
  title: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** A single collapsible section within an Accordion. */
export function AccordionItem({ id, title, children, disabled = false, className }: AccordionItemProps) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used within an Accordion");
  const { openIds, toggle } = ctx;
  const isOpen = openIds.has(id);
  const panelId = useId();
  const headerId = useId();

  return (
    <div className={cn("bg-surface-raised first:rounded-t-lg last:rounded-b-lg", className)}>
      <h3 className="m-0">
        <button
          type="button"
          id={headerId}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => !disabled && toggle(id)}
          className={cn(
            "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-body-m font-medium text-fg-primary transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
            !disabled && "hover:bg-option-hover",
            disabled && "cursor-not-allowed text-fg-disabled",
          )}
        >
          <span>{title}</span>
          <ChevronDown
            aria-hidden="true"
            className={cn("size-4 shrink-0 text-fg-muted transition-transform", isOpen && "rotate-180")}
          />
        </button>
      </h3>
      {isOpen ? (
        <div id={panelId} role="region" aria-labelledby={headerId} className="px-4 pb-4 text-body-s text-fg-secondary">
          {children}
        </div>
      ) : null}
    </div>
  );
}
