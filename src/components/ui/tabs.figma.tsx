import figma from "@figma/code-connect/react";
import { Tabs } from "./tabs";

/**
 * The Figma mirror currently exposes only the `State` variant axis
 * (Active/Inactive/Disabled/Focus-visible) on the underline style — it does
 * not yet cross the `variant` (underline/pill) or `size` (sm/md/lg) axes as
 * separate Figma variants. The example below defaults to the code
 * component's own defaults for those props; extend the Figma variant set
 * before mapping them here.
 */
figma.connect(
  Tabs,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=41-133",
  {
    variant: { State: "Active" },
    example: () => (
      <Tabs
        items={[
          { value: "details", label: "Details" },
          { value: "documents", label: "Documents" },
          { value: "history", label: "History" },
        ]}
        value="documents"
        onChange={() => {}}
      />
    ),
  },
);
