import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A multiple line chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80, laptop: 120 },
  { month: "February", desktop: 305, mobile: 200, laptop: 150 },
  { month: "March", desktop: 237, mobile: 120, laptop: 140 },
  { month: "April", desktop: 73, mobile: 190, laptop: 170 },
  { month: "May", desktop: 209, mobile: 130, laptop: 130 },
  { month: "June", desktop: 214, mobile: 140, laptop: 110 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-4)",
  },
  laptop: {
    label: "Laptop",
    color: "var(--chart-3)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-1)",
  },
};

export function LineChartWidget({ previewMode = false }) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <LineChart
        data={chartData}
        width={undefined}
        height={undefined}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        {!previewMode && (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            tickCount={5}
          />
        )}
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Line
          dataKey="desktop"
          type="monotone"
          stroke={chartConfig.desktop.color}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="mobile"
          type="monotone"
          stroke={chartConfig.mobile.color}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="laptop"
          type="monotone"
          stroke={chartConfig.laptop.color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
