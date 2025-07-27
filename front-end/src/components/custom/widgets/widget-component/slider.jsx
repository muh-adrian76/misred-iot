"use client";
import { cn } from "@/lib/utils";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useWidgetData } from "@/hooks/use-widget-data";
import { useDeviceControl } from "@/hooks/use-device-control";
import { Loader2, WifiOff, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

export function SliderWidget({
  className,
  previewMode = false,
  widget,
  timeRange = "1h",
  ...props
}) {
  const [dummyValue, setDummyValue] = useState([50]);
  const [sliderValue, setSliderValue] = useState([0]);
  const [isSending, setIsSending] = useState(false);

  // Use real-time data hook
  const {
    latestValue,
    isLoading,
    error,
    isValidWidget,
    isRealTimeConnected,
    datastreamInfo,
  } = useWidgetData(widget, timeRange);

  // Use device control hook
  const { sendValueCommand, isActuator, isSensor } = useDeviceControl();

  // Preview mode dengan data dummy
  if (previewMode) {
    return (
      <div className="flex w-full h-full items-center gap-4 px-4">
        <Slider
          value={dummyValue}
          onValueChange={setDummyValue}
          min={0}
          max={100}
          step={0.1}
          className={cn("flex-1", className)}
          {...props}
        />
        <SlidingNumber value={dummyValue[0]} />
      </div>
    );
  }

  // Validasi widget
  if (!isValidWidget) {
    return (
      <div className="flex w-full h-full items-center justify-center px-4 bg-muted/30 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto" />
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
      <div className="flex w-full h-full items-center justify-center px-4">
        <div className="text-center space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex w-full h-full items-center justify-center px-4 bg-destructive/10 rounded-lg">
        <div className="text-center space-y-2">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
          <p className="text-sm text-destructive">Gagal memuat data</p>
          <p className="text-xs text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // Get current sensor value
  const currentValue = latestValue?.value || 0;

  // Get datastream info to determine if this is actuator or sensor and get min/max values
  const currentDatastream =
    datastreamInfo?.find(
      (ds) =>
        ds.device_id === widget?.device_id &&
        ds.datastream_id === widget?.datastream_id
    ) || datastreamInfo?.[0]; // Fallback to first datastream for multi-pair widgets

  const isActuatorWidget = currentDatastream
    ? isActuator(currentDatastream.type)
    : false;
  const isSensorWidget = currentDatastream
    ? isSensor(currentDatastream.type)
    : true; // Default to sensor

  // Determine slider range based on datastream configuration
  const minValue = currentDatastream?.min_value || 0;
  const maxValue = currentDatastream?.max_value || 100;

  // Ensure value is within range
  const clampedValue = Math.max(minValue, Math.min(maxValue, currentValue));

  // Handle slider value change for actuator widgets
  const handleSliderChange = (value) => {
    if (isActuatorWidget && !isSending) {
      setSliderValue(value);
    }
  };

  // Handle slider drag end - send command to device
  const handleSliderCommit = async (value) => {
    if (!isActuatorWidget || isSending) return;

    setIsSending(true);
    try {
      const success = await sendValueCommand(
        latestValue?.device_id || widget?.device_id,
        latestValue?.datastream_id || widget?.datastream_id,
        value[0]
      );

      if (!success) {
        // Revert slider if failed
        setSliderValue([clampedValue]);
      }
    } catch (error) {
      console.error("Slider command failed:", error);
      setSliderValue([clampedValue]);
    } finally {
      setIsSending(false);
    }
  };

  // Update slider value when sensor value changes
  useEffect(() => {
    setSliderValue([clampedValue]);
  }, [clampedValue]);

  return (
    <div className="flex w-full h-full flex-col justify-center gap-3 px-4">
      {/* Header dengan info sensor */}
      <div className="text-center">
        <h4 className="text-sm font-medium">
          {latestValue?.sensor_name ||
            currentDatastream?.description ||
            "Sensor"}
        </h4>
        <p className="text-xs text-muted-foreground">
          {latestValue?.device_name}
        </p>
        {latestValue?.timeAgo && (
          <p className="text-xs text-muted-foreground">
            Updated {latestValue.timeAgo}
          </p>
        )}
        {/* Show mode indicator */}
        <p className="text-xs text-blue-500 font-medium">
          {isActuatorWidget ? "🎛️ Control" : "📊 Monitor"}
        </p>
      </div>

      {/* Slider component */}
      <div className="flex items-center gap-4">
        <Slider
          value={sliderValue}
          min={minValue}
          max={maxValue}
          step={0.1}
          disabled={isSensorWidget || isSending}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit} // Send command when drag ends
          className={cn("flex-1", className, {
            "opacity-50": isSending,
            "opacity-80": isSensorWidget,
          })}
          {...props}
        />
        <div className="min-w-[60px] text-right">
          <SlidingNumber
            value={isActuatorWidget ? sliderValue[0] : clampedValue}
          />
          {(latestValue?.unit || currentDatastream?.unit) && (
            <p className="text-xs text-muted-foreground">
              {latestValue?.unit || currentDatastream?.unit}
            </p>
          )}
        </div>
      </div>

      {/* Range indicator */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Range: {minValue} - {maxValue}{" "}
          {latestValue?.unit || currentDatastream?.unit}
        </p>
      </div>

      {/* Status indicators */}
      <div className="text-center">
        {isSending && (
          <p className="text-xs text-blue-600">📤 Sending command...</p>
        )}
        {isRealTimeConnected && !isSending && (
          <div className="flex items-center justify-center gap-1 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live
          </div>
        )}
        {!isRealTimeConnected && latestValue && (
          <p className="text-xs text-orange-500">⚠️ Real-time disconnected</p>
        )}
        {isActuatorWidget && (
          <p className="text-xs text-blue-600">
            💡 Geser slider untuk mengontrol device
          </p>
        )}
        {!latestValue && (
          <p className="text-xs text-muted-foreground">
            Tidak ada data terbaru
          </p>
        )}
      </div>
    </div>
  );
}
