import React, { useState, useEffect } from "react";
import { useWidgetData } from "@/hooks/use-widget-data";
import {
  Loader2,
  WifiOff,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// Text Widget UI Component (merged from /components/ui/text-widget.jsx)
const TextWidget = ({
  title = "Sensor Reading",
  value = "0",
  unit = "",
  icon: CustomIcon = Activity,
  maxValue = 100,
  thresholds = [25, 50, 75, 100],
  precision = 0,
  trend = null,
  className = "",
  accentColor = "blue",
  timeRange = "1h",
  widget = null,
  timeSeriesData = null,
  legendData = null,
  latestValue = null,
  timeRangeLabel = "1 jam terakhir"
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatValue = (val) => {
    const numVal = parseFloat(val);
    return isNaN(numVal) ? val : numVal.toFixed(precision);
  };

  const getProgress = () => {
    return Math.min((parseFloat(value) / maxValue) * 100, 100);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case "stable":
        return <Minus className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getActiveThresholds = () => {
    const currentValue = parseFloat(value);
    return thresholds.map((threshold) => currentValue >= threshold);
  };

  const activeThresholds = getActiveThresholds();

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "bg-blue-100 text-blue-600",
      progress: "stroke-blue-500",
      active: "bg-blue-500",
      inactive: "bg-gray-200",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "bg-green-100 text-green-600",
      progress: "stroke-green-500",
      active: "bg-green-500",
      inactive: "bg-gray-200",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "bg-purple-100 text-purple-600",
      progress: "stroke-purple-500",
      active: "bg-purple-500",
      inactive: "bg-gray-200",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: "bg-orange-100 text-orange-600",
      progress: "stroke-orange-500",
      active: "bg-orange-500",
      inactive: "bg-gray-200",
    },
  };

  const colors = colorClasses[accentColor] || colorClasses.blue;

  // No data state check - sama seperti logic di wrapper
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return (
      <div className="h-full w-full min-h-[150px] space-y-2 flex flex-col">
        {/* Header dengan info tidak ada data - sama seperti line chart */}
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold sm:text-lg">
                {widget?.description || title}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {timeRange === "1h"
                  ? "1 jam terakhir"
                  : timeRange === "12h"
                    ? "12 jam terakhir"
                    : timeRange === "1d"
                      ? "1 hari terakhir"
                      : timeRange === "1w"
                        ? "1 minggu terakhir"
                        : timeRange === "1m"
                          ? "1 bulan terakhir"
                          : "1 jam terakhir"}
              </p>
            </div>
          </div>
        </div>

        {/* Content area dengan message - konsisten dengan line chart */}
        <div className="flex-1 flex flex-col justify-center items-center relative">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm text-muted-foreground font-medium">
              Tidak ada data dalam{" "}
              {timeRange === "1h"
                ? "1 jam terakhir"
                : timeRange === "12h"
                  ? "12 jam terakhir"
                  : timeRange === "1d"
                    ? "1 hari terakhir"
                    : timeRange === "1w"
                      ? "1 minggu terakhir"
                      : timeRange === "1m"
                        ? "1 bulan terakhir"
                        : "1 jam terakhir"}
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
      {/* Header - sama seperti line dan area chart dengan info waktu */}
      <div className="px-4 pt-2 flex-shrink-0">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold sm:text-lg">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {latestValue?.timeAgo || timeRangeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Main Value - tanpa current reading dan ikon */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-2">
            <div className="text-gray-900 font-bold text-5xl">
              {formatValue(displayValue)}
            </div>
            {unit && (
              <div className="text-gray-600 text-lg font-medium">{unit}</div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Legend - ditampilkan di bawah nilai sensor */}
      {legendData && legendData.length > 0 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex flex-wrap justify-center gap-3">
            {legendData.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {/* <div 
                  className="w-2 h-2 rounded-xs"
                  style={{ backgroundColor: 'var(--chart-1)' }}
                /> */}
                <span className="text-muted-foreground">
                  Device - Datastream:
                </span>
                {item.device_name} - {item.sensor_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threshold Indicators - disembunyikan */}
      {/* <div className="space-y-2">
        <div className="flex justify-between text-gray-500 text-xs font-medium">
          {thresholds.map((threshold, index) => (
            <span key={index}>{threshold}</span>
          ))}
        </div>
        <div className="flex gap-1">
          {thresholds.map((threshold, index) => (
            <div
              key={index}
              className={`
                flex-1 h-2 rounded-full transition-all duration-300
                ${activeThresholds[index] ? colors.active : colors.inactive}
              `}
            />
          ))}
        </div>
      </div> */}
    </div>
  );
};

// Wrapper component untuk TextWidget yang terintegrasi dengan dashboard system
export const TextWidgetWrapper = ({
  previewMode = false,
  widget,
  timeRange = "1h",
  dataCount = 100,
  filterType = "latest",
  className = "",
  ...props
}) => {
  // Preview mode dengan data dummy
  if (previewMode) {
    // Return hanya konten teks sederhana untuk preview
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">
            25.6
            <span className="text-muted-foreground text-sm"> mg/L</span>
          </div>
        </div>
      </div>
    );
  }

  // Safety check
  if (!widget) {
    return (
      <div className="h-full w-full min-h-[120px] flex items-center justify-center bg-muted/30 rounded-lg">
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

  // Hook untuk mengambil data widget dari server
  const {
    timeSeriesData,
    latestValue,
    isLoading,
    error,
    isValidWidget,
    isRealTimeConnected,
    datastreamInfo,
    legendData,
    timeRangeLabel,
  } = useWidgetData(widget, timeRange, dataCount, filterType, pairs);

  // Validasi widget
  if (!isValidWidget) {
    return (
      <div className="h-full w-full min-h-[120px] flex items-center justify-center bg-muted/30 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Konfigurasi widget tidak valid
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px]">
        <div className="flex flex-col items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs text-center">Error: {error.message}</span>
        </div>
      </div>
    );
  }

  // No connection state
  if (!isRealTimeConnected) {
    return (
      <div className="flex items-center justify-center h-full min-h-[120px]">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <WifiOff className="h-5 w-5" />
          <span className="text-xs">Tidak ada koneksi</span>
        </div>
      </div>
    );
  }

  // Get the latest value from the data
  const latestData = timeSeriesData[timeSeriesData.length - 1];
  const value = latestData
    ? parseFloat(
        latestData[`value_${pairs[0].device_id}_${pairs[0].datastream_id}`]
      ) || 0
    : 0;

  // Get widget configuration
  const config = widget.config || {};

  // Get sensor information for title and unit
  const title = widget.description || "Sensor Value";

  // Get unit from the first selected datastream (since text widget only uses one)
  const selectedPair = pairs[0];
  let datastreamUnit = "";
  let datastreamPrecision = 0;

  if (selectedPair) {
    // Primary method: try from the latest data point (this is most reliable)
    if (timeSeriesData && timeSeriesData.length > 0) {
      const latestPoint = timeSeriesData[timeSeriesData.length - 1];
      const unitKey = `unit_${selectedPair.device_id}_${selectedPair.datastream_id}`;
      datastreamUnit = latestPoint[unitKey] || "";
    }

    // Get precision from datastreamInfo
    if (datastreamInfo && Array.isArray(datastreamInfo)) {
      const datastream = datastreamInfo.find(
        (ds) =>
          ds.device_id === selectedPair.device_id &&
          ds.datastream_id === selectedPair.datastream_id
      );
      if (datastream && datastream.decimal_value) {
        // Parse decimal format like "0.00" to get precision count
        const decimalMatch = datastream.decimal_value.match(/\.(\d+)/);
        datastreamPrecision = decimalMatch ? decimalMatch[1].length : 0;
      }
    }

    // Fallback 1: try from widget.datastreams if available
    if (
      !datastreamUnit &&
      widget.datastreams &&
      Array.isArray(widget.datastreams)
    ) {
      const datastream = widget.datastreams.find(
        (ds) =>
          ds.device_id === selectedPair.device_id &&
          ds.id === selectedPair.datastream_id
      );
      datastreamUnit = datastream?.unit || "";
    }

    // Fallback 2: try from widget config
    if (!datastreamUnit && widget.config?.unit) {
      datastreamUnit = widget.config.unit;
    }
  }

  return (
    <TextWidget
      value={value}
      title={title}
      unit={datastreamUnit || config.unit || ""}
      maxValue={config.maxValue || 100}
      thresholds={config.thresholds || [25, 50, 75, 100]}
      precision={datastreamPrecision || config.precision || 0}
      accentColor={config.accentColor || "blue"}
      timeRange={timeRange}
      widget={widget}
      timeSeriesData={timeSeriesData}
      legendData={legendData}
      latestValue={latestValue}
      timeRangeLabel={timeRangeLabel}
      className={className}
      {...props}
    />
  );
};

export default TextWidgetWrapper;
