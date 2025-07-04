import { useState } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function SliderWidget({ className, previewMode, ...props }) {
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <div className="flex w-2/3 gap-4">
      <Slider
        id="slider-widget"
        value={sliderValue}
        onValueChange={setSliderValue}
        max={100}
        step={1}
        className={cn("w-[90%]", className)}
        {...props}
      />
      <Label htmlFor="slider-widget">{sliderValue[0]}</Label>
    </div>
  );
}
