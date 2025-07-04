import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-5)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-1)",
  },
};

export function BarChartWidget({ previewMode = false }) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart
        data={chartData}
        width={undefined}
        height={undefined}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
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
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar dataKey="desktop" fill={chartConfig.desktop.color} radius={4} />
        <Bar dataKey="mobile" fill={chartConfig.mobile.color} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
