import figma from "@figma/code-connect/react";
import { NumberField } from "./number-field";

figma.connect(
  NumberField,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-269",
  {
    props: {
      status: figma.enum("Status", {
        default: "default",
        invalid: "invalid",
        warning: "warning",
        success: "success",
        disabled: "default",
      }),
      disabled: figma.enum("Status", {
        default: false,
        invalid: false,
        warning: false,
        success: false,
        disabled: true,
      }),
    },
    example: ({ status, disabled }) => (
      <NumberField
        label="Pallet count"
        value={12}
        onChange={() => {}}
        status={status}
        disabled={disabled}
        helperText="Pallet count for this shipment."
      />
    ),
  },
);
