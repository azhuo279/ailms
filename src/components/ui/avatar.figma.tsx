import figma from "@figma/code-connect/react";
import { Avatar } from "./avatar";

/**
 * Initials-fallback configuration (Fallback=initials variant).
 */
figma.connect(
  Avatar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=50-200",
  {
    variant: { Fallback: "initials" },
    props: {
      name: figma.string("initials"),
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
    },
    example: ({ name, size }) => <Avatar name={name} size={size} />,
  },
);

/**
 * Generic-icon fallback configuration (Fallback=icon variant) — renders
 * when no `name` is available to derive initials from.
 */
figma.connect(
  Avatar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=50-200",
  {
    variant: { Fallback: "icon" },
    props: {
      size: figma.enum("Size", { sm: "sm", md: "md", lg: "lg" }),
    },
    example: ({ size }) => <Avatar size={size} />,
  },
);
