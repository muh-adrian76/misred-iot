"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";

const GaugeForm = ({ sensors, onSubmit, onCancel, initialData = null }) => {
  // Form state
  const [formData, setFormData] = useState({
    widgetName: "",
    selectedSensor: "",
    dataStreamName: "",
    unit: "",
    minValue: 0,
    maxValue: 100,
    ranges: [
      { min: 0, max: 25, label: "Low", color: "#ef4444" },
      { min: 25, max: 50, label: "Medium", color: "#f97316" },
      { min: 50, max: 75, label: "High", color: "#eab308" },
      { min: 75, max: 100, label: "Very High", color: "#22c55e" },
    ],
    size: 240,
    animated: true,
    glowEffect: true,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Color options for ranges
  const colorOptions = [
    { value: "#ef4444", name: "Red", color: "#ef4444" },
    { value: "#f97316", name: "Orange", color: "#f97316" },
    { value: "#eab308", name: "Yellow", color: "#eab308" },
    { value: "#22c55e", name: "Green", color: "#22c55e" },
    { value: "#3b82f6", name: "Blue", color: "#3b82f6" },
    { value: "#8b5cf6", name: "Purple", color: "#8b5cf6" },
    { value: "#06b6d4", name: "Cyan", color: "#06b6d4" },
    { value: "#64748b", name: "Gray", color: "#64748b" },
  ];

  // Initialize form with existing data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        widgetName: initialData.widgetName || "",
        selectedSensor: initialData.selectedSensor || "",
        dataStreamName: initialData.dataStreamName || "",
        unit: initialData.unit || "",
        minValue: initialData.minValue || 0,
        maxValue: initialData.maxValue || 100,
        ranges: initialData.ranges || formData.ranges,
        size: initialData.size || 240,
        animated: initialData.animated !== undefined ? initialData.animated : true,
        glowEffect: initialData.glowEffect !== undefined ? initialData.glowEffect : true,
      });
    }
  }, [initialData]);

  // Get selected sensor data
  const selectedSensorData = sensors?.find(sensor => sensor.id === formData.selectedSensor);
  const dataStreams = selectedSensorData?.datastreams || [];

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle range changes
  const handleRangeChange = (index, field, value) => {
    const newRanges = [...formData.ranges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setFormData(prev => ({ ...prev, ranges: newRanges }));
  };

  // Add new range
  const addRange = () => {
    const lastRange = formData.ranges[formData.ranges.length - 1];
    const newRange = {
      min: lastRange.max,
      max: lastRange.max + 25,
      label: "New Range",
      color: "#64748b"
    };
    setFormData(prev => ({
      ...prev,
      ranges: [...prev.ranges, newRange]
    }));
  };

  // Remove range
  const removeRange = (index) => {
    if (formData.ranges.length > 1) {
      const newRanges = formData.ranges.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, ranges: newRanges }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.widgetName.trim()) {
      newErrors.widgetName = "Widget name is required";
    }

    if (!formData.selectedSensor) {
      newErrors.selectedSensor = "Please select a sensor";
    }

    if (!formData.dataStreamName) {
      newErrors.dataStreamName = "Please select a data stream";
    }

    // Validate ranges
    const sortedRanges = [...formData.ranges].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sortedRanges.length; i++) {
      const range = sortedRanges[i];
      if (range.min >= range.max) {
        newErrors[`range_${i}`] = "Min value must be less than max value";
      }
      if (i > 0 && range.min < sortedRanges[i - 1].max) {
        newErrors[`range_${i}`] = "Range overlaps with previous range";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const widgetConfig = {
        type: "gauge",
        name: formData.widgetName,
        sensorId: formData.selectedSensor,
        dataStreamName: formData.dataStreamName,
        config: {
          unit: formData.unit,
          minValue: parseFloat(formData.minValue),
          maxValue: parseFloat(formData.maxValue),
          ranges: formData.ranges.map(range => ({
            ...range,
            min: parseFloat(range.min),
            max: parseFloat(range.max)
          })),
          size: parseInt(formData.size),
          animated: formData.animated,
          glowEffect: formData.glowEffect,
        }
      };

      await onSubmit(widgetConfig);
    } catch (error) {
      console.error("Error submitting gauge widget:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Configuration</h3>
          
          <div className="space-y-2">
            <Label htmlFor="widgetName">Widget Name</Label>
            <Input
              id="widgetName"
              value={formData.widgetName}
              onChange={(e) => handleChange("widgetName", e.target.value)}
              placeholder="e.g., Temperature Gauge"
              className={errors.widgetName ? "border-red-500" : ""}
            />
            {errors.widgetName && (
              <p className="text-sm text-red-500">{errors.widgetName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selectedSensor">Select Sensor</Label>
              <Select value={formData.selectedSensor} onValueChange={(value) => handleChange("selectedSensor", value)}>
                <SelectTrigger className={errors.selectedSensor ? "border-red-500" : ""}>
                  <SelectValue placeholder="Choose a sensor" />
                </SelectTrigger>
                <SelectContent>
                  {sensors?.length > 0 ? (
                    sensors.map((sensor) => (
                      <SelectItem key={sensor.id} value={sensor.id}>
                        <div className="flex items-center gap-2">
                          <span>{sensor.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {sensor.datastreams?.length || 0} streams
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-sensors" disabled>
                      No sensors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.selectedSensor && (
                <p className="text-sm text-red-500">{errors.selectedSensor}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataStreamName">Data Stream</Label>
              <Select 
                value={formData.dataStreamName} 
                onValueChange={(value) => handleChange("dataStreamName", value)}
                disabled={!formData.selectedSensor}
              >
                <SelectTrigger className={errors.dataStreamName ? "border-red-500" : ""}>
                  <SelectValue placeholder="Choose data stream" />
                </SelectTrigger>
                <SelectContent>
                  {dataStreams.length > 0 ? (
                    dataStreams.map((stream) => (
                      <SelectItem key={stream.name} value={stream.name}>
                        {stream.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-streams" disabled>
                      {formData.selectedSensor ? "No data streams available" : "Select a sensor first"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.dataStreamName && (
                <p className="text-sm text-red-500">{errors.dataStreamName}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Value Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Value Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleChange("unit", e.target.value)}
                placeholder="e.g., °C, %, RPM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minValue">Min Value</Label>
              <Input
                id="minValue"
                type="number"
                value={formData.minValue}
                onChange={(e) => handleChange("minValue", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxValue">Max Value</Label>
              <Input
                id="maxValue"
                type="number"
                value={formData.maxValue}
                onChange={(e) => handleChange("maxValue", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Ranges Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Value Ranges</h3>
            <Button type="button" variant="outline" size="sm" onClick={addRange}>
              <Plus className="w-4 h-4 mr-2" />
              Add Range
            </Button>
          </div>

          <div className="space-y-3">
            {formData.ranges.map((range, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-2">
                  <Label className="text-xs">Min</Label>
                  <Input
                    type="number"
                    value={range.min}
                    onChange={(e) => handleRangeChange(index, "min", e.target.value)}
                    size="sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Max</Label>
                  <Input
                    type="number"
                    value={range.max}
                    onChange={(e) => handleRangeChange(index, "max", e.target.value)}
                    size="sm"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Label</Label>
                  <Input
                    value={range.label}
                    onChange={(e) => handleRangeChange(index, "label", e.target.value)}
                    size="sm"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Color</Label>
                  <Select value={range.color} onValueChange={(value) => handleRangeChange(index, "color", value)}>
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: color.color }}
                            />
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeRange(index)}
                    disabled={formData.ranges.length <= 1}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Appearance Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Appearance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size (px)</Label>
              <Select value={formData.size.toString()} onValueChange={(value) => handleChange("size", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">Small (200px)</SelectItem>
                  <SelectItem value="240">Medium (240px)</SelectItem>
                  <SelectItem value="280">Large (280px)</SelectItem>
                  <SelectItem value="320">Extra Large (320px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="animated">Animation</Label>
              <Select value={formData.animated.toString()} onValueChange={(value) => handleChange("animated", value === "true")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="glowEffect">Glow Effect</Label>
              <Select value={formData.glowEffect.toString()} onValueChange={(value) => handleChange("glowEffect", value === "true")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : initialData ? "Update Widget" : "Create Widget"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GaugeForm;
