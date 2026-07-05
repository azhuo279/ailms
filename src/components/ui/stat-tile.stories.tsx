import type { Meta, StoryObj } from "@storybook/nextjs";
import { StatTile, type StatTileBucket, type StatTileComparisonBar } from "./stat-tile";

const RISING: StatTileBucket[] = [
  { heightPercent: 44 },
  { heightPercent: 52 },
  { heightPercent: 48 },
  { heightPercent: 60 },
  { heightPercent: 66 },
  { heightPercent: 74 },
  { heightPercent: 88 },
];

const FALLING: StatTileBucket[] = [
  { heightPercent: 90 },
  { heightPercent: 82 },
  { heightPercent: 85 },
  { heightPercent: 70 },
  { heightPercent: 62 },
  { heightPercent: 50 },
  { heightPercent: 40 },
];

const FLAT: StatTileBucket[] = [
  { heightPercent: 52 },
  { heightPercent: 50 },
  { heightPercent: 54 },
  { heightPercent: 51 },
  { heightPercent: 53 },
  { heightPercent: 50 },
  { heightPercent: 52 },
];

const meta: Meta<typeof StatTile> = {
  title: "UI/StatTile",
  component: StatTile,
  parameters: {
    layout: "padded",
  },
  args: {
    label: "On-Time Delivery Rate",
    value: "94.2%",
    tone: "default",
    trend: {
      direction: "up",
      isFavorable: true,
      narrative: "1.8 points better than last week",
      periodLabel: "Last 7 days",
    },
    weeklyBuckets: RISING,
  },
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "intransit", "delivered", "delayed", "pending"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StatTile>;

/** Default: a favorable metric where "up" is the good direction. */
export const Default: Story = {};

/**
 * The influencer brief's core case: a fleet/ops metric where "down" is
 * favorable. The arrow-independent `isFavorable` flag (not `direction`)
 * drives the success color here, even though the raw change is a decrease.
 */
export const FavorableDown: Story = {
  args: {
    label: "Delayed Shipments",
    value: 37,
    tone: "delayed",
    trend: {
      direction: "down",
      isFavorable: true,
      narrative: "12 fewer delayed shipments than last week",
      periodLabel: "Last 7 days",
    },
    weeklyBuckets: FALLING,
  },
};

/**
 * The inverse pairing: a raw increase that is bad news for this metric
 * (average transit time getting longer). Confirms color renders as danger
 * even though the arithmetic direction is "up", same as `FavorableDown`
 * confirms success on a "down" change.
 */
export const UnfavorableUp: Story = {
  args: {
    label: "Avg Transit Time",
    value: "3.4 days",
    tone: "default",
    trend: {
      direction: "up",
      isFavorable: false,
      narrative: "0.3 days slower than last week",
      periodLabel: "Last 7 days",
    },
    weeklyBuckets: [
      { heightPercent: 40 },
      { heightPercent: 44 },
      { heightPercent: 50 },
      { heightPercent: 58 },
      { heightPercent: 64 },
      { heightPercent: 72 },
      { heightPercent: 82 },
    ],
  },
};

/** No meaningfully favorable or unfavorable reading — neutral narrative tone. */
export const Flat: Story = {
  args: {
    label: "Fuel Cost / Mile",
    value: "$0.61",
    tone: "default",
    trend: {
      direction: "flat",
      narrative: "Roughly flat vs last week",
      periodLabel: "Last 7 days",
    },
    weeklyBuckets: FLAT,
  },
};

/** Legacy shape: no trend/sparkline data, falls back to a plain hint caption. */
export const HintOnly: Story = {
  args: {
    label: "Pending",
    value: 34,
    tone: "pending",
    trend: undefined,
    weeklyBuckets: undefined,
    hint: "Awaiting pickup",
  },
};

export const Delivered: Story = {
  args: {
    label: "Delivered",
    value: 542,
    tone: "delivered",
    trend: {
      direction: "up",
      isFavorable: true,
      narrative: "6.4% more than last week",
      periodLabel: "Last 7 days",
    },
    weeklyBuckets: [
      { heightPercent: 50 },
      { heightPercent: 48 },
      { heightPercent: 55 },
      { heightPercent: 60 },
      { heightPercent: 66 },
      { heightPercent: 74 },
      { heightPercent: 86 },
    ],
  },
};

/**
 * StatTileComparisonBar sub-pattern (Direction C + Direction B's track-wrap height, see
 * inventor-workspace/stat-tile-comparison-bar-20260705-192504-0zly22-directions.html) — a
 * sibling to the weekly sparkline for point-in-time planned-vs-predicted comparisons (e.g.
 * an ETA delta), not a trend over time. `weeklyBuckets` is omitted on every story below
 * since `comparisonBar` takes over the value/hint/trend slots entirely.
 */
const COMPARISON_LATE: StatTileComparisonBar = {
  plannedLabel: "14:10",
  predictedLabel: "14:50",
  plannedPercent: 28,
  predictedPercent: 72,
  state: "unfavorable",
  phraseLead: "Predicted late by 40 min",
  phraseDetail: "±40 min",
  asOf: "as of 14:32",
};

const COMPARISON_EARLY: StatTileComparisonBar = {
  plannedLabel: "09:30",
  predictedLabel: "09:12",
  plannedPercent: 62,
  predictedPercent: 30,
  state: "favorable",
  phraseLead: "Predicted early by 18 min",
  phraseDetail: "±15 min",
  asOf: "as of 08:54",
};

const COMPARISON_ONTIME: StatTileComparisonBar = {
  plannedLabel: "11:00",
  predictedLabel: "11:04",
  plannedPercent: 50,
  predictedPercent: 53,
  state: "ontime",
  phraseLead: "On time",
  phraseDetail: "within ±5 min",
  asOf: "as of 10:41",
};

/** Unfavorable reading: predicted meaningfully later than planned. Primary F-16 demo case. */
export const ComparisonBarUnfavorable: Story = {
  args: {
    label: "ETA Delta · Shipment 44821",
    value: undefined,
    tone: "default",
    trend: undefined,
    weeklyBuckets: undefined,
    comparisonBar: COMPARISON_LATE,
  },
};

/** Favorable reading: predicted meaningfully earlier than planned. */
export const ComparisonBarFavorable: Story = {
  args: {
    label: "ETA Delta · Shipment 51203",
    value: undefined,
    tone: "default",
    trend: undefined,
    weeklyBuckets: undefined,
    comparisonBar: COMPARISON_EARLY,
  },
};

/** On-time reading: negligible delta, delta segment and confidence halo both collapse. */
export const ComparisonBarOnTime: Story = {
  args: {
    label: "ETA Delta · Shipment 60110",
    value: undefined,
    tone: "default",
    trend: undefined,
    weeklyBuckets: undefined,
    comparisonBar: COMPARISON_ONTIME,
  },
};
