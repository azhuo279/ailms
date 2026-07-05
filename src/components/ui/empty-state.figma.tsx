import figma from "@figma/code-connect/react";
import { AlertTriangle, PackageX, SearchX, ShieldAlert } from "lucide-react";
import { EmptyState } from "./empty-state";

// "no-data" / "filtered-empty" / "permission-empty" / "first-run" all render the
// illustrated, layered-ring composition — that is the `variant="default"` (the
// prop's default value, passed explicitly here for clarity now that a second
// variant exists). The ring illustration + staggered entrance are intrinsic to
// the component at this variant and are not separately exposed as props.
figma.connect(
  EmptyState,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-239",
  {
    variant: { Variant: "no-data" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <EmptyState variant="default" title={title} description={description} />
    ),
  },
);

figma.connect(
  EmptyState,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-239",
  {
    variant: { Variant: "filtered-empty" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <EmptyState variant="default" icon={<SearchX />} title={title} description={description} />
    ),
  },
);

figma.connect(
  EmptyState,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-239",
  {
    variant: { Variant: "permission-empty" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <EmptyState variant="default" icon={<ShieldAlert />} title={title} description={description} />
    ),
  },
);

figma.connect(
  EmptyState,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-239",
  {
    variant: { Variant: "first-run" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <EmptyState variant="default" icon={<PackageX />} title={title} description={description} />
    ),
  },
);

// "error" renders the flat, unanimated treatment — no rings, no stagger, a
// single quick fade on a danger-toned icon well. Reserve for genuine failures
// (a failed request, a load error), never for a merely-empty-but-fine state.
figma.connect(
  EmptyState,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=52-239",
  {
    variant: { Variant: "error" },
    props: {
      title: figma.string("title"),
      description: figma.string("description"),
    },
    example: ({ title, description }) => (
      <EmptyState variant="error" icon={<AlertTriangle />} title={title} description={description} />
    ),
  },
);
