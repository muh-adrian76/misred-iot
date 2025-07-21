import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function AreaChartWidget({
  previewMode = false,
  widget,
  timeRange = "1h",
}) {
  // Preview mode dengan data dummy
  if (previewMode) {
    const dummyData = [
      {
        month: "January",
        datastream_1: 186,
        datastream_2: 80,
        datastream_3: 120,
      },
      {
        month: "February",
        datastream_1: 305,
        datastream_2: 200,
        datastream_3: 150,
      },
      {
        month: "March",
        datastream_1: 237,
        datastream_2: 120,
        datastream_3: 140,
      },
      {
        month: "April",
        datastream_1: 73,
        datastream_2: 190,
        datastream_3: 170,
      },
      { month: "May", datastream_1: 209, datastream_2: 130, datastream_3: 130 },
      {
        month: "June",
        datastream_1: 214,
        datastream_2: 140,
        datastream_3: 110,
      },
    ];

    const previewChartConfig = {
      datastream_1: {
        label: "Datastream 1",
        color: "var(--chart-1)",
      },
      datastream_2: {
        label: "Datastream 2",
        color: "var(--chart-5)",
      },
      datastream_3: {
        label: "Datastream 3",
        color: "var(--chart-3)",
      },
    };

    return (
      <div className="h-full w-full min-h-[150px] min-w-[250px] space-y-2">
        <ChartContainer
          config={previewChartConfig}
          className="h-full w-full"
        >
          <AreaChart
            accessibilityLayer
            width={undefined}
            height={undefined}
            data={dummyData}
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
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Area
            dataKey="datastream_1"
            type="natural"
            fill="var(--color-datastream_1)"
            fillOpacity={0.4}
            stroke="var(--color-datastream_1)"
            stackId="a"
          />
          <Area
            dataKey="datastream_2"
            type="natural"
            fill="var(--color-datastream_2)"
            fillOpacity={0.4}
            stroke="var(--color-datastream_2)"
            stackId="a"
          />
          <Area
            dataKey="datastream_3"
            type="natural"
            fill="var(--color-datastream_3)"
            fillOpacity={0.4}
            stroke="var(--color-datastream_3)"
            stackId="a"
          />
        </AreaChart>
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
  } = useWidgetData(widget, timeRange, pairs);

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

  // No data state
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="h-full w-full min-h-[150px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center space-y-2">
          <WifiOff className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Tidak ada data</p>
          <p className="text-xs text-muted-foreground">
            Belum ada data sensor dalam {timeRangeLabel}
          </p>
          {!isRealTimeConnected && (
            <p className="text-xs text-orange-500">⚠️ Real-time disconnected</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[150px] space-y-2">
      {/* Header dengan info widget */}
      <div className="px-2 pt-2">
        <div className="flex justify-between mx-2 font-semibold items-center">
          {widget?.description || "Widget Chart"}
          <div className="flex items-center gap-2">
            {/* {isRealTimeConnected && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            )} */}
            <p className="text-xs text-muted-foreground">
              {latestValue?.timeAgo || timeRangeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={dynamicChartConfig} className="h-full w-full">
        <AreaChart
          accessibilityLayer
          width={undefined}
          height={undefined}
          data={timeSeriesData}
          margin={{ left: 12, right: 12, top: 5, bottom: 5 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
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
          {/* Render satu Area untuk setiap pair */}
          {pairs.map((pair, idx) => (
            <Area
            key={idx}
            dataKey={`value_${pair.device_id}_${pair.datastream_id}`}
            type="natural"
            fill={chartColors[idx % chartColors.length]}
            fillOpacity={0.4}
            stroke={chartColors[idx % chartColors.length]}
            stackId="a"
            />
          ))}
          {/* <ChartLegend content={<ChartLegendContent />} /> */}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
