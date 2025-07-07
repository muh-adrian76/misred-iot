import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
const chartData = [
  { label: "Datastream 1", value: 275, fill: "var(--color-datastream_1)" },
  { label: "Datastream 2", value: 200, fill: "var(--color-datastream_2)" },
  { label: "Datastream 3", value: 287, fill: "var(--color-datastream_3)" },
  { label: "Datastream 4", value: 173, fill: "var(--color-datastream_4)" },
  { label: "Datastream 5", value: 190, fill: "var(--color-datastream_5)" },
];

const chartConfig = {
  value: {
    label: "value",
  },
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
  datastream_4: {
    label: "Datastream 4",
    color: "var(--chart-4)",
  },
  datastream_5: {
    label: "Datastream 5",
    color: "var(--chart-5)",
  },
};

export function PieChartWidget({previewMode}) {
  const totalvalue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, []);

  return (
    <ChartContainer
      config={chartConfig}
      className="h-full w-full"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="label"
          innerRadius={30}
          strokeWidth={5}
        >
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 5}
                      className="fill-foreground text-sm font-bold"
                    >
                      {totalvalue.toLocaleString()}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 10}
                      className="fill-muted-foreground text-xs"
                    >
                      Total
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
