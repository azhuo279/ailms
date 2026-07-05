import figma from "@figma/code-connect/react";
import { Select } from "./select";

figma.connect(
  Select,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-59",
  {
    props: {
      placeholder: figma.string("placeholder"),
      required: figma.boolean("required"),
      disabled: figma.boolean("disabled"),
      readOnly: figma.boolean("readOnly"),
      status: figma.enum("Status", {
        default: "default",
        invalid: "invalid",
        warning: "warning",
        success: "success",
      }),
    },
    example: ({ placeholder, required, disabled, readOnly, status }) => (
      <Select
        label="Carrier"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        status={status}
        options={[
          { label: "FedEx Freight", value: "fedex" },
          { label: "UPS Ground", value: "ups" },
        ]}
      />
    ),
  },
);
