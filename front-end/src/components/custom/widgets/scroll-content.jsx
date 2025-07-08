import { AreaChartWidget } from "./widget-component/charts/area";
import { BarChartWidget } from "./widget-component/charts/bar";
import { LineChartWidget } from "./widget-component/charts/line";
import { PieChartWidget } from "./widget-component/charts/pie";
import { SliderWidget } from "./widget-component/slider";
import { SwitchWidget } from "./widget-component/switch";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const widgetList = [
  { key: "switch", label: "Switch", component: SwitchWidget, height: "h-20" },
  // { key: "slider", label: "Slider", component: SliderWidget, height: "h-20" },
  {
    key: "line",
    label: "Line Chart",
    component: LineChartWidget,
    height: "h-40",
  },
  { key: "bar", label: "Bar Chart", component: BarChartWidget, height: "h-40" },
  {
    key: "area",
    label: "Area Chart",
    component: AreaChartWidget,
    height: "h-40",
  },
  // { key: "pie", label: "Pie Chart", component: PieChartWidget, height: "h-40" },
];

export function ScrollContent({ onChartDrag, isMobile }) {
  // Drag event handler
  const handleDragStart = (e, key) => {
    e.dataTransfer.setData("chartType", key);
    e.dataTransfer.effectAllowed = "move";
    if (onChartDrag) onChartDrag(key);
  };

  return (
    <>
      {widgetList.map((w) => (
        <div
          key={w.key}
          draggable
          onDragStart={(e) => handleDragStart(e, w.key)}
          className="rounded border bg-background shadow p-2 flex flex-col items-center justify-center cursor-move hover:bg-muted transition-all min-w-[180px] min-h-[120px] mb-2"
          title={`Tarik ke kanvas untuk menambah ${w.label}`}
        >
          <div className={cn("flex w-full items-center justify-between mb-2", isMobile ? "px-5" : "px-10")}>
            <span className="font-semibold">
              {w.label}
            </span>
            <Button
              size="xs"
              variant="outline"
              className="flex gap-2 items-center"
              onClick={(e) => handleDragStart(e, w.key)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div
            className={cn("w-full flex items-center justify-center", w.height)}
          >
            <w.component previewMode />
          </div>
        </div>
      ))}
    </>
  );
}
