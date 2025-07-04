import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
    color: "var(--chart-2)",
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

export function AreaChartWidget({previewMode = false}) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <AreaChart
        width={undefined}
        height={undefined}
        data={chartData}
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
          content={<ChartTooltipContent indicator="dot" />}
        />
        <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.7}
                />
                <stop
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.01}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.7}
                />
                <stop
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.01}
                />
              </linearGradient>
              <linearGradient id="fillLaptop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  stopColor="var(--color-laptop)"
                  stopOpacity={0.7}
                />
                <stop
                  stopColor="var(--color-laptop)"
                  stopOpacity={0.01}
                />
              </linearGradient>
            </defs>
        <Area
          dataKey="mobile"
          type="natural"
          fill="var(--color-mobile)"
          fillOpacity={0.15}
          stroke="var(--color-mobile)"
          stackId="a"
        />
        <Area
          dataKey="desktop"
          type="natural"
          fill="var(--color-desktop)"
          fillOpacity={0.15}
          stroke="var(--color-desktop)"
          stackId="a"
        />
        <Area
          dataKey="laptop"
          type="natural"
          fill="var(--color-laptop)"
          fillOpacity={0.15}
          stroke="var(--color-laptop)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
