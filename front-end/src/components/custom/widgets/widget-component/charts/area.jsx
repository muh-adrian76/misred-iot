import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", datastream_1: 186, datastream_2: 80, datastream_3: 120 },
  { month: "February", datastream_1: 305, datastream_2: 200, datastream_3: 150 },
  { month: "March", datastream_1: 237, datastream_2: 120, datastream_3: 140 },
  { month: "April", datastream_1: 73, datastream_2: 190, datastream_3: 170 },
  { month: "May", datastream_1: 209, datastream_2: 130, datastream_3: 130 },
  { month: "June", datastream_1: 214, datastream_2: 140, datastream_3: 110 },
];

const chartConfig = {
  datastream_1: {
    label: "Datastream 1",
    color: "var(--chart-1)",
  },
  datastream_2: {
    label: "Datastream 2",
    color: "var(--chart-2)",
  },
  datastream_3: {
    label: "Datastream 3",
    color: "var(--chart-3)",
  },
};

export function AreaChartWidget({ previewMode = false }) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-[150px] min-w-[150px]">
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
          <linearGradient id="filldatastream_1" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--color-datastream_1)" stopOpacity={0.7} />
            <stop stopColor="var(--color-datastream_1)" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="filldatastream_2" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--color-datastream_2)" stopOpacity={0.7} />
            <stop stopColor="var(--color-datastream_2)" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="filldatastream_3" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="var(--color-datastream_3)" stopOpacity={0.7} />
            <stop stopColor="var(--color-datastream_3)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <Area
          dataKey="datastream_1"
          type="natural"
          fill="var(--color-datastream_1)"
          fillOpacity={0.15}
          stroke="var(--color-datastream_1)"
          stackId="a"
        />
        <Area
          dataKey="datastream_2"
          type="natural"
          fill="var(--color-datastream_2)"
          fillOpacity={0.15}
          stroke="var(--color-datastream_2)"
          stackId="a"
        />
        <Area
          dataKey="datastream_3"
          type="natural"
          fill="var(--color-datastream_3)"
          fillOpacity={0.15}
          stroke="var(--color-datastream_3)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
