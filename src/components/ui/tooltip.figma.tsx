import figma from "@figma/code-connect/react";
import { Tooltip } from "./tooltip";

/**
 * The Figma mirror renders the tooltip bubble standalone (no live trigger),
 * since Code Connect examples can't express the hover/focus-driven trigger
 * relationship — code's `Tooltip` always wraps a trigger element and shows
 * the bubble conditionally. This mapping documents the bubble's content and
 * placement only.
 */
figma.connect(
  Tooltip,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=61-18",
  {
    props: {
      placement: figma.enum("Placement", {
        top: "top",
        bottom: "bottom",
        left: "left",
        right: "right",
      }),
      content: figma.string("Label"),
    },
    example: ({ placement, content }) => (
      <Tooltip placement={placement} content={content}>
        <button type="button">Trigger</button>
      </Tooltip>
    ),
  },
);
