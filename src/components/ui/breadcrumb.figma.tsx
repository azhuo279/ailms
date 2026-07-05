import figma from "@figma/code-connect/react";
import { Breadcrumb } from "./breadcrumb";

/**
 * The Figma mirror shows the crumb row's states (default, focus-visible,
 * current-item-only) — `items` is a data array with no direct Figma property
 * equivalent, so the example wires a representative 3-level trail.
 */
figma.connect(
  Breadcrumb,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=40-129",
  {
    variant: { State: "Default" },
    example: () => (
      <Breadcrumb
        items={[
          { label: "Orders", href: "/orders" },
          { label: "Shipment #4471829", href: "/orders/4471829" },
          { label: "Proof of delivery" },
        ]}
      />
    ),
  },
);
