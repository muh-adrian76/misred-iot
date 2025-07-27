import { AreaChartWidget } from "./widget-component/charts/area";
import { BarChartWidget } from "./widget-component/charts/bar";
import { LineChartWidget } from "./widget-component/charts/line";
import { PieChartWidget } from "./widget-component/charts/pie";
import { SliderWidget } from "./widget-component/slider";
import { SwitchWidget } from "./widget-component/switch";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus } from "lucide-react";
import DescriptionTooltip from "../other/description-tooltip";

const widgetList = [
  {
    key: "switch",
    label: "Switch",
    component: SwitchWidget,
    width: "w-50",
    tooltip: "Gunakan untuk menghidupkan/mematikan sesuatu",
  },
  {
    key: "slider",
    label: "Slider",
    component: SliderWidget,
    width: "w-50",
    tooltip: "Gunakan untuk mengatur nilai dalam rentang tertentu",
  },
  {
    key: "line",
    label: "Line Chart",
    component: LineChartWidget,
    width: "lg:w-50 w-full",
    tooltip: "Gunakan untuk melihat tren data dari waktu ke waktu",
  },
  {
    key: "bar",
    label: "Bar Chart",
    component: BarChartWidget,
    tooltip: "Gunakan untuk membandingkan nilai antar kategori",
  },
  {
    key: "area",
    label: "Area Chart",
    component: AreaChartWidget,
    tooltip: "Gunakan untuk melihat total kumulatif atau volume dari data",
  },
  // {
  //   key: "pie",
  //   label: "Pie Chart",
  //   component: PieChartWidget,
  //   tooltip: "Gunakan untuk melihat proporsi antar kategori",
  // },
];

export function ScrollContent({ onChartDrag, mobileView, onAddWidget }) {
  // Drag event handle - hanya set data, jangan panggil callback
  const handleDragStart = (e, key) => {
    e.dataTransfer.setData("type", key);
    e.dataTransfer.effectAllowed = "move";
    // Jangan panggil onChartDrag di sini - biarkan drop yang handle
  };

  // Add widget directly (without drag) - ini untuk tombol +
  const handleAddWidget = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("Add widget button clicked:", key);
    // Panggil onAddWidget yang diteruskan dari parent
    if (onAddWidget) {
      onAddWidget(key);
    } else if (onChartDrag) {
      // Fallback ke onChartDrag jika onAddWidget tidak tersedia
      onChartDrag(key, null);
    }
  };

  return (
    <>
      {widgetList.map((w) => (
        <div
          key={w.key}
          draggable
          unselectable="on"
          onDragStart={(e) => handleDragStart(e, w.key)}
          className="droppable-element rounded border bg-background shadow p-2 flex flex-col items-center justify-center cursor-grab hover:bg-muted transition-all min-w-[180px] min-h-[120px] mb-2"
          >
          <div
            className={cn(
              "flex w-full items-center justify-between mb-2",
              mobileView ? "px-5" : "px-10"
            )}
            // title={`Tarik ke kanvas untuk menambah ${w.label}`}
            >
            <span className="font-semibold">{w.label}</span>
            <div className="flex gap-2">
              <Button
                size="xs"
                variant="outline"
                className="flex gap-2 items-center"
                onClick={(e) => handleAddWidget(e, w.key)}
              >
                <Plus className="w-5 h-5" />
              </Button>
              <DescriptionTooltip content={w.tooltip} side={"left"}>
                <Button
                  size="xs"
                  variant="outline"
                  className="flex gap-2 items-center cursor-help"
                  >
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </DescriptionTooltip>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center h-40 justify-center w-full",
              w.width ? w.width : ""
            )}
          >
            <w.component previewMode />
          </div>
        </div>
      ))}
    </>
  );
}
