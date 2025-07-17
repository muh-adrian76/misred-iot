import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Globe,
  MessageCircle,
  Search,
  CloudCog,
  HelpCircle,
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
}) {
  const [openPopoverProfile, setOpenPopoverProfile] = useState(false);
  const isAuthenticated = useAuth();
  
  // Use the custom hook for WhatsApp status
  const { whatsappEnabled, loading, refreshWhatsAppStatus } = useWhatsAppStatusStandalone();

  // Listen for custom events to refresh WhatsApp status
  useEffect(() => {
    const handleWhatsAppStatusUpdate = () => {
      refreshWhatsAppStatus();
    };

    // Listen for custom event
    window.addEventListener('whatsapp-status-updated', handleWhatsAppStatusUpdate);
    
    return () => {
      window.removeEventListener('whatsapp-status-updated', handleWhatsAppStatusUpdate);
    };
  }, [refreshWhatsAppStatus]);

  // Refresh when component becomes visible and authenticated
  useEffect(() => {
    if (isAuthenticated && showNotificationInfo) {
      refreshWhatsAppStatus();
    }
  }, [isAuthenticated, showNotificationInfo, refreshWhatsAppStatus]);

  return (
    <div className="flex items-end w-full rounded-2xl pb-3 gap-3 justify-between">
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
      <div className="flex gap-2">
        {showUploadFirmware && onUploadFirmware && (
          <div className="flex items-center gap-2 sm:px-4 sm:mx-2 sm:border-r">
            <Button
              onClick={onUploadFirmware}
              variant="outline"
              className="gap-2 transition-all"
              size={isMobile ? "icon" : "sm"}
            >
              <CloudCog className="w-4 h-4" />
              {isMobile ? "" : "Over-The-Air"}
            </Button>
          </div>
        )}

        {showNotificationInfo && (
          <Popover open={openPopoverProfile} onOpenChange={setOpenPopoverProfile}>
            <div className="flex items-center gap-2 sm:px-4 sm:mx-2 sm:border-r">
              <DescriptionTooltip content="Status Pengiriman Notifikasi">
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="relative rounded-md cursor-pointer transition-all duration-500 gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Notifikasi</span>
                  </Button>
                </PopoverTrigger>
              </DescriptionTooltip>
            </div>
            <PopoverContent align="end" className="p-3 w-auto">
              <div className="flex flex-col gap-3">
                <h4 className="font-medium text-sm text-center">Status Notifikasi Alarm</h4>
                <div className="flex flex-col gap-2">
                  <DescriptionTooltip
                    content="Notifikasi akan selalu muncul pada browser"
                    side={"top"}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium">Browser</span>
                      <span className="text-xs bg-emerald-100 px-2 py-0.5 rounded-full">Aktif</span>
                    </div>
                  </DescriptionTooltip>
                  
                  <DescriptionTooltip
                    content={
                      whatsappEnabled
                        ? "WhatsApp aktif, notifikasi akan dikirim ke nomor telepon Anda"
                        : "WhatsApp non-aktif, aktifkan pada pengaturan akun"
                    }
                  >
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      whatsappEnabled
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                    }`}>
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">WhatsApp</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        whatsappEnabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {loading ? "..." : (whatsappEnabled ? "Aktif" : "Non-aktif")}
                      </span>
                    </div>
                  </DescriptionTooltip>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ubah pengaturan notifikasi WhatsApp di halaman profil
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {onAdd && (
          <Button
            onClick={onAdd}
            className="gap-2 transition-all"
            size={isMobile ? "icon" : "sm"}
          >
            <Plus className="w-4 h-4" />
            {isMobile ? "" : content}
          </Button>
        )}
      </div>
    </div>
  );
}
