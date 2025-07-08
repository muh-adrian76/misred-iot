import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SwitchForm({ value = 0, onChange }) {
  const [switchValue, setSwitchValue] = useState(value);

  const handleSwitch = (val) => {
    setSwitchValue(val ? 1 : 0);
    onChange && onChange({ value: val ? 1 : 0 });
  };

  return (
    <div className="flex flex-col gap-4">
      <Label>Nilai Switch</Label>
      <Switch checked={!!switchValue} onCheckedChange={handleSwitch} />
      <span>{switchValue ? "On (1)" : "Off (0)"}</span>
    </div>
  );
}