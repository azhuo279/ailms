import figma from "@figma/code-connect/react";
import { StatTile } from "./stat-tile";

/**
 * The Figma mirror covers two content shapes on one "Stat Tile" page: the
 * basic label/value/hint tile, and the comparisonBar pattern (Direction C +
 * Direction B's track-wrap height, per the approved hybrid brief in
 * inventor-workspace/stat-tile-comparison-bar-20260705-192504-0zly22-directions.html).
 * `weeklyBuckets` (the sparkline pattern) has no static Figma mirror yet —
 * flagged as a gap.
 */
figma.connect(
  StatTile,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=125-341",
  {
    example: () => (
      <StatTile label="On-time rate" value="94.2%" hint="1.8 points better than last week" />
    ),
  },
);

figma.connect(
  StatTile,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=126-9",
  {
    example: () => (
      <StatTile
        label="ETA"
        value=""
        comparisonBar={{
          plannedLabel: "14:10",
          predictedLabel: "14:50",
          plannedPercent: 20,
          predictedPercent: 75,
          state: "unfavorable",
          phraseLead: "Predicted late by 40 min",
          phraseDetail: "±40 min",
          asOf: "as of 14:32",
        }}
      />
    ),
  },
);
