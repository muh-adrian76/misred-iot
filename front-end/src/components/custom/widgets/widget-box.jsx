import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ScrollContent } from "./scroll-content";
import { ChartNoAxesCombined, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function WidgetBox({ onChartDrag, isMobile }) {
  const [minimize, setMinimize] = useState(false);

  const widget = (
    <>
      <ScrollContent onChartDrag={onChartDrag} isMobile={isMobile} />
      <ScrollBar orientation="horizontal" className="xl:hidden" />
      <ScrollBar orientation="vertical" className="hidden xl:block" />
    </>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-18 w-8/9 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, delay: 1.5, ease: "easeInOut" }}
          className="widget-box z-10 rounded-md bg-background shadow-lg dark:shadow-[0px_0px_30px_0_rgba(255,255,255,0.15)] p-4"
        >
          <div className="flex gap-2 justify-between items-center">
            <div className="flex gap-3 font-semibold">
              <ChartNoAxesCombined />
              <span>Kotak Widget</span>
            </div>
            {minimize === true ? (
              <Button
                size="xs"
                variant="ghost"
                className="opacity-80 hover:opacity-100"
                onClick={() => {
                  setMinimize(false);
                }}
              >
                <Maximize2 className="w-5 h-5 mr-2" /> Perbesar
              </Button>
            ) : (
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
          <ScrollArea
            className={cn(
              "w-full rounded-md pt-2 pb-3",
              minimize === true ? "hidden" : "block"
            )}
          >
            <div className="flex flex-row xl:flex-col w-max xl:w-full h-auto xl:h-max space-x-4 xl:space-x-0 xl:space-y-4">
              {widget}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed top-[140px] self-start">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
        className="flex w-[325px] h-125 bg-background"
      >
        <ScrollArea className="w-84 rounded-md border">
          <div className="flex pt-4 pb-0 px-4 justify-center items-center">
            <div className="flex gap-3 font-semibold">
              <ChartNoAxesCombined />
              <span>Kotak Widget</span>
            </div>
          </div>
          <div className="flex flex-row lg:flex-col w-max lg:w-full h-auto lg:h-max space-x-4 lg:space-x-0 lg:space-y-4 p-4">
            {widget}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}
