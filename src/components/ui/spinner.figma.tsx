import figma from "@figma/code-connect/react";
import { Spinner } from "./spinner";

figma.connect(
  Spinner,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=59-256",
  {
    props: {
      size: figma.enum("Size", {
        sm: "sm",
        md: "md",
        lg: "lg",
      }),
    },
    example: ({ size }) => <Spinner size={size} />,
  },
);
