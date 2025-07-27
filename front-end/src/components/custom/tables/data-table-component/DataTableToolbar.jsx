import { Input } from "@/components/ui/input";
import { Link } from "next-view-transitions";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Globe,
  MessageCircle,
  Search,
  CloudCog,
  HelpCircle,
  WifiCog,
  ChartBar,
} from "lucide-react";
import DescriptionTooltip from "../../other/description-tooltip";
import { useWhatsAppStatusStandalone } from "@/hooks/use-whatsapp-status";
import { useAuth } from "@/hooks/use-auth";

export default function DataTableToolbar({
  search,
  setSearch,
  searchPlaceholder,
  onAdd,
  onUploadFirmware,
  isMobile,
  content,
  showUploadFirmware = false,
  showNotificationInfo = false,
  limit = 10,
  setLimit,
}) {
  const [openPopoverProfile, setOpenPopoverProfile] = useState(false);
  const { isAuthenticated } = useAuth();

  // Use the custom hook for WhatsApp status
  const { whatsappEnabled, loading, refreshWhatsAppStatus } =
    useWhatsAppStatusStandalone();

  // Listen for custom events to refresh WhatsApp status
  useEffect(() => {
    const handleWhatsAppStatusUpdate = () => {
      refreshWhatsAppStatus();
    };

    // Listen for custom event
    window.addEventListener(
      "whatsapp-status-updated",
      handleWhatsAppStatusUpdate
    );

    return () => {
      window.removeEventListener(
        "whatsapp-status-updated",
        handleWhatsAppStatusUpdate
      );
    };
  }, [refreshWhatsAppStatus]);

  // Refresh when component becomes visible and authenticated
  useEffect(() => {
    if (isAuthenticated && showNotificationInfo) {
      refreshWhatsAppStatus();
    }
  }, [isAuthenticated, showNotificationInfo, refreshWhatsAppStatus]);

  return (
    <div className="w-full rounded-2xl pb-3 gap-3">
      {/* Mobile Layout: Buttons on top */}
      <div className="lg:hidden flex flex-col gap-3 mb-3">
        {/* Action buttons row for mobile */}
        <div className="flex gap-2 w-full">
          {showUploadFirmware && onUploadFirmware && (
            <>
              <Link
                target="_blank"
                href="https://github.com/ArthZ01/misred-iot-arduino-examples"
                className="flex-1"
              >
                <DescriptionTooltip
                  side="top"
                  content="Panduan Konfigurasi Koneksi Hardware"
                >
                  <Button
                    variant="outline"
                    className="gap-2 transition-all w-full"
                    size="sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-xs">Panduan</span>
                  </Button>
                </DescriptionTooltip>
              </Link>
              <Button
                onClick={onUploadFirmware}
                variant="outline"
                className="gap-2 transition-all flex-1"
                size="sm"
              >
                <CloudCog className="w-4 h-4" />
                <span className="text-xs">OTA</span>
              </Button>
            </>
          )}

          {showNotificationInfo && (
            <Popover
              open={openPopoverProfile}
              onOpenChange={setOpenPopoverProfile}
            >
              <DescriptionTooltip
                side="top"
                content="Status Pengiriman Notifikasi"
              >
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="relative rounded-md cursor-pointer transition-all duration-500 gap-2 flex-1"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-xs">Notifikasi</span>
                  </Button>
                </PopoverTrigger>
              </DescriptionTooltip>
              <PopoverContent
                align="center"
                className="p-3 w-[333px] mr-5"
              >
                <div className="flex flex-col gap-3">
                  <h4 className="font-medium text-sm text-center">
                    Status Notifikasi Alarm
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span className="text-sm font-medium">Browser</span>
                        </div>
                        <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      </div>
                      <p className="text-xs text-balance text-emerald-600">
                        Tekan tombol Lonceng diatas untuk melihat notifikasi yang
                        masuk.
                      </p>
                    </div>

                    <div
                      className={`flex flex-col gap-2 px-3 py-2 rounded-lg border ${
                        whatsappEnabled
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">WhatsApp</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            whatsappEnabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {loading
                            ? "..."
                            : whatsappEnabled
                              ? "Aktif"
                              : "Non-aktif"}
                        </span>
                      </div>
                      <p
                        className={`text-xs text-balance ${
                          whatsappEnabled ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        {whatsappEnabled
                          ? "Notifikasi akan dikirim ke nomor telepon Anda"
                          : "Aktifkan pada pengaturan akun untuk menerima notifikasi WhatsApp"}
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {onAdd && (
            <Button
              onClick={onAdd}
              className="gap-2 transition-all flex-1"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs">{content}</span>
            </Button>
          )}
        </div>

        {/* Search and limit controls for mobile */}
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex-1">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10"
              noInfo
            />
            <span className="absolute right-3 top-2.5 text-muted-foreground">
              <Search className="w-4 h-4" />
            </span>
          </div>

          {/* Data Limit Select for mobile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <DescriptionTooltip content="Data per halaman" side="top">
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit && setLimit(parseInt(value))}
              >
                <SelectTrigger className="data-limit-select w-24 h-9 bg-background transition-colors">
                  <ChartBar className="w-4 h-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border shadow-lg rounded-md min-w-[100px]"
                  align="center"
                >
                  <SelectItem value="10" className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer transition-colors text-sm">
                    10
                  </SelectItem>
                  <SelectItem value="20" className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer transition-colors text-sm">
                    20
                  </SelectItem>
                  <SelectItem value="50" className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer transition-colors text-sm">
                    50
                  </SelectItem>
                </SelectContent>
              </Select>
            </DescriptionTooltip>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Original layout */}
      <div className="max-lg:hidden flex flex-row items-end w-full gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-xs">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs pr-10"
              noInfo
            />
            <span className="absolute right-3 top-2.5 text-muted-foreground">
              <Search className="w-4 h-4" />
            </span>
          </div>

          {/* Data Limit Select for desktop */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <DescriptionTooltip content="Jumlah data per halaman" side="top">
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit && setLimit(parseInt(value))}
              >
                <SelectTrigger className="data-limit-select w-full h-9 bg-background transition-colors">
                  <ChartBar className="w-4 h-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border shadow-lg rounded-md min-w-[100px]"
                  align="center"
                >
                  <SelectItem value="10" className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer transition-colors text-sm">
                    <div className="flex items-center gap-2">
                      <span>10</span>
                      <span className="text-xs text-muted-foreground">
                        data per halaman
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="20" className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer transition-colors text-sm">
                    <div className="flex items-center gap-2">
                      <span>20</span>
                      <span className="text-xs text-muted-foreground">
                        data per halaman
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="50" className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer transition-colors text-sm">
                    <div className="flex items-center gap-2">
                      <span>50</span>
                      <span className="text-xs text-muted-foreground">
                        data per halaman
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </DescriptionTooltip>
          </div>
        </div>
        
        <div className="flex gap-2">
          {showUploadFirmware && onUploadFirmware && (
            <div className="flex items-center gap-2 sm:px-4 sm:mx-2 sm:border-r dark:sm:border-r-gray-700">
              <Link
                target="_blank"
                href="https://github.com/ArthZ01/misred-iot-arduino-examples"
                className="flex sm:border-r sm:pr-4"
              >
                <DescriptionTooltip
                  side="left"
                  content="Panduan Konfigurasi Koneksi Hardware"
                >
                  <Button
                    variant="outline"
                    className="gap-2 transition-all"
                    size="sm"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Panduan Koneksi
                  </Button>
                </DescriptionTooltip>
              </Link>
              <Button
                onClick={onUploadFirmware}
                variant="outline"
                className="sm:ml-2 gap-2 transition-all"
                size="sm"
              >
                <CloudCog className="w-4 h-4" />
                Over-The-Air
              </Button>
            </div>
          )}

          {showNotificationInfo && (
            <Popover
              open={openPopoverProfile}
              onOpenChange={setOpenPopoverProfile}
            >
              <div className="flex items-center gap-2 sm:px-4 sm:mx-2 sm:border-r dark:sm:border-r-gray-700">
                <DescriptionTooltip
                  side="left"
                  content="Status Pengiriman Notifikasi"
                >
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="relative rounded-md cursor-pointer transition-all duration-500 gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Panduan Notifikasi</span>
                    </Button>
                  </PopoverTrigger>
                </DescriptionTooltip>
              </div>
              <PopoverContent
                align="end"
                className="p-3 w-auto"
              >
                <div className="flex flex-col gap-3">
                  <h4 className="font-medium text-sm text-center">
                    Status Notifikasi Alarm
                  </h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <span className="text-sm font-medium">Browser</span>
                        </div>
                        <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-balance text-emerald-600">
                        Tekan tombol Lonceng diatas untuk melihat notifikasi yang
                        masuk.
                      </p>
                    </div>

                    <div
                      className={`flex flex-col gap-2 px-3 py-2 rounded-lg border ${
                        whatsappEnabled
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">WhatsApp</span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            whatsappEnabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {loading
                            ? "..."
                            : whatsappEnabled
                              ? "Aktif"
                              : "Non-aktif"}
                        </span>
                      </div>
                      <p
                        className={`text-xs sm:text-sm text-balance ${
                          whatsappEnabled ? "text-green-600" : "text-gray-600"
                        }`}
                      >
                        {whatsappEnabled
                          ? "Notifikasi akan dikirim ke nomor telepon Anda"
                          : "Aktifkan pada pengaturan akun untuk menerima notifikasi WhatsApp"}
                      </p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {onAdd && (
            <Button
              onClick={onAdd}
              className="gap-2 transition-all"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              {content}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
