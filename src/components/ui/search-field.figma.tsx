import figma from "@figma/code-connect/react";
import { SearchField } from "./search-field";

figma.connect(
  SearchField,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=29-23",
  {
    props: {
      isLoading: figma.boolean("isLoading"),
      disabled: figma.boolean("disabled"),
      status: figma.enum("Status", {
        default: "default",
        invalid: "invalid",
        warning: "warning",
        success: "success",
      }),
    },
    example: ({ isLoading, disabled, status }) => (
      <SearchField
        aria-label="Search"
        placeholder="Search shipments, carriers, IDs..."
        isLoading={isLoading}
        disabled={disabled}
        status={status}
      />
    ),
  },
);
