import figma from "@figma/code-connect/react";
import { ProgressTracker } from "./progress-tracker";

/**
 * The Figma mirror ("Progress Tracker Step") models a single step
 * indicator's states (Complete/Current/Upcoming/Error) — `ProgressTracker`
 * composes a `steps` array with no static Figma equivalent, so the example
 * wires a representative 4-step journey.
 */
figma.connect(
  ProgressTracker,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=41-188",
  {
    example: () => (
      <ProgressTracker
        steps={[
          { id: "1", label: "Shipment details", status: "complete" },
          { id: "2", label: "Carrier & rate", status: "current" },
          { id: "3", label: "Documents", status: "upcoming" },
        ]}
      />
    ),
  },
);
