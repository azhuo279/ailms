import figma from "@figma/code-connect/react";
import { TimePicker } from "./time-picker";

figma.connect(
  TimePicker,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-289",
  {
    props: {
      disabled: figma.boolean("disabled"),
      readOnly: figma.boolean("readOnly"),
      status: figma.enum("Status", {
        default: "default",
        invalid: "invalid",
        warning: "warning",
        success: "success",
      }),
    },
    example: ({ disabled, readOnly, status }) => (
      <TimePicker
        label="Dock appointment"
        value={null}
        onChange={() => {}}
        disabled={disabled}
        readOnly={readOnly}
        status={status}
      />
    ),
  },
);
