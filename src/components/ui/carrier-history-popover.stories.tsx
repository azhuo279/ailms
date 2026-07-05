import type { Meta, StoryObj } from "@storybook/nextjs";
import { CarrierHistoryPopover } from "./carrier-history-popover";
import type { CarrierHistoryPoint } from "./carrier-history-popover";

const FAVORABLE_TREND: CarrierHistoryPoint[] = [
  { value: 62 },
  { value: 58 },
  { value: 67 },
  { value: 54 },
  { value: 60 },
  { value: 46 },
  { value: 50 },
  { value: 33 },
  { value: 42 },
  { value: 21 },
  { value: 29 },
  { value: 13 },
  { value: 8 },
  { value: 4 },
];

const UNFAVORABLE_TREND: CarrierHistoryPoint[] = [
  { value: 12 },
  { value: 16 },
  { value: 14 },
  { value: 22 },
  { value: 20 },
  { value: 30 },
  { value: 28 },
  { value: 40 },
  { value: 45 },
  { value: 58 },
  { value: 55 },
  { value: 68 },
  { value: 74 },
  { value: 82 },
];

/**
 * **CarrierHistoryPopover** — a composed pattern (Popover + inline SVG sparkline), not a
 * top-level primitive. Stage 1 opens a text-only stat list; the "View 90-day trend" row
 * expands the same popover surface downward in place to reveal an axis-free sparkline.
 * Direction-color (success/danger) lives on the trend chip and the sparkline stroke, since
 * this is a single, standalone instance, not a dense grid (see `StatTile` for the grid case).
 */
const meta: Meta<typeof CarrierHistoryPopover> = {
  title: "UI/CarrierHistoryPopover",
  component: CarrierHistoryPopover,
};

export default meta;
type Story = StoryObj<typeof CarrierHistoryPopover>;

export const Favorable: Story = {
  render: () => (
    <div className="flex justify-center p-16">
      <CarrierHistoryPopover
        carrierLane="Meridian Freight · PHX-LAX"
        stats={[
          { label: "On-time rate", value: "91.4%" },
          { label: "Prior exceptions", value: "6" },
          { label: "Avg. resolution time", value: "4.2 hrs" },
        ]}
        trend={{ direction: "up", isFavorable: true, label: "+4% vs. last 90 days" }}
        ninetyDayTrend={FAVORABLE_TREND}
        ninetyDayRateLabel="91.4%"
        className="w-80"
      />
    </div>
  ),
};

export const Unfavorable: Story = {
  render: () => (
    <div className="flex justify-center p-16">
      <CarrierHistoryPopover
        carrierLane="Ashfield Logistics · DEN-ORD"
        stats={[
          { label: "On-time rate", value: "78.6%" },
          { label: "Prior exceptions", value: "14" },
          { label: "Avg. resolution time", value: "9.8 hrs" },
        ]}
        trend={{ direction: "down", isFavorable: false, label: "-6% vs. last 90 days" }}
        ninetyDayTrend={UNFAVORABLE_TREND}
        ninetyDayRateLabel="78.6%"
        className="w-80"
      />
    </div>
  ),
};
