import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TransitionPanel } from "@/components/ui/transition-panel";
import OtaaInfoSection from "./otaa-info";
import OtaaUploadSection from "./otaa-upload";

export default function OtaaSheet({ 
  open, 
  setOpen, 
  devices = [],
  boardOptions = [],
  handleFirmwareUploaded 
}) {
  const [activeIndex, setActiveIndex] = useState(0);
const boardTypesInUse = [...new Set(devices.map(device => device.board_type).filter(Boolean))];

  const ITEMS = [
    {
      title: "Daftar Firmware",
      content: (
        <OtaaInfoSection
          boardTypes={boardTypesInUse}
          devices={devices}
        />
      ),
    },
    {
      title: "Upload Firmware",
      content: (
        <OtaaUploadSection
          boardOptions={boardOptions}
          boardTypesInUse={boardTypesInUse}
          devices={devices}
          handleFirmwareUploaded={handleFirmwareUploaded}
          setOpen={setOpen}
        />
      ),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-md w-full">
        <SheetHeader className="border-b-2">
          <SheetTitle>Over-The-Air (OTAA)</SheetTitle>
          <SheetDescription className="text-left hidden">
            Upload firmware berdasarkan tipe board untuk semua device
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col w-full h-full py-6 px-0 items-center gap-4">
          <div className="flex space-x-2">
            {ITEMS.map((item, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  activeIndex === index
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="overflow-hidden w-full h-full px-8">
            <TransitionPanel
              activeIndex={activeIndex}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              variants={{
                enter: { opacity: 0, y: -50, filter: "blur(4px)" },
                center: { opacity: 1, y: 0, filter: "blur(0px)" },
                exit: { opacity: 0, y: 50, filter: "blur(4px)" },
              }}
            >
              {ITEMS.map((item, index) => (
                <div key={index} className="py-2">
                  {item.content}
                </div>
              ))}
            </TransitionPanel>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}