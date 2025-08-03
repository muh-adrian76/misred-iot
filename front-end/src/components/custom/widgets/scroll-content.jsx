// Import komponen-komponen widget untuk dashboard IoT
import { AreaChartWidget } from "./widget-component/monitor/area";
import { BarChartWidget } from "./widget-component/monitor/bar";
import { LineChartWidget } from "./widget-component/monitor/line";
import { PieChartWidget } from "./widget-component/monitor/pie";
import GaugeWidget from "./widget-component/monitor/gauge";
import TextWidgetWrapper from "./widget-component/monitor/text";
import { SliderWidget } from "./widget-component/control/slider";
import { SwitchWidget } from "./widget-component/control/switch";

// Import utility dan komponen UI
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plus } from "lucide-react";
import DescriptionTooltip from "../other/description-tooltip";

// Konfigurasi daftar widget yang tersedia untuk dashboard IoT
const widgetList = [
  // {
  //   key: "switch", // Identifier unik untuk widget switch
  //   label: "Switch", // Label yang ditampilkan di UI
  //   component: SwitchWidget, // Komponen React untuk widget
  //   width: "w-50", // Kelas CSS untuk lebar widget
  //   tooltip: "Gunakan untuk menghidupkan/mematikan sesuatu", // Deskripsi fungsi
  // },
  // {
  //   key: "slider",
  //   label: "Slider",
  //   component: SliderWidget,
  //   width: "w-50",
  //   tooltip: "Gunakan untuk mengatur nilai dalam rentang tertentu",
  // },
  // {
  //   key: "text",
  //   label: "Teks",
  //   component: TextWidgetWrapper,
  //   width: "w-50",
  //   tooltip: "Gunakan untuk menampilkan nilai sensor dalam format teks",
  // },
  // {
  //   key: "gauge",
  //   label: "Gauge",
  //   component: GaugeWidget,
  //   width: "w-50",
  //   tooltip: "Gunakan untuk memantau status sensor dengan indikator visual",
  // },
  {
    key: "line",
    label: "Diagram Garis",
    component: LineChartWidget,
    width: "lg:w-50 w-full", // Responsive width: 50% di layar besar, full di layar kecil
    tooltip: "Gunakan untuk melihat tren data dari waktu ke waktu",
  },
  {
    key: "bar",
    label: "Diagram Batang",
    component: BarChartWidget,
    tooltip: "Gunakan untuk membandingkan nilai antar kategori",
  },
  {
    key: "area",
    label: "Diagram Area",
    component: AreaChartWidget,
    tooltip: "Gunakan untuk melihat total kumulatif atau volume dari data",
  },
  // Pie chart sementara dinonaktifkan
  // {
  //   key: "pie",
  //   label: "Diagram Lingkaran",
  //   component: PieChartWidget,
  //   tooltip: "Gunakan untuk melihat proporsi antar kategori",
  // },
];

// Komponen ScrollContent untuk menampilkan daftar widget yang dapat ditambahkan
export function ScrollContent({ onChartDrag, mobileView, onAddWidget }) {
  // Handler untuk memulai drag widget ke grid layout
  const handleDragStart = (e, key) => {
    // Set data yang akan di-transfer saat drag
    e.dataTransfer.setData("type", key);
    e.dataTransfer.effectAllowed = "move"; // Izinkan operasi move
    // Catatan: Jangan panggil onChartDrag di sini - biarkan drop handler yang menangani
  };

  // Handler untuk menambah widget langsung tanpa drag (tombol +)
  const handleAddWidget = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("Add widget button clicked:", key);
    
    // Panggil handler yang sesuai dari parent component
    if (onAddWidget) {
      onAddWidget(key); // Handler khusus untuk menambah widget
    } else if (onChartDrag) {
      onChartDrag(key, null); // Fallback ke handler drag jika onAddWidget tidak tersedia
    }
  };

  return (
    <>
      {widgetList.map((w) => (
        <div
          key={w.key}
          draggable // Aktifkan drag untuk widget
          unselectable="on" // Cegah text selection saat drag
          onDragStart={(e) => handleDragStart(e, w.key)}
          className="droppable-element rounded border bg-background shadow p-2 flex flex-col items-center justify-center cursor-grab hover:bg-muted transition-all min-w-[180px] min-h-[120px] mb-2"
          >
          <div
            className={cn(
              "flex w-full items-center justify-between mb-2",
              mobileView ? "px-5" : "px-6" // Responsive padding
            )}
            // title={`Tarik ke kanvas untuk menambah ${w.label}`}
            >
            <span className="font-semibold">{w.label}</span>
            <div className="flex gap-2">
              {/* Tombol tambah widget langsung ke dashboard */}
              <Button
                size="xs"
                variant="outline"
                className="flex gap-2 items-center"
                onClick={(e) => handleAddWidget(e, w.key)}
              >
                <Plus className="w-5 h-5" />
              </Button>
              {/* Tombol help dengan tooltip deskripsi */}
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
          {/* Area preview widget dalam mode tampilan */}
          <div
            className={cn(
              "flex items-center h-40 justify-center w-full",
              w.width ? w.width : "" // Apply width khusus jika ada
            )}
          >
            {/* Render komponen widget dalam mode preview */}
            <w.component previewMode />
          </div>
        </div>
      ))}
    </>
  );
}
