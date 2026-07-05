import figma from "@figma/code-connect/react";
import { Field } from "./field";

figma.connect(
  Field,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=25-41",
  {
    props: {
      required: figma.boolean("required"),
      optional: figma.boolean("optional"),
    },
    example: ({ required, optional }) => (
      <Field label="Tracking number" required={required} optional={optional}>
        {({ inputId }) => <input id={inputId} />}
      </Field>
    ),
  },
);
