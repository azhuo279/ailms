import figma from "@figma/code-connect/react";
import { Tag } from "./tag";

/**
 * Non-dismissible configuration (Dismissible=false variant in the Figma
 * component set).
 */
figma.connect(
  Tag,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=48-193",
  {
    variant: { Dismissible: "false" },
    props: {
      label: figma.string("label"),
      tone: figma.enum("Tone", {
        neutral: "neutral",
        success: "success",
        warning: "warning",
        danger: "danger",
      }),
    },
    example: ({ label, tone }) => <Tag tone={tone}>{label}</Tag>,
  },
);

/**
 * Dismissible configuration (Dismissible=true variant) — renders the
 * trailing remove control and requires an `onRemove` callback.
 */
figma.connect(
  Tag,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=48-193",
  {
    variant: { Dismissible: "true" },
    props: {
      label: figma.string("label"),
      tone: figma.enum("Tone", {
        neutral: "neutral",
        success: "success",
        warning: "warning",
        danger: "danger",
      }),
    },
    example: ({ label, tone }) => (
      <Tag tone={tone} onRemove={() => {}}>
        {label}
      </Tag>
    ),
  },
);
