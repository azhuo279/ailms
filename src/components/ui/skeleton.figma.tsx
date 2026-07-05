import figma from "@figma/code-connect/react";
import { Skeleton } from "./skeleton";

figma.connect(
  Skeleton,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=60-16",
  {
    props: {
      variant: figma.enum("Variant", {
        line: "line",
        block: "block",
        avatar: "avatar",
        card: "card",
        "table-row": "table-row",
      }),
    },
    example: ({ variant }) => <Skeleton variant={variant} />,
  },
);
