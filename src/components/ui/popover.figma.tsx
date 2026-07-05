import figma from "@figma/code-connect/react";
import { Popover, PopoverTitle, PopoverBody } from "./popover";

/**
 * The Figma mirror's "Content" variant (default / rich-content) maps to
 * PopoverBody's children — code's Popover always requires a live `trigger`
 * element, which the static mirror does not model.
 */
figma.connect(
  Popover,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=62-14",
  {
    variant: { Content: "default" },
    props: {
      title: figma.string("Title"),
      body: figma.string("Body"),
    },
    example: ({ title, body }) => (
      <Popover trigger={<button type="button">Trigger</button>}>
        <PopoverTitle>{title}</PopoverTitle>
        <PopoverBody>{body}</PopoverBody>
      </Popover>
    ),
  },
);

figma.connect(
  Popover,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=62-14",
  {
    variant: { Content: "rich-content" },
    props: {
      title: figma.string("Title"),
      body: figma.string("Body"),
    },
    example: ({ title, body }) => (
      <Popover trigger={<button type="button">Trigger</button>}>
        <PopoverTitle>{title}</PopoverTitle>
        <PopoverBody>
          <p>{body}</p>
          <a href="#">Learn more</a>
        </PopoverBody>
      </Popover>
    ),
  },
);
