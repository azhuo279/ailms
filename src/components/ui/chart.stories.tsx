import type { Meta, StoryObj } from "@storybook/nextjs";
import { Chart, ChartFrame, CHART_STATUS_COLORS } from "./chart";
import type { ChartSeries } from "./chart";

const TREND_DATA = [
  { day: "Mon", shipments: 42, exceptions: 3 },
  { day: "Tue", shipments: 51, exceptions: 5 },
  { day: "Wed", shipments: 47, exceptions: 2 },
  { day: "Thu", shipments: 58, exceptions: 6 },
  { day: "Fri", shipments: 63, exceptions: 4 },
  { day: "Sat", shipments: 39, exceptions: 1 },
  { day: "Sun", shipments: 28, exceptions: 1 },
];

const trendSeries: ChartSeries[] = [
  { key: "shipments", label: "Shipments" },
  { key: "exceptions", label: "Exceptions" },
];

const STATUS_DATA = [
  { week: "W1", intransit: 120, delivered: 340, delayed: 12, pending: 40 },
  { week: "W2", intransit: 132, delivered: 355, delayed: 9, pending: 33 },
  { week: "W3", intransit: 118, delivered: 362, delayed: 18, pending: 29 },
  { week: "W4", intransit: 145, delivered: 371, delayed: 6, pending: 25 },
];

const statusSeries: ChartSeries[] = [
  { key: "intransit", label: "In transit", color: CHART_STATUS_COLORS.intransit },
  { key: "delivered", label: "Delivered", color: CHART_STATUS_COLORS.delivered },
  { key: "delayed", label: "Delayed", color: CHART_STATUS_COLORS.delayed },
  { key: "pending", label: "Pending", color: CHART_STATUS_COLORS.pending },
];

/**
 * **Chart** — thin, token-bound wrapper around recharts for KPIs, trends,
 * throughput, dwell time, SLA adherence, and exception rates. Every chart
 * ships a legend and a tooltip, direct-labeling identity so it is never
 * color-alone. Reuses `--color-status-*` for shipment-status series and a
 * flagged placeholder categorical sequence otherwise (see DESIGN.md §3).
 */
const meta: Meta<typeof Chart> = {
  title: "UI/Chart",
  component: Chart,
};

export default meta;
type Story = StoryObj<typeof Chart>;

export const LineChart: Story = {
  render: () => <Chart type="line" data={TREND_DATA} series={trendSeries} xKey="day" className="w-[560px]" />,
};

export const BarChartStory: Story = {
  name: "Bar chart",
  render: () => <Chart type="bar" data={TREND_DATA} series={trendSeries} xKey="day" className="w-[560px]" />,
};

export const AreaChartStory: Story = {
  name: "Area chart",
  render: () => <Chart type="area" data={TREND_DATA} series={trendSeries} xKey="day" className="w-[560px]" />,
};

export const StatusSeries: Story = {
  render: () => <Chart type="bar" data={STATUS_DATA} series={statusSeries} xKey="week" className="w-[560px]" />,
};

export const SingleSeriesNoLegend: Story = {
  render: () => (
    <Chart
      type="line"
      data={TREND_DATA}
      series={[{ key: "shipments", label: "Shipments" }]}
      xKey="day"
      hideLegend
      className="w-[560px]"
    />
  ),
};

export const Loading: Story = {
  render: () => <Chart type="line" data={[]} series={trendSeries} xKey="day" isLoading className="w-[560px]" />,
};

export const Empty: Story = {
  render: () => (
    <Chart
      type="line"
      data={[]}
      series={trendSeries}
      xKey="day"
      emptyMessage="No shipments recorded for the selected range."
      className="w-[560px]"
    />
  ),
};

export const WithFrame: Story = {
  render: () => (
    <ChartFrame title="Weekly throughput" description="Shipments dispatched vs. exceptions raised" className="w-[560px]">
      <Chart type="area" data={TREND_DATA} series={trendSeries} xKey="day" />
    </ChartFrame>
  ),
};
