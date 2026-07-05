import type { ReactNode } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export type AvatarSize = "sm" | "md" | "lg";
export type AvatarPresence = "online" | "away" | "offline";

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-6 text-footnote",
  md: "size-8 text-label-s",
  lg: "size-10 text-label-l",
};

const ICON_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
};

const PRESENCE_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
};

const PRESENCE_CLASSES: Record<AvatarPresence, string> = {
  online: "bg-success-emphasis",
  away: "bg-warning-emphasis",
  offline: "bg-fg-muted",
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export interface AvatarProps {
  /** Full name — drives the initials fallback and the accessible label. */
  name?: string;
  /** Image URL. Falls back to initials (from `name`), then a generic icon. */
  src?: string;
  size?: AvatarSize;
  presence?: AvatarPresence;
  className?: string;
}

/**
 * Canonical Avatar — represents a person or group in assignment,
 * collaboration, approval, or ownership patterns. Falls back from image to
 * initials to a generic icon. Pair presence with text at small sizes, since
 * a status dot alone can be hard to perceive.
 */
export function Avatar({ name, src, size = "md", presence, className }: AvatarProps) {
  const initials = name ? initialsFrom(name) : "";

  return (
    <span className={cn("relative inline-flex shrink-0", SIZE_CLASSES[size], className)}>
      <span
        role={name ? "img" : undefined}
        aria-label={name}
        className={cn(
          "flex size-full items-center justify-center overflow-hidden rounded-full bg-surface-sunken font-medium text-fg-secondary",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name ?? ""} className="size-full object-cover" />
        ) : initials ? (
          <span aria-hidden="true">{initials}</span>
        ) : (
          <User className={ICON_SIZE_CLASSES[size]} aria-hidden="true" />
        )}
      </span>
      {presence ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-surface-raised",
            PRESENCE_SIZE_CLASSES[size],
            PRESENCE_CLASSES[presence],
          )}
        />
      ) : null}
    </span>
  );
}

export interface AvatarGroupProps {
  children: ReactNode;
  /** Caps the number of visible avatars, showing a "+N" overflow indicator. */
  max?: number;
  size?: AvatarSize;
  className?: string;
}

/** Overlapping stack of Avatars for compact multi-assignee display. */
export function AvatarGroup({ children, max, size = "md", className }: AvatarGroupProps) {
  const items = Array.isArray(children) ? children : [children];
  const visible = max ? items.slice(0, max) : items;
  const overflow = max && items.length > max ? items.length - max : 0;

  return (
    <span className={cn("flex items-center -space-x-2", className)}>
      {visible.map((child, index) => (
        <span key={index} className="rounded-full ring-2 ring-surface-raised">
          {child}
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-surface-sunken font-medium text-fg-secondary ring-2 ring-surface-raised",
            SIZE_CLASSES[size],
          )}
        >
          +{overflow}
        </span>
      ) : null}
    </span>
  );
}
