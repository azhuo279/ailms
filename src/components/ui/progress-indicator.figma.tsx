import figma from "@figma/code-connect/react";
import { ProgressIndicator } from "./progress-indicator";

figma.connect(
  ProgressIndicator,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=66-19",
  {
    variant: { Variant: "determinate" },
    props: {
      label: figma.string("Label"),
      value: figma.number("Value"),
    },
    example: ({ label, value }) => <ProgressIndicator variant="determinate" label={label} value={value} />,
  },
);

figma.connect(
  ProgressIndicator,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=66-19",
  {
    variant: { Variant: "indeterminate" },
    props: {
      label: figma.string("Label"),
    },
    example: ({ label }) => <ProgressIndicator variant="indeterminate" label={label} />,
  },
);
