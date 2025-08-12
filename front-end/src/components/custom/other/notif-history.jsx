"use client";

// Import dependencies untuk komponen riwayat notifikasi IoT
import { useState, useEffect } from "react";
import { useUser } from "@/providers/user-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ConfirmDialog from "@/components/custom/dialogs/confirm-dialog";
import CheckboxButton from "@/components/custom/buttons/checkbox-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Download,
  FileText,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  BellRing,
  ChartBar,
  Trash2,
  FileType,
  WifiOff,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { errorToast, successToast } from "./toaster";
import {
  exportToCSV as exportCSVUtil,
  formatDateTime,
  generateReactPDF,
} from "@/lib/export-utils";
import { NotificationHistoryPDFDocument } from "@/components/custom/other/pdf-content";
import DescriptionTooltip from "./description-tooltip";

/**
 * Fungsi utilitas untuk memformat waktu relatif
 * formatDateTime sudah diimport dari export-utils untuk format lengkap
 */
const formatTimeAgo = (dateString) => {
  // Handle null, undefined, or empty values
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return 'N/A';
  }
  
  const now = new Date();
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string in formatTimeAgo:', dateString);
    return 'N/A';
  }
  
  const diff = now.getTime() - date.getTime();

  // Handle negative diff (future dates)
  if (diff < 0) {
    return 'N/A';
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  return `${days} hari yang lalu`;
};

/**
 * Komponen NotificationHistoryItem
 *
 * Menampilkan item individual dari riwayat notifikasi IoT dengan:
 * - Tampilan berbeda untuk tipe alarm dan device status
 * - Detail lengkap sesuai tipe notifikasi
 * - Status pengiriman notifikasi (browser/WhatsApp)
 * - Timestamp dengan format yang user-friendly
 * - Hover effects untuk interaksi yang baik
 *
 * @param {Object} notification - Data notifikasi dari API backend
 */
