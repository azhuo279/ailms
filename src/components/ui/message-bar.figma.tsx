import figma from "@figma/code-connect/react";
import { MessageBar } from "./message-bar";

figma.connect(
  MessageBar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=63-70",
  {
    variant: { Dismissible: "false" },
    props: {
      severity: figma.enum("Severity", {
        info: "info",
        success: "success",
        warning: "warning",
        error: "error",
      }),
      title: figma.string("Title"),
      body: figma.string("Body"),
    },
    example: ({ severity, title, body }) => (
      <MessageBar severity={severity} title={title}>
        {body}
      </MessageBar>
    ),
  },
);

figma.connect(
  MessageBar,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=63-70",
  {
    variant: { Dismissible: "true" },
    props: {
      severity: figma.enum("Severity", {
        info: "info",
        success: "success",
        warning: "warning",
        error: "error",
      }),
      title: figma.string("Title"),
      body: figma.string("Body"),
    },
    example: ({ severity, title, body }) => (
      <MessageBar severity={severity} title={title} onDismiss={() => {}}>
        {body}
      </MessageBar>
    ),
  },
);
