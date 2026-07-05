import figma from "@figma/code-connect/react";
import { Card, CardHeader } from "./card";

/**
 * Maps the component-set's flattened title/description text to Card +
 * CardHeader composition, since the Figma mirror renders a single card
 * shape while code composes Card from CardHeader/CardBody/CardFooter
 * sub-parts. `StatTile` (src/components/ui/stat-tile.tsx) is a narrower,
 * fixed-content variant of this same Card and is not mapped separately —
 * it inherits Card's elevation/radius/border treatment internally.
 */
figma.connect(
  Card,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-206",
  {
    variant: { State: "default" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <Card>
        <CardHeader title={title} description={description} />
      </Card>
    ),
  },
);

figma.connect(
  Card,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-206",
  {
    variant: { State: "selected" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <Card selected onClick={() => {}}>
        <CardHeader title={title} description={description} />
      </Card>
    ),
  },
);

figma.connect(
  Card,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-206",
  {
    variant: { State: "loading" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <Card isLoading>
        <CardHeader title={title} description={description} />
      </Card>
    ),
  },
);
