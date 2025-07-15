import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { useState } from "react";

export function SwitchWidget({previewMode}) {
  const [checked, setChecked] = useState(false);
  return (
    <div className="w-full h-full flex flex-col justify-center items-center min-h-[100px] bg-transparent">
      <div className="flex items-center space-x-4">
        <Switch 
          id="switch-widget" 
          checked={checked} 
          onCheckedChange={setChecked}
          className="data-[state=checked]:bg-primary"
        />
        <Label htmlFor="switch-widget" className="text-lg font-medium text-foreground">
          {checked ? "On" : "Off"}
        </Label>
      </div>
    </div>
  );
}
