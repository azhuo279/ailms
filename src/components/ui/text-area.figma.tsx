import figma from "@figma/code-connect/react";
import { TextArea } from "./text-area";

figma.connect(
  TextArea,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-169",
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
      <TextArea
        label="Exception notes"
        status={status}
        disabled={disabled}
        helperText="Describe the exception in detail."
      />
    ),
  },
);
