"use client";

import {
  cloneElement,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuProps {
  /** Trigger element — must accept `onClick` and forward a ref (e.g. Button). */
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
}

interface MenuPosition {
  top: number;
  left: number;
  minWidth: number;
}

/**
 * Canonical Menu — a temporary surface of actions or options opened from a
 * trigger. Compose with `MenuItem`, `MenuGroup`, and `MenuSeparator`. Portals
 * to `document.body` so it escapes stacking/overflow traps.
 */
export function Menu({ trigger, children, align = "start", className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: align === "end" ? rect.right : rect.left,
      minWidth: rect.width,
    });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        (triggerRef.current as HTMLElement | null)?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  type TriggerProps = {
    onClick?: () => void;
    "aria-haspopup"?: string;
    "aria-expanded"?: boolean;
    ref?: (node: HTMLElement | null) => void;
  };

  const triggerElement = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<TriggerProps>, {
        onClick: () => setOpen((prev) => !prev),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
        },
      } as Partial<TriggerProps>)
    : trigger;

  return (
    <>
      {triggerElement}
      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: position.top,
                left: align === "end" ? undefined : position.left,
                right: align === "end" ? window.innerWidth - position.left : undefined,
                minWidth: position.minWidth,
              }}
              className={cn(
                "z-50 min-w-[10rem] overflow-hidden rounded-md border border-border-subtle bg-surface-overlay py-1 shadow-lg",
                className,
              )}
              onClick={() => setOpen(false)}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export interface MenuItemProps {
  children: ReactNode;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  /** Renders a trailing checkmark when true (checkbox/radio-style item). */
  checked?: boolean;
}

export function MenuItem({
  children,
  icon,
  onSelect,
  disabled = false,
  destructive = false,
  checked,
}: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-checked={checked}
      onClick={(e) => {
        if (disabled) {
          e.stopPropagation();
          return;
        }
        onSelect?.();
      }}
      className={cn(
        "flex h-9 w-full items-center gap-2 px-3 text-left text-body-m text-fg-primary transition-colors",
        "focus-visible:outline-none focus-visible:bg-option-hover",
        !disabled && "hover:bg-option-hover",
        disabled && "cursor-not-allowed text-fg-disabled",
        destructive && !disabled && "text-danger-fg hover:bg-danger-surface",
      )}
    >
      {icon ? (
        <span className="inline-flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {checked ? <Check className="size-4 shrink-0 text-primary-700" aria-hidden="true" /> : null}
    </button>
  );
}

export interface MenuGroupProps {
  label?: string;
  children: ReactNode;
}

export function MenuGroup({ label, children }: MenuGroupProps) {
  return (
    <div role="group" aria-label={label} className="py-1">
      {label ? (
        <p className="px-3 py-1 text-caption font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      ) : null}
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border-subtle" />;
}
