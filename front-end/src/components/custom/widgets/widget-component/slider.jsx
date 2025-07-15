"use client";
import { cn } from "@/lib/utils";
import { SlidingNumber } from "@/components/ui/sliding-number";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

export function SliderWidget({ className, previewMode, ...props }) {
  const [value, setValue] = useState([50]);

  return (
    <div className="flex w-full h-full items-center gap-4 px-4">
      <Slider
        value={value}
        onValueChange={setValue}
        min={0}
        max={100}
        step={0.1}
        className={cn("flex-1", className)}
        {...props}
      />
      <SlidingNumber value={value[0]} />
    </div>
  );
}
