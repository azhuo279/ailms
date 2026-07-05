import figma from "@figma/code-connect/react";
import { Chart } from "./chart";
import type { ChartSeries } from "./chart";

/**
 * The Figma mirror renders a static bar-chart mockup (recharts renders
 * live in the browser, not in Figma), so all four variants map to the same
 * `Chart` component with representative data — only the loading/empty
 * states differ meaningfully in props.
 */
const data = [
  { day: "Mon", shipments: 42, exceptions: 3 },
  { day: "Tue", shipments: 51, exceptions: 5 },
  { day: "Wed", shipments: 47, exceptions: 2 },
  { day: "Thu", shipments: 58, exceptions: 6 },
  { day: "Fri", shipments: 63, exceptions: 4 },
  { day: "Sat", shipments: 39, exceptions: 1 },
  { day: "Sun", shipments: 28, exceptions: 1 },
];

const series: ChartSeries[] = [
  { key: "shipments", label: "Shipments" },
  { key: "exceptions", label: "Exceptions" },
];

figma.connect(
  Chart,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=56-275",
  {
    variant: { State: "rendered" },
    example: () => <Chart type="bar" data={data} series={series} xKey="day" />,
  },
);

figma.connect(
  Chart,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=56-275",
  {
    variant: { State: "hover-datapoint" },
    example: () => <Chart type="bar" data={data} series={series} xKey="day" />,
  },
);

figma.connect(
  Chart,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=56-275",
  {
    variant: { State: "loading" },
    example: () => <Chart type="bar" data={[]} series={series} xKey="day" isLoading />,
  },
);

figma.connect(
  Chart,
  "https://www.figma.com/design/TLm314jvknL38gEyMCoB3u?node-id=56-275",
  {
    variant: { State: "empty" },
    example: () => <Chart type="bar" data={[]} series={series} xKey="day" />,
  },
);
