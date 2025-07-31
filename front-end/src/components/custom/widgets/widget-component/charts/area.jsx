import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useWidgetData } from "@/hooks/use-widget-data";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import { timezoneConfig } from "@/lib/helper";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

// Custom Tooltip Component dengan timestamp lengkap
const CustomTooltipContent = ({ active, payload, label, chartConfig }) => {
  if (!active || !payload || !payload.length) return null;

  // Ambil timestamp asli dari data pertama
  const firstPayload = payload[0]?.payload;
  const fullTimestamp =
    firstPayload?.originalTimestamp || firstPayload?.timestamp;

  // Format timestamp lengkap dengan timezone yang dikonfigurasi
  const fullTimeFormatted = fullTimestamp
    ? new Date(fullTimestamp).toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: timezoneConfig.timezone,
      }) + ` (${timezoneConfig.display})`
    : label;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="text-sm font-medium text-foreground mb-2">
        {fullTimeFormatted}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          // Ambil label dari chartConfig berdasarkan dataKey
          const displayLabel =
            chartConfig?.[entry.dataKey]?.label || entry.name;

          return (
            <div
              key={index}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {displayLabel}
                </span>
              </div>
              <span className="text-sm font-medium">
                {entry.value !== null && entry.value !== undefined
                  ? entry.value.toLocaleString("id-ID", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })
                  : "-"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  dataCount = "100",
  filterType = "count",
  isEditing,
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
      <div className="h-full w-full min-h-[150px] min-w-[250px] space-y-2 ">
        <ChartContainer config={previewChartConfig} className="h-full w-full">
          <AreaChart
            accessibilityLayer
            width={undefined}
            height={undefined}
            data={dummyData}
            margin={{ left: 12, right: 12 }}
          >
            <defs>
              <linearGradient id="fillDatastream1" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-1)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDatastream2" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-5)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-5)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillDatastream3" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--chart-3)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
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
              fill="url(#fillDatastream1)"
              stroke="var(--chart-1)"
              strokeWidth={1}
              stackId="1"
            />
            <Area
              dataKey="datastream_2"
              type="natural"
              fill="url(#fillDatastream2)"
              stroke="var(--chart-5)"
              strokeWidth={1}
              stackId="1"
            />
            <Area
              dataKey="datastream_3"
              type="natural"
              fill="url(#fillDatastream3)"
              stroke="var(--chart-3)"
              strokeWidth={1}
              stackId="1"
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
      <div className="h-full w-full min-h-[150px] space-y-2 flex flex-col">
        {/* Header dengan info tidak ada data */}
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold sm:text-lg">
                {widget?.description || "Area Chart"}
                {/* {widget?.description || "Area Chart"}: data {timeRangeLabel} */}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {timeRangeLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Empty Chart */}
        <div className="flex-1 min-h-0 relative">
          <ChartContainer config={dynamicChartConfig} className="h-full w-full">
            <AreaChart
              accessibilityLayer
              data={[]} // Empty data untuk chart kosong
              width={undefined}
              height={undefined}
              margin={{ left: -15, right: 30, top: 0, bottom: 15 }}
            >
              <CartesianGrid
                vertical={true}
                verticalPoints={[
                  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200,
                  1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000,
                ]}
              />
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

              <ChartTooltip
                cursor={false}
                content={(props) => (
                  <CustomTooltipContent
                    {...props}
                    chartConfig={dynamicChartConfig}
                  />
                )}
              />
              {/* Render areas untuk setiap pair meski data kosong */}
              {pairs.map((pair, idx) => (
                <Area
                  key={idx}
                  dataKey={`value_${pair.device_id}_${pair.datastream_id}`}
                  type="monotone"
                  fill={chartColors[idx % chartColors.length]}
                  fillOpacity={0.3}
                  stroke={chartColors[idx % chartColors.length]}
                  strokeWidth={2}
                />
              ))}
              <ChartLegend
                content={<ChartLegendContent className={"ml-11 max-sm:hidden"} />}
              />
            </AreaChart>
          </ChartContainer>
        </div>
        {/* Overlay text di tengah chart kosong */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center z-10 pointer-events-none ${isEditing ? "opacity-25" : ""}`}
        >
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm text-muted-foreground font-medium">
              Tidak ada data dalam {timeRangeLabel}
            </p>
            <p className="text-xs text-muted-foreground opacity-75 max-sm:hidden">
              Data akan muncul otomatis saat perangkat mulai mengirim data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[150px] space-y-2 flex flex-col">
      {/* Header dengan info widget */}
      <div className="px-4 pt-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-bold sm:text-lg">
              {widget?.description || "Area Chart"}
              {/* {widget?.description || "Area Chart"}: data {timeRangeLabel} */}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {latestValue?.timeAgo || timeRangeLabel}
            </p>
            {/* {!isRealTimeConnected && (
                <div className="flex items-center gap-1 text-xs text-orange-500">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
              )} */}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[150px] lg:min-h-auto">
        <ChartContainer config={dynamicChartConfig} className="h-full w-full">
          <AreaChart
            accessibilityLayer
            width={undefined}
            height={undefined}
            data={timeSeriesData}
            margin={{ left: -15, right: 30, top: 10, bottom: 15 }}
          >
            <defs>
              {/* Generate gradient untuk setiap pair */}
              {pairs.map((pair, idx) => {
                const gradientId = `fill_${pair.device_id}_${pair.datastream_id}`;
                const color = chartColors[idx % chartColors.length];
                return (
                  <linearGradient
                    key={gradientId}
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              vertical={true}
              verticalPoints={[
                100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200,
                1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000,
              ]}
            />
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

            <ChartTooltip
              cursor={false}
              content={(props) => (
                <CustomTooltipContent
                  {...props}
                  chartConfig={dynamicChartConfig}
                />
              )}
            />
            {/* Render satu Area untuk setiap pair */}
            {pairs.map((pair, idx) => {
              const gradientId = `fill_${pair.device_id}_${pair.datastream_id}`;
              return (
                <Area
                  key={idx}
                  dataKey={`value_${pair.device_id}_${pair.datastream_id}`}
                  type="natural"
                  fill={`url(#${gradientId})`}
                  stroke={chartColors[idx % chartColors.length]}
                  strokeWidth={1}
                  connectNulls={true}
                  dot={false}
                  isAnimationActive={true}
                  animateNewValues={true}
                  activeDot={{
                    r: 4,
                    stroke: chartColors[idx % chartColors.length],
                    strokeWidth: 2,
                  }}
                  stackId="a"
                />
              );
            })}
            <ChartLegend content={<ChartLegendContent className={"ml-11 max-sm:hidden"} />} />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
}
