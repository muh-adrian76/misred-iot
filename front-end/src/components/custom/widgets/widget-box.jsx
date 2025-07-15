import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ScrollContent } from "./scroll-content";
import { ChartNoAxesCombined, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import DescriptionTooltip from "../other/description-tooltip";

export default function WidgetBox({ onChartDrag, onAddWidget, breakpoint }) {
  const [minimize, setMinimize] = useState(false);

  const widget = (
    <>
      <ScrollContent
        onChartDrag={onChartDrag}
        onAddWidget={onAddWidget}
        mobileView={breakpoint}
      />
      <ScrollBar orientation="horizontal" className="xl:hidden" />
      <ScrollBar orientation="vertical" className="hidden xl:block" />
    </>
  );

  if (breakpoint) {
    return (
      <div className="fixed bottom-18 w-8/9 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, delay: 1.5, ease: "easeInOut" }}
          className="z-10 rounded-md bg-background shadow-lg dark:shadow-[0px_0px_30px_0_rgba(255,255,255,0.15)] p-4"
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
              "w-full rounded-md pt-2 pb-3 transition-all duration-500",
              minimize === true ? "hidden" : "block"
            )}
          >
            <div className="flex flex-row xl:flex-col w-max xl:w-full h-auto xl:h-max space-x-4 xl:space-x-0 xl:space-y-4 xl:p-4">
              {widget}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed top-[140px] z-50 max-lg:top-[70px] self-start",
        minimize === true ? "right-7.5" : "right-10.5"
      )}
    >
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
        className={cn(
          "flex",
          minimize === true ? "h-16 w-[175px]" : "w-[325px] h-125"
        )}
      >
        <ScrollArea
          className={cn("w-84", minimize === true ? "" : "rounded-md border")}
        >
          <div
            className={cn(
              "flex pl-4 pr-3 justify-between items-center bg-background",
              minimize === true ? "rounded-md border py-2" : "rounded-t-md py-4"
            )}
          >
            <div className="flex gap-3 font-semibold">
              <ChartNoAxesCombined />
              <span>Widget</span>
            </div>
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
                      minimize === true ? "hidden" : "block"
                    )}
                  >
                    Perbesar
                  </span>
                </Button>
              </DescriptionTooltip>
            ) : (
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
          <div
            className={cn(
              "flex flex-row bg-background xl:flex-col w-max xl:w-full h-auto xl:h-max space-x-4 xl:space-x-0 xl:space-y-4 pb-4 px-4",
              minimize === true ? "hidden" : "block"
            )}
          >
            {widget}
          </div>
        </ScrollArea>
      </motion.div>
    </div>
  );
}
