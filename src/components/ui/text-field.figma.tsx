import figma from "@figma/code-connect/react";
import { TextField } from "./text-field";

figma.connect(
  TextField,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=27-118",
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
      <TextField
        label="Tracking number"
        required
        status={status}
        disabled={disabled}
        helperText="Enter the carrier-issued tracking ID."
      />
    ),
  },
);
