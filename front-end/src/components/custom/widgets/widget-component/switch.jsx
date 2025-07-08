import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { useState } from "react";

export function SwitchWidget({previewMode}) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="flex items-center space-x-2">
      <Switch id="switch-widget" checked={checked} onCheckedChange={setChecked} />
      <Label htmlFor="switch-widget">{checked ? "On" : "Off"}</Label>
    </div>
  );
}
