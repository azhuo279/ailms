import figma from "@figma/code-connect/react";
import { DatePicker } from "./date-picker";

figma.connect(
  DatePicker,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-193",
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
      <DatePicker
        label="Delivery date"
        value={null}
        onChange={() => {}}
        disabled={disabled}
        readOnly={readOnly}
        status={status}
      />
    ),
  },
);
