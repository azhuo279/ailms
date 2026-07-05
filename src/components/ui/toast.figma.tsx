import figma from "@figma/code-connect/react";
import { Toast } from "./toast";

/**
 * Maps the presentational `Toast` shell only — `ToastProvider`/`useToast`
 * (the imperative queueing infrastructure) has no Figma representation,
 * since it renders no static UI of its own. `ClusterCard` (the collapsed
 * multi-toast accordion header) is a distinct composed pattern with no prop
 * parity to `Toast` and has no Code Connect mapping of its own — see the
 * "ClusterCard" component on this same Figma page for its static mirror.
 */
figma.connect(
  Toast,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=65-42",
  {
    variant: { Content: "basic" },
    props: {
      severity: figma.enum("Severity", {
        info: "info",
        success: "success",
        warning: "warning",
        error: "error",
      }),
      title: figma.string("Title"),
      description: figma.string("Description"),
    },
    example: ({ severity, title, description }) => (
      <Toast severity={severity} title={title} description={description} />
    ),
  },
);

figma.connect(
  Toast,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=65-42",
  {
    variant: { Content: "countdown" },
    props: {
      severity: figma.enum("Severity", {
        info: "info",
        success: "success",
        warning: "warning",
        error: "error",
      }),
      title: figma.string("Title"),
      description: figma.string("Description"),
      countdownLabel: figma.string("Countdown"),
    },
    example: ({ severity, title, description, countdownLabel }) => (
      <Toast
        severity={severity}
        title={title}
        description={description}
        countdownLabel={countdownLabel}
      />
    ),
  },
);
