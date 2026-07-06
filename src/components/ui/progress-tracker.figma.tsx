import figma from "@figma/code-connect/react";
import { ProgressTracker } from "./progress-tracker";

/**
 * The Figma mirror ("Progress Tracker Step") models a single step
 * indicator's states (Complete/Current/Upcoming/Blocked — renamed from the
 * prior "Error" to match the code's canonical `blocked` status) —
 * `ProgressTracker` composes a `steps` array with no static Figma
 * equivalent, so the example wires a representative "Ledger Stream"
 * journey. The page also carries two static reference frames — "Compact
 * stepper" and "Rich timeline" — showing the same steps assembled end to
 * end (connectors, source badges, detour panel); those frames document the
 * assembled component and are not themselves Code Connect targets.
 */
figma.connect(
  ProgressTracker,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=41-188",
  {
    variant: { State: "Complete" },
    example: () => (
      <ProgressTracker
        density="compact"
        steps={[
          { id: "1", label: "Shipment details", status: "complete" },
          { id: "2", label: "Carrier & rate", status: "current" },
          { id: "3", label: "Documents", status: "upcoming" },
        ]}
      />
    ),
  },
);

figma.connect(
  ProgressTracker,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=41-188",
  {
    variant: { State: "Blocked" },
    example: () => (
      <ProgressTracker
        density="rich"
        steps={[
          {
            id: "1",
            label: "Exception detected · ETA breach threshold",
            status: "complete",
            timestamp: "Jul 5, 08:12",
            actor: "SignalTrack · system-generated",
            detail:
              "Predicted ETA drifted 2h14m past the committed delivery window on lane DFW→ATL.",
          },
          {
            id: "2",
            label: "Delegated to Dispatcher",
            status: "complete",
            timestamp: "Jul 5, 08:41",
            actor: "R. Kwan (ZOM)",
            detail:
              "Handoff package sent to J. Torres with carrier contact and lane performance context pre-loaded.",
            detour: {
              message:
                'J. Torres: "Need updated pickup window before I can confirm with carrier."',
              timestamp: "Logged 09:05",
            },
          },
          {
            id: "3",
            label: "Awaiting outcome confirmation",
            status: "current",
            actor: "Pending · J. Torres",
          },
        ]}
      />
    ),
  },
);
