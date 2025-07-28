import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function BarChartWidget({
  previewMode = false,
  widget,
  timeRange = "1h",
  dataCount = "100",
  filterType = "time",
}) {
  // Preview mode dengan data dummy
  if (previewMode) {
    const dummyData = [
      { month: "January", datastream_1: 186, datastream_2: 80 },
      { month: "February", datastream_1: 305, datastream_2: 200 },
      { month: "March", datastream_1: 237, datastream_2: 120 },
      { month: "April", datastream_1: 73, datastream_2: 190 },
      { month: "May", datastream_1: 209, datastream_2: 130 },
      { month: "June", datastream_1: 214, datastream_2: 140 },
    ];

    const previewChartConfig = {
      datastream_1: {
        label: "Datastream 1",
        color: "var(--chart-1)",
      },
      datastream_2: {
        label: "Datastream 2",
        color: "var(--chart-2)",
      },
    };

    return (
      <div className="h-full w-full min-h-[150px] min-w-[250px] space-y-2">
        <ChartContainer config={previewChartConfig} className="h-full w-full">
          <BarChart
            accessibilityLayer
            data={dummyData}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar
              dataKey="datastream_1"
              fill={previewChartConfig.datastream_1.color}
              radius={4}
            />
            <Bar
              dataKey="datastream_2"
              fill={previewChartConfig.datastream_2.color}
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </div>
    );
  }

  // Safety check
  if (!widget) {
    return (
      <div className="h-full w-full min-h-[150px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Widget tidak tersedia</p>
        </div>
      </div>
    );
  }

  // Ambil inputs dari widget (prioritas: inputs -> datastream_ids -> fallback)
  const pairs =
    Array.isArray(widget?.inputs) && widget.inputs.length > 0
      ? widget.inputs
      : Array.isArray(widget?.datastream_ids) &&
          widget.datastream_ids.length > 0
        ? widget.datastream_ids
        : widget?.datastream_id && widget?.device_id
          ? [
              {
                device_id: widget.device_id,
                datastream_id: widget.datastream_id,
              },
            ]
          : [];

  // Use real-time data hook (update agar bisa ambil banyak pair)
  const {
    timeSeriesData,
    latestValue,
    isLoading,
    error,
    isValidWidget,
    isRealTimeConnected,
    timeRangeLabel,
    legendData,
  } = useWidgetData(widget, timeRange, dataCount, filterType, pairs);

  // Generate dynamic chart config based on pairs
  const dynamicChartConfig = pairs.reduce((config, pair, idx) => {
    const dataKey = `value_${pair.device_id}_${pair.datastream_id}`;
    const legendItem = legendData?.[idx];
    const label = legendItem
      ? `${legendItem.device_name} - ${legendItem.sensor_name}`
      : `Device ${pair.device_id} - Sensor ${pair.datastream_id}`;

    config[dataKey] = {
      label: label,
      color: chartColors[idx % chartColors.length],
    };
    return config;
  }, {});

  // Preview mode dengan data dummy
  if (previewMode) {
    const dummyData = [
      { time: "10:00", value: 186 },
      { time: "11:00", value: 305 },
      { time: "12:00", value: 237 },
      { time: "13:00", value: 73 },
      { time: "14:00", value: 209 },
      { time: "15:00", value: 214 },
    ];

    return (
      <ChartContainer
        config={chartConfig}
        className="h-full w-full min-h-[150px] min-w-[150px]"
      >
        <BarChart
          data={dummyData}
          width={undefined}
          height={undefined}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            tickCount={5}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
        </BarChart>
      </ChartContainer>
    );
  }

  // Validasi widget
  if (!isValidWidget) {
    return (
      <div className="h-full w-full min-h-[150px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Widget tidak valid</p>
          <p className="text-xs text-muted-foreground">
            Device atau datastream tidak ditemukan
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full min-h-[150px] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat data sensor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full w-full min-h-[150px] flex items-center justify-center bg-destructive/10 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-destructive">Gagal memuat data</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // No data state - show empty chart with message
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="h-full w-full min-h-[150px] space-y-2">
        {/* Header dengan info tidak ada data */}
        <div className="px-2 pt-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">
                {widget?.description || "Widget Chart"}: tidak ada data dalam{" "}
                {timeRangeLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isRealTimeConnected && (
                <div className="flex items-center gap-1 text-xs text-orange-500">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Offline
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty Chart */}
        <ChartContainer config={dynamicChartConfig} className="h-full w-full">
          <BarChart
            accessibilityLayer
            data={[]} // Empty data untuk chart kosong
            width={undefined}
            height={undefined}
            margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={5}
              tickCount={4}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Render bars untuk setiap pair meski data kosong */}
            {pairs.map((pair, idx) => (
              <Bar
                key={idx}
                dataKey={`value_${pair.device_id}_${pair.datastream_id}`}
                fill={chartColors[idx % chartColors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[150px] space-y-2">
      {/* Header dengan info widget */}
      <div className="px-2 pt-2">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">
              {widget?.description || "Widget Chart"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {latestValue?.timeAgo || timeRangeLabel}
            </p>
            {isRealTimeConnected && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={dynamicChartConfig} className="h-full w-full">
        <BarChart
          accessibilityLayer
          data={timeSeriesData}
          width={undefined}
          height={undefined}
          margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            tickCount={4}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          {/* Render satu Bar untuk setiap pair */}
          {pairs.map((pair, idx) => (
            <Bar
            key={idx}
            dataKey={`value_${pair.device_id}_${pair.datastream_id}`}
            fill={chartColors[idx % chartColors.length]}
            radius={[4, 4, 0, 0]}
            />
          ))}
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
