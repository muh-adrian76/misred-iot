// Import hooks dan komponen yang diperlukan
import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ScrollContent } from "./scroll-content";
import { ChartNoAxesCombined, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import DescriptionTooltip from "../other/description-tooltip";

// Komponen WidgetBox untuk menampilkan panel widget yang dapat ditambahkan ke dashboard
export default function WidgetBox({ onChartDrag, onAddWidget, breakpoint }) {
  // State untuk kontrol minimize/maximize widget box
  const [minimize, setMinimize] = useState(false);

  // Komponen konten widget yang akan di-scroll
  const widget = (
    <>
      {/* Konten daftar widget yang dapat di-drag atau ditambahkan */}
      <ScrollContent
        onChartDrag={onChartDrag} // Handler drag widget ke grid
        onAddWidget={onAddWidget} // Handler tambah widget langsung
        mobileView={breakpoint} // Flag untuk tampilan mobile
      />
      {/* Scrollbar horizontal untuk layar kecil/medium */}
      <ScrollBar orientation="horizontal" className="xl:hidden" />
      {/* Scrollbar vertikal untuk layar besar */}
      <ScrollBar orientation="vertical" className="hidden xl:block" />
    </>
  );

  // Tampilan untuk mobile/breakpoint kecil
  if (breakpoint) {
    return (
      <div className="fixed bottom-18 w-8/9 left-1/2 -translate-x-1/2">
        {/* Animasi masuk dengan delay untuk widget box mobile */}
        <motion.div
          initial={{ opacity: 0, y: 50 }} // Mulai dari bawah dengan opacity 0
          animate={{ opacity: 1, y: 0 }} // Animasi ke posisi normal
          exit={{ opacity: 0, y: 50 }} // Animasi keluar ke bawah
          transition={{ duration: 0.5, delay: 1.5, ease: "easeInOut" }}
          className="z-10 rounded-md bg-card shadow-lg dark:shadow-[0px_0px_30px_0_rgba(255,255,255,0.15)] p-4"
        >
          {/* Header widget box dengan kontrol minimize/maximize */}
          <div className="flex gap-2 justify-between items-center sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-card">
            <div className="flex gap-3 font-semibold">
              <ChartNoAxesCombined />
              <span>Kotak Widget</span>
            </div>
            {/* Tombol untuk maximize jika dalam keadaan minimize */}
            {minimize === true ? (
              <Button
                size="xs"
                variant="ghost"
                className="opacity-100"
                onClick={() => {
                  setMinimize(false);
                }}
              >
                <Maximize2 className="w-5 h-5 mr-2" /> Perbesar
              </Button>
            ) : (
              /* Tombol untuk minimize jika dalam keadaan maximize */
              <Button
                size="xs"
                variant="ghost"
                className="opacity-80 hover:opacity-100"
                onClick={() => {
                  setMinimize(true);
                }}
              >
                <Minimize2 className="w-5 h-5 mr-2" /> Perkecil
              </Button>
            )}
          </div>
          {/* Area scroll untuk konten widget */}
          <ScrollArea
            className={cn(
              "w-full rounded-md pt-2 pb-3 transition-all duration-500",
              minimize === true ? "hidden" : "block" // Hide/show berdasarkan state minimize
            )}
          >
            {/* Container responsive untuk daftar widget */}
            <div className="flex flex-row xl:flex-col w-max xl:w-full h-auto xl:h-max space-x-4 xl:space-x-0 xl:space-y-4 xl:p-4">
              {widget}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    );
  }

  // Tampilan untuk desktop/layar besar
  return (
    <div
      className={cn(
        "fixed top-[140px] z-50 max-lg:top-[70px] self-start",
        minimize === true ? "right-7.5" : "right-10.5" // Posisi berubah berdasarkan minimize state
      )}
    >
      {/* Animasi masuk dari kanan untuk desktop */}
      <motion.div
        initial={{ opacity: 0, x: 50 }} // Mulai dari kanan dengan opacity 0
        animate={{ opacity: 1, x: 0 }} // Animasi ke posisi normal
        exit={{ opacity: 0, x: 50 }} // Animasi keluar ke kanan
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
        className={cn(
          "flex",
          minimize === true ? "h-16 w-[175px]" : "w-[325px] h-[80vh]" // Ukuran berubah berdasarkan minimize state
        )}
      >
        {/* Area scroll untuk widget box desktop */}
        <ScrollArea
          className={cn("w-84", minimize === true ? "" : "rounded-md border")}
        >
          {/* Header widget box desktop dengan kontrol minimize/maximize */}
          <div
            className={cn(
              "flex pl-4 pr-3 justify-between items-center bg-card sticky top-0 z-20",
              minimize === true ? "rounded-md border py-2" : "rounded-t-md py-4"
            )}
          >
            <div className="flex gap-3 font-semibold">
              <ChartNoAxesCombined />
              <span>Widget</span>
            </div>
            {/* Tombol maximize dengan tooltip (saat minimize) */}
            {minimize === true ? (
              <DescriptionTooltip content="Perbesar">
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-80 hover:opacity-100"
                  onClick={() => {
                    setMinimize(false);
                  }}
                >
                  <Maximize2 className="w-5 h-5" />
                  <span
                    className={cn(
                      "ml-2",
                      minimize === true ? "hidden" : "block" // Hide text saat minimize
                    )}
                  >
                    Perbesar
                  </span>
                </Button>
              </DescriptionTooltip>
            ) : (
              /* Tombol minimize dengan text (saat maximize) */
              <Button
                size="xs"
                variant="ghost"
                className="opacity-80 hover:opacity-100"
                onClick={() => {
                  setMinimize(true);
                }}
              >
                <Minimize2 className="w-5 h-5 mr-2" />
                <span>Perkecil</span>
              </Button>
            )}
          </div>
          {/* Container konten widget desktop */}
          <div
            className={cn(
              "flex flex-row bg-card xl:flex-col w-max xl:w-full h-auto xl:h-max space-x-4 xl:space-x-0 xl:space-y-4 pb-4 px-4",
              minimize === true ? "hidden" : "block" // Hide content saat minimize
            )}
          >
            {widget}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}
