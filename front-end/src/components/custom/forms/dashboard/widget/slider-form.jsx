import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export default function SliderForm({ value = 50, onChange }) {
  const [sliderValue, setSliderValue] = useState(value);

  const handleSlider = (val) => {
    setSliderValue(val[0]);
    onChange && onChange({ value: val[0] });
  };

  return (
    <div className="flex flex-col gap-4">
      <Label>Nilai Slider</Label>
      <Slider value={[sliderValue]} onValueChange={handleSlider} max={100} step={1} />
      <span>{sliderValue}</span>
    </div>
  );
}