import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { month: "January", datastream_1: 186, datastream_2: 80 },
  { month: "February", datastream_1: 305, datastream_2: 200 },
  { month: "March", datastream_1: 237, datastream_2: 120 },
  { month: "April", datastream_1: 73, datastream_2: 190 },
  { month: "May", datastream_1: 209, datastream_2: 130 },
  { month: "June", datastream_1: 214, datastream_2: 140 },
];

const chartConfig = {
  datastream_1: {
    label: "Datastream 1",
    color: "var(--chart-5)",
  },
  datastream_2: {
    label: "Datastream 2",
    color: "var(--chart-1)",
  },
};

export function BarChartWidget({ previewMode = false }) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-[150px] min-w-[150px]">
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
        <Bar dataKey="datastream_1" fill={chartConfig.datastream_1.color} radius={4} />
        <Bar dataKey="datastream_2" fill={chartConfig.datastream_2.color} radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
