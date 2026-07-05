import figma from "@figma/code-connect/react";
import { PriorityTierBadge } from "./priority-tier-badge";

/**
 * Mirror page: "PriorityTierBadge" (its own page in the design-system file,
 * per architect law 5). Variant property is `tier` (T1/T2/T3/T4), matching
 * the React prop 1:1.
 *
 * NOTE: mapping registration is pending — this file follows the same
 * committed-template pattern as badge.figma.tsx / tag.figma.tsx, but as of
 * this writing the design-system file has never been published as a Figma
 * library (0 published components via the Files API), so `add_code_connect_map`
 * currently fails with "Published component not found." Publishing is a
 * manual Figma UI action (Assets panel) that no API/plugin surface can
 * perform — this is a pre-existing gap shared by every component in this
 * file, not specific to PriorityTierBadge. Once a human publishes the file,
 * re-run `add_code_connect_map` (or `npx figma connect publish`) to make
 * this mapping live.
 */
figma.connect(
  PriorityTierBadge,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=108-326",
  {
    props: {
      tier: figma.enum("tier", {
        T1: "T1",
        T2: "T2",
        T3: "T3",
        T4: "T4",
      }),
    },
    example: ({ tier }) => <PriorityTierBadge tier={tier} />,
  },
);
