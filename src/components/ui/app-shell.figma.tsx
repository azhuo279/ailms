import figma from "@figma/code-connect/react";
import { AppShell } from "./app-shell";

/**
 * The Figma mirror only demonstrates the default/scrolled visual states of
 * the top bar — `topBarStart` / `topBarEnd` / `children` are React slots with
 * no Figma property equivalent, so the example wires representative content.
 */
figma.connect(
  AppShell,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=45-215",
  {
    variant: { State: "Default" },
    example: () => (
      <AppShell topBarStart={<h2>Shipments</h2>} topBarEnd={null}>
        <div>{/* page content */}</div>
      </AppShell>
    ),
  },
);
