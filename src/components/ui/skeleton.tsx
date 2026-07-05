import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SkeletonVariant = "line" | "block" | "avatar" | "card" | "table-row";

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  line: "h-3.5 w-full rounded-md",
  block: "h-24 w-full rounded-lg",
  avatar: "size-10 shrink-0 rounded-full",
  card: "h-40 w-full rounded-lg",
  "table-row": "h-9 w-full rounded-md",
};

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Content-shape variant. Defaults to a single text line. */
  variant?: SkeletonVariant;
  className?: string;
}

/**
 * Canonical Skeleton — a placeholder that mirrors the shape of the content
 * about to load, used on container/data surfaces (cards, tables, lists),
 * not on toasts, dropdown options, or a modal's own shell. Compose several
 * `Skeleton` elements to approximate a card, row, or list-item layout.
 */
export function Skeleton({ variant = "line", className, ...rest }: SkeletonProps) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-surface-sunken",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    />
  );
}
