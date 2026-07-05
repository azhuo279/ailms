import figma from "@figma/code-connect/react";
import { Accordion, AccordionItem } from "./accordion";

/**
 * Maps a single mirrored Accordion Item state to the `Accordion` +
 * `AccordionItem` composition — the Figma component set shows one item's
 * states in isolation, while code always composes items inside an
 * `Accordion` provider.
 */
figma.connect(
  AccordionItem,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-266",
  {
    variant: { State: "collapsed" },
    props: {
      title: figma.string("title"),
    },
    example: ({ title }) => (
      <Accordion>
        <AccordionItem id="item" title={title}>
          Panel content
        </AccordionItem>
      </Accordion>
    ),
  },
);

figma.connect(
  AccordionItem,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-266",
  {
    variant: { State: "expanded" },
    props: {
      title: figma.string("title"),
      body: figma.string("body"),
    },
    example: ({ title, body }) => (
      <Accordion defaultOpenIds={["item"]}>
        <AccordionItem id="item" title={title}>
          {body}
        </AccordionItem>
      </Accordion>
    ),
  },
);

figma.connect(
  AccordionItem,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-266",
  {
    variant: { State: "disabled" },
    props: {
      title: figma.string("title"),
    },
    example: ({ title }) => (
      <Accordion>
        <AccordionItem id="item" title={title} disabled>
          Panel content
        </AccordionItem>
      </Accordion>
    ),
  },
);
