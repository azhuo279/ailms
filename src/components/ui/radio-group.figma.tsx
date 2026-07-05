import figma from "@figma/code-connect/react";
import { RadioGroup } from "./radio-group";

figma.connect(
  RadioGroup,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-19",
  {
    props: {
      disabled: figma.boolean("disabled"),
      invalid: figma.boolean("invalid"),
      readOnly: figma.boolean("readOnly"),
    },
    example: ({ disabled, invalid, readOnly }) => (
      <RadioGroup
        name="delivery-speed"
        label="Delivery speed"
        disabled={disabled}
        invalid={invalid}
        readOnly={readOnly}
        options={[
          { label: "Standard delivery", value: "standard" },
          { label: "Expedited delivery", value: "expedited" },
        ]}
      />
    ),
  },
);