const NotificationHistoryItem = ({ notification }) => {
  // Tentukan tipe notifikasi dan styling
  const isAlarmNotification = notification.type === 'alarm';
  const isDeviceStatusNotification = notification.type === 'device_status';
  
  // Konfigurasi tampilan berdasarkan tipe
  const getNotificationConfig = () => {
    if (isAlarmNotification) {
      return {
  icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  title: notification.title || notification.alarm_description || 'Alarm Terpicu',
        borderColor: 'border-orange-200',
        bgColor: 'hover:bg-orange-50/30 dark:hover:bg-orange-50/10',
        badgeColor: 'bg-orange-100 text-orange-800',
        badgeText: 'ALARM'
      };
    } else if (isDeviceStatusNotification) {
      return {
  icon: <WifiOff className="h-4 w-4 text-red-500" />,
  title: notification.title || 'Perubahan Status Perangkat',
        borderColor: 'border-red-200',
        bgColor: 'hover:bg-red-50/30 dark:hover:bg-red-50/10',
        badgeColor: 'bg-red-100 text-red-800',
        badgeText: 'STATUS'
      };
    } else {
      return {
  icon: <BellRing className="h-4 w-4 text-blue-500" />,
  title: notification.title || 'Notifikasi',
        borderColor: 'border-blue-200',
        bgColor: 'hover:bg-blue-50/30 dark:hover:bg-blue-50/10',
        badgeColor: 'bg-blue-100 text-blue-800',
        badgeText: 'INFO'
      };
    }
  };

  const config = getNotificationConfig();

  return (
    <div className={cn(
      "border rounded-lg p-4 space-y-3 transition-colors",
      config.borderColor,
      config.bgColor
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Header dengan ikon, title, dan badge tipe */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              {config.icon}
              <h4 className="font-medium text-foreground text-sm">
                {config.title}
              </h4>
            </div>
            <Badge className={cn("text-xs px-2 py-1", config.badgeColor)}>
              {config.badgeText}
            </Badge>
          </div>

          {/* Message/Description */}
          {/* <div className="text-sm text-muted-foreground">
            {notification.message}
          </div> */}

          {/* Detail informasi berdasarkan tipe notifikasi */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {/* Device info - selalu tampil */}
            {notification.device_description && (
              <div>
                <span className="font-medium">Perangkat:</span>{" "}
                {notification.device_description}
              </div>
            )}

            {/* Alarm-specific details */}
            {isAlarmNotification && (
              <>
                {notification.datastream_description && (
                  <div>
                    <span className="font-medium">Sensor:</span>{" "}
                    {notification.datastream_description}
                  </div>
                )}
                {notification.sensor_value !== null && notification.sensor_value !== undefined && (
                  <div>
                    <span className="font-medium">Nilai:</span>{" "}
                    {notification.sensor_value}
                  </div>
                )}
                {notification.conditions_text && (
                  <div>
                    <span className="font-medium">Kondisi:</span>{" "}
                    {notification.conditions_text}
                  </div>
                )}
              </>
            )}

            {/* Device status specific details */}
            {isDeviceStatusNotification && notification.device_name && (
              <div>
                <span className="font-medium">Perangkat:</span>{" "}
                {notification.device_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer dengan status pengiriman dan timestamp */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          {/* Status pengiriman */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(notification.triggered_at)}
          </div>
          
          {/* Read status */}
          {!notification.is_read && (
            <Badge variant="secondary" className="text-xs">
              Belum dibaca
            </Badge>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-right text-xs text-muted-foreground">
          <div className="text-xs opacity-75 mt-1">
            {formatDateTime(notification.triggered_at)}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Komponen NotifHistory (Notification History)
 *
 * Sheet dialog yang menampilkan riwayat lengkap notifikasi alarm IoT dengan fitur:
 * - Pagination untuk handling data besar
 * - Filter berdasarkan rentang waktu (hari ini, minggu ini, bulan ini, semua)
 * - Export ke CSV dan PDF
 * - Bulk delete dengan konfirmasi
 * - Loading states dan error handling
 * - Responsive design untuk mobile dan desktop
 *
 * @param {boolean} open - Status dialog terbuka/tertutup
 * @param {function} setOpen - Callback untuk mengubah status dialog
 */
export default function NotifHistory({ open, setOpen }) {
  // State untuk pagination dan filtering
  const [currentPage, setCurrentPage] = useState(1); // Halaman saat ini
  const [timeRange, setTimeRange] = useState("all"); // Filter waktu
  const [typeFilter, setTypeFilter] = useState("all"); // Filter tipe notifikasi
  const [pageSize, setPageSize] = useState(10); // Jumlah item per halaman

  // State untuk dialog konfirmasi delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);

  // State untuk data dan loading
  const [historyData, setHistoryData] = useState(null); // Data riwayat dari API
  const [isLoading, setIsLoading] = useState(false); // Loading saat fetch data
  const [error, setError] = useState(null); // Error state
  const [isDeleting, setIsDeleting] = useState(false); // Loading saat delete
  const [isExporting, setIsExporting] = useState(false); // Loading khusus untuk ekspor

  // Hook untuk user authentication
  const { user } = useUser();

  /**
   * Utility untuk memvalidasi status login user
   * Memastikan user memiliki id dan email yang valid
   */
  const isUserLoggedIn = (user) => {
    return user && user.id && user.email && user.id !== "" && user.email !== "";
  };

  /**
   * Fetch semua data notifikasi untuk ekspor (tanpa filter)
   * Mengambil semua notifikasi milik user dari database
   */
  const fetchAllNotificationsForExport = async () => {
    if (!isUserLoggedIn(user)) {
      throw new Error("User tidak terautentikasi");
    }

    try {
      // Fetch semua data tanpa filter dengan limit besar
      const params = new URLSearchParams({
        page: "1",
        limit: "10000", // Ambil semua data dengan limit besar
        timeRange: "all", // Semua waktu
        type: "", // Semua tipe
      });

      const response = await fetchFromBackend(
        `/notifications/history?${params}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data untuk ekspor");
      }

      return data.notifications || [];
    } catch (error) {
      console.error("❌ Error fetching all notifications for export:", error);
      throw error;
    }
  };

  // Fetch notification history using simple fetch (untuk UI display)
  const fetchHistoryData = async () => {
    if (!isUserLoggedIn(user)) {
      setHistoryData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        timeRange: timeRange,
        type: typeFilter === 'all' ? '' : typeFilter,
      });

      // Remove empty parameters
      if (!params.get('type')) {
        params.delete('type');
      }

      const response = await fetchFromBackend(
        `/notifications/history?${params}`
      );

      const data = await response.json();

      // Handle API errors gracefully
      if (!response.ok) {
        // If backend returns structured error response, use it
        if (data.success === false) {
          setHistoryData({
            success: false,
            notifications: [],
            pagination: {
              page: 1,
              limit: pageSize,
              total: 0,
              pages: 1,
            },
            message: data.message || "Gagal mengambil riwayat notifikasi",
          });
          return;
        }
        throw new Error("Failed to fetch notification history");
      }

      setHistoryData(data);
    } catch (error) {
      console.error("❌ Error fetching history:", error);
      setError(error);
      setHistoryData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when dependencies change
  useEffect(() => {
    if (open && user && isUserLoggedIn(user)) {
      fetchHistoryData();
    }
  }, [open, user, currentPage, timeRange, pageSize, typeFilter]);

  // Delete all notifications using simple fetch
  const deleteAllNotifications = async () => {
    if (!isUserLoggedIn(user)) {
      errorToast("User tidak terautentikasi");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetchFromBackend("/notifications", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete all notifications");
      }

      await response.json();

      setDeleteDialogOpen(false);
      setDeleteChecked(false);
      await fetchHistoryData();
      successToast("Semua riwayat notifikasi berhasil dihapus");
    } catch (error) {
      console.error("❌ Error deleting notifications:", error);
      errorToast("Gagal menghapus semua riwayat notifikasi: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    deleteAllNotifications();
  };

  // Export functions - mengekspor SEMUA data notifikasi user
  const exportToCSV = async () => {
    setIsExporting(true);
    
    try {
      // Fetch semua data notifikasi untuk ekspor
      const allNotifications = await fetchAllNotificationsForExport();
      
      if (!allNotifications?.length) {
        errorToast("Tidak ada data notifikasi untuk diekspor");
        return;
      }

      const headers = [
        "Tanggal/Waktu",
        "Tipe",
        "Judul",
        "Pesan",
        "Device",
        "Sensor",
        "Nilai",
        "Kondisi",
        "Status"
      ];

      // Sort notifications from oldest to newest for export
      const sortedNotifications = [...allNotifications].sort((a, b) => {
        const dateA = new Date(a.triggered_at);
        const dateB = new Date(b.triggered_at);
        
        // Handle invalid dates
        if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
        if (isNaN(dateA.getTime())) return 1; // Put invalid dates last
        if (isNaN(dateB.getTime())) return -1;
        
        return dateA.getTime() - dateB.getTime(); // Ascending order (oldest first)
      });

      const rows = sortedNotifications.map((notif) => [
        formatDateTime(notif.triggered_at),
  notif.type === 'alarm' ? 'Alarm' : notif.type === 'device_status' ? 'Status Perangkat' : 'Notifikasi',
        notif.title || notif.alarm_description || 'N/A',
        notif.message || 'N/A',
        notif.device_description || 'N/A',
        notif.datastream_description || 'N/A',
        notif.sensor_value !== null && notif.sensor_value !== undefined ? notif.sensor_value : 'N/A',
        notif.conditions_text || 'N/A',
        notif.is_read ? 'Dibaca' : 'Belum dibaca'
      ]);

      // Generate filename dengan timestamp saja
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
      const filename = `riwayat-notifikasi-semua-${timestamp}`;
      
      exportCSVUtil(headers, rows, filename);
      successToast(
        "CSV berhasil diekspor",
        `${sortedNotifications.length} notifikasi berhasil diekspor ke CSV`
      );
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      errorToast("Gagal mengekspor CSV: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // Fetch semua data notifikasi untuk ekspor
      const allNotifications = await fetchAllNotificationsForExport();
      
      if (!allNotifications?.length) {
        errorToast("Tidak ada data notifikasi untuk diekspor");
        return;
      }

      // Generate filename dengan timestamp saja
      const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
      const filename = `riwayat-notifikasi-semua-${timestamp}`;

      // Create React PDF Document component and generate PDF
      const DocumentComponent = NotificationHistoryPDFDocument({
        notifications: allNotifications,
        timeRange: "all", // Semua data
      });
      await generateReactPDF(DocumentComponent, filename);
      successToast(
        "PDF berhasil diekspor",
        `${allNotifications.length} notifikasi berhasil diekspor ke PDF`
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      errorToast("Gagal mengekspor PDF: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="max-w-4xl w-full">
        <SheetHeader className="border-b-2">
          <SheetTitle>Riwayat Notifikasi</SheetTitle>
          <SheetDescription className="text-left hidden" />
        </SheetHeader>
        <div className="flex flex-col w-full h-full py-6 px-0 items-center gap-4">
          <div className="overflow-hidden w-full h-full px-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <Select
                value={timeRange}
                onValueChange={(value) => {
                  setTimeRange(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <BellRing className="w-4 h-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="alarm">Alarm</SelectItem>
                  <SelectItem value="device_status">Status Device</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <ChartBar className="w-4 h-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per halaman</SelectItem>
                  <SelectItem value="20">20 per halaman</SelectItem>
                  <SelectItem value="50">50 per halaman</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={isLoading || isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Mengekspor...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Ekspor Riwayat
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-min p-1" align="center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start hover:bg-green-50 hover:text-green-600"
                    onClick={exportToCSV}
                    disabled={isLoading || isExporting}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-inherit">CSV</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start hover:bg-orange-50 hover:text-orange-600"
                    onClick={exportToPDF}
                    disabled={isLoading || isExporting}
                  >
                    <FileType className="w-4 h-4 mr-2" />
                    <span className="text-inherit">PDF</span>
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            {/* Content */}
            <ScrollArea className="max-[601px]:h-[40vh] h-[47.5vh]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">
                      Memuat riwayat...
                    </p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <XCircle className="h-16 w-16 text-red-500/40 mb-4" />
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Gagal memuat riwayat
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {historyData?.message ||
                      "Terjadi kesalahan saat mengambil data riwayat notifikasi."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistoryData()}
                    className="text-sm"
                  >
                    Coba Lagi
                  </Button>
                </div>
              ) : !historyData?.notifications?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BellRing className="h-16 w-16 text-muted-foreground/40 mb-4" />
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    Belum ada riwayat notifikasi
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Riwayat notifikasi alarm dan status device akan ditampilkan di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyData.notifications.map((notification) => (
                    <NotificationHistoryItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Pagination */}
            {historyData?.pagination &&
              !error &&
              !isLoading &&
              historyData.pagination.pages > 1 && (
                <div className="flex flex-col gap-2 items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Halaman {historyData.pagination.page} dari{" "}
                    {historyData.pagination.pages} (
                    {historyData.pagination.total} total notifikasi)
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          textStyle="sm:hidden"
                          className={cn(
                            currentPage === 1 &&
                              "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>

                      {[
                        ...Array(Math.min(5, historyData.pagination.pages)),
                      ].map((_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNumber)}
                              isActive={currentPage === pageNumber}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {historyData.pagination.pages > 5 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(historyData.pagination.pages, prev + 1)
                            )
                          }
                          textStyle="sm:hidden"
                          className={cn(
                            currentPage === historyData.pagination.pages &&
                              "pointer-events-none opacity-50"
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

            {/* Delete All History Button */}
            {historyData?.notifications?.length > 0 && (
              <DescriptionTooltip content="Sementara dinonaktifkan saat kuisioner berlangsung.">
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    // disabled={isDeleting}
                    disabled={true}
                    className="w-full"
                  >
                    {isDeleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                        Menghapus...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Semua Riwayat
                      </>
                    )}
                  </Button>
                </div>
              </DescriptionTooltip>
            )}
          </div>
        </div>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        title="Hapus Semua Riwayat Notifikasi"
        description="Apakah Anda yakin ingin menghapus semua riwayat notifikasi? Tindakan ini tidak dapat dibatalkan."
        checkbox={
          <CheckboxButton
            id="deleteNotificationHistoryCheckbox"
            text="Saya mengerti konsekuensinya."
            checked={!!deleteChecked}
            onChange={(e) => setDeleteChecked(e.target.checked)}
          />
        }
        confirmHandle={handleDeleteConfirm}
        confirmText="Hapus Semua"
        cancelText="Batal"
        confirmDisabled={!deleteChecked || isDeleting}
      />
    </Sheet>
  );
}
