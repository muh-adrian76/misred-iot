import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A multiple line chart";

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
    color: "var(--chart-4)",
  },
  datastream_2: {
    label: "Datastream 2",
    color: "var(--chart-1)",
  },
  datastream_3: {
    label: "Datastream 3",
    color: "var(--chart-3)",
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
          dataKey="datastream_1"
          type="monotone"
          stroke={chartConfig.datastream_1.color}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="datastream_2"
          type="monotone"
          stroke={chartConfig.datastream_2.color}
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="datastream_3"
          type="monotone"
          stroke={chartConfig.datastream_3.color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
