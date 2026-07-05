import figma from "@figma/code-connect/react";
import { Combobox } from "./combobox";

figma.connect(
  Combobox,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=28-143",
  {
    props: {
      placeholder: figma.string("placeholder"),
      multiple: figma.boolean("multiple"),
      isLoading: figma.boolean("isLoading"),
      disabled: figma.boolean("disabled"),
      readOnly: figma.boolean("readOnly"),
      status: figma.enum("Status", {
        default: "default",
        invalid: "invalid",
        warning: "warning",
        success: "success",
      }),
    },
    example: ({ placeholder, multiple, isLoading, disabled, readOnly, status }) => (
      <Combobox
        label="Warehouse"
        placeholder={placeholder}
        multiple={multiple}
        isLoading={isLoading}
        disabled={disabled}
        readOnly={readOnly}
        status={status}
        options={[
          { label: "Denver, CO — DEN3", value: "den3" },
          { label: "Reno, NV — RNO1", value: "rno1" },
        ]}
      />
    ),
  },
);
