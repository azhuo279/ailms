import figma from "@figma/code-connect/react";
import { Badge } from "./badge";

figma.connect(
  Badge,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=47-186",
  {
    props: {
      label: figma.string("label"),
      tone: figma.enum("Tone", {
        neutral: "neutral",
        success: "success",
        warning: "warning",
        danger: "danger",
        intransit: "intransit",
        delivered: "delivered",
        delayed: "delayed",
        pending: "pending",
      }),
    },
    example: ({ label, tone }) => <Badge tone={tone}>{label}</Badge>,
  },
);
