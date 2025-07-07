import { WidthProvider, Responsive } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { AreaChartWidget } from "@/components/custom/widgets/widget-component/charts/area";
import { BarChartWidget } from "@/components/custom/widgets/widget-component/charts/bar";
import { LineChartWidget } from "@/components/custom/widgets/widget-component/charts/line";
import { PieChartWidget } from "@/components/custom/widgets/widget-component/charts/pie";
import { Button } from "@/components/ui/button";
import { Trash2, Move, Settings2 } from "lucide-react";
import { errorToast } from "../other/toaster";
import { fetchFromBackend } from "@/lib/helper";

const ResponsiveGridLayout = WidthProvider(Responsive);

const widgetComponents = {
  area: AreaChartWidget,
  bar: BarChartWidget,
  line: LineChartWidget,
  pie: PieChartWidget,
};

export default function SwapyDragArea({
  items,
  setItems,
  layouts,
  setLayouts,
  onChartDrop,
}) {
  const handleAddWidget = (e) => {
    e.preventDefault();
    const chartType = e.dataTransfer.getData("chartType");
    if (chartType) {
      const id = `${chartType}-${Date.now()}`;
      const defaultLayoutItem = {
        i: id,
        x: (items.length * 2) % 12,
        y: Infinity,
        w: 8,
        h: 8,
      };
      if (onChartDrop) onChartDrop(chartType, defaultLayoutItem);
    }
  };

  const handleRemoveWidget = async (id) => {
    try {
      const res = await fetchFromBackend(`/widget/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus widget di server");

      setItems(items.filter((item) => item.id !== id));
      setLayouts({
        ...layouts,
        lg: (layouts.lg || []).filter((layout) => layout.i !== id),
      });
    } catch (error) {
      errorToast("Gagal menghapus widget dari database");
    }
  };

  const onLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts);
  };

  return (
    <div
      className="space-y-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleAddWidget}
    >
      <ResponsiveGridLayout
        className="layout bg-background border-r border-gray-200 dark:border-gray-700 rounded-lg min-h-[350px] 
                  bg-[linear-gradient(90deg,#e5e7eb_1px,transparent_1px),linear-gradient(180deg,#e5e7eb_1px,transparent_1px)] 
                  dark:bg-[linear-gradient(90deg,#364153_1px,transparent_1px),linear-gradient(180deg,#364153_1px,transparent_1px)] 
                  bg-[size:96px_48px]"
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        breakpoints={{ lg: 1024, md: 768, sm: 480 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={100}
        margin={[16, 16]}
        isResizable={true}
        isDraggable={true}
        draggableHandle=".drag-handle"
      >
        {items.length === 0 && (
          <div
            key="empty"
            className="widget-info absolute top-1/2 text-center left-1/2 min-w-lg transform -translate-x-1/2 -translate-y-1/2 inset-0 flex flex-col items-center pointer-events-none select-none"
          >
            <h2 className="text-2xl font-bold mb-2 text-muted-foreground">
              Tambah widget baru
            </h2>
            <p className="text-muted-foreground text-balance">
              <b>Klik tombol +</b> atau <b>tarik</b> kedalam kanvas.
            </p>
          </div>
        )}
        {items.map((item) => {
          const WidgetComponent = widgetComponents[item.type];
          if (!WidgetComponent)
            return <div key={item.id}>Tipe chart tidak ditemukan.</div>;
          return (
            <div key={item.id} className="relative group">
              <div className="h-full w-full bg-background dark:border dark:border-black-500 rounded-sm shadow flex flex-col overflow-hidden relative group">
                <div className="drag-handle cursor-move absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-5">
                  <Move className="w-10 h-10 text-foreground drop-shadow-lg" />
                </div>
                <div className="flex items-center justify-center px-2 py-1">
                  {item.description || "Ketuk disini"}
                </div>
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenWidgetSetting(item.id);
                    }}
                  >
                    <Settings2 className="w-5 h-5" />
                  </Button>

                  <Button
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWidget(item.id);
                    }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Chart Content */}
                <div className="flex-1 p-4 overflow-hidden">
                  <WidgetComponent />
                </div>
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
