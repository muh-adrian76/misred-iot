"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import DescriptionTooltip from "../other/description-tooltip";

export default function NotificationButton() {
  return (
    <DropdownMenu>
      <DescriptionTooltip content="Notifikasi Terbaru">
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled
            className="relative rounded-full cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {/* Notif */}
            {/* <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full" /> */}
            <span className="sr-only">Notifikasi</span>
          </Button>
        </DropdownMenuTrigger>
      </DescriptionTooltip>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-3 py-2 font-medium">Notifikasi Terbaru</div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <span className="text-sm">Alarm pH tinggi di Device1</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span className="text-sm">Alarm TSS rendah di Device2</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
