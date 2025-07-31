"use client";
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
} from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import { cn } from "@/lib/utils";
import { errorToast, successToast } from "./toaster";
import { exportToCSV as exportCSVUtil, formatDateTime, generateReactPDF } from "@/lib/export-utils";
import { NotificationHistoryPDFDocument } from "@/components/custom/other/pdf-content";

// formatDateTime is now imported from export-utils

const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  return `${days} hari yang lalu`;
};

const NotificationHistoryItem = ({ notification }) => {
  return (
    <div className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h4 className="font-medium text-foreground">
              {notification.alarm_description}
            </h4>
          </div>

          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Device:</span>{" "}
              {notification.device_description}
            </div>
            <div>
              <span className="font-medium">Sensor:</span>{" "}
              {notification.datastream_description}
            </div>
            <div>
              <span className="font-medium">Nilai:</span>{" "}
              {notification.sensor_value}
            </div>
            <div>
              <span className="font-medium">Kondisi:</span>{" "}
              {notification.conditions_text}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          {notification.whatsapp_sent ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span className="text-xs">
                Terkirim pada Browser dan WhatsApp
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-foreground">
              <CheckCircle className="w-3 h-3" />
              <span className="text-xs">Terkirim pada Browser</span>
            </div>
          )}
        </div>

        {/* <Badge
          variant={
            notification.notification_type === "all" ? "default" : "secondary"
          }
          className="text-xs"
        >
          {notification.notification_type === "all"
            ? "Browser dan WhatsApp"
            : "Hanya Browser"}
        </Badge> */}
      </div>

      <div className="text-right text-xs text-muted-foreground space-y-1">
        <div className="flex justify-between items-center gap-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(notification.triggered_at)}
          </div>
          <span className="text-xs opacity-75">
            {formatDateTime(notification.triggered_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function NotifHistory({ open, setOpen }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useUser();

  const isUserLoggedIn = (user) => {
    return user && user.id && user.email && user.id !== "" && user.email !== "";
  };

  // Fetch notification history using simple fetch
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
      });

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
  }, [open, user, currentPage, timeRange, pageSize]);

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

  // Export functions
  const exportToCSV = () => {
    if (!historyData?.notifications?.length) {
      errorToast("Tidak ada data riwayat notifikasi untuk diekspor");
      return;
    }

    const headers = [
      "Tanggal/Waktu",
      "Alarm",
      "Device",
      "Sensor",
      "Nilai",
      "Kondisi",
    ];

    // Sort notifications from oldest to newest for export
    const sortedNotifications = [...historyData.notifications].sort((a, b) => {
      const dateA = new Date(a.triggered_at);
      const dateB = new Date(b.triggered_at);
      return dateA.getTime() - dateB.getTime(); // Ascending order (oldest first)
    });

    const rows = sortedNotifications.map((notif) => [
      formatDateTime(notif.triggered_at),
      notif.alarm_description,
      notif.device_description,
      notif.datastream_description,
      notif.sensor_value,
      notif.conditions_text,
    ]);

    const filename = "riwayat-notifikasi";
    exportCSVUtil(headers, rows, filename);
    successToast("CSV berhasil diekspor", `${sortedNotifications.length} notifikasi berhasil diekspor ke CSV`);
  };

  const exportToPDF = async () => {
    // PDF export using React PDF
    if (!historyData?.notifications?.length) {
      errorToast("Tidak ada data riwayat notifikasi untuk diekspor");
      return;
    }

    try {
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `notification-history-${timestamp}`;

      // Create React PDF Document component and generate PDF
      const DocumentComponent = NotificationHistoryPDFDocument({ 
        notifications: historyData.notifications, 
        timeRange 
      });
      await generateReactPDF(DocumentComponent, filename);
      successToast("PDF berhasil diekspor", `${historyData.notifications.length} notifikasi berhasil diekspor ke PDF`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      errorToast("Gagal mengekspor PDF", error.message);
    }
  };

  return (
    <Sheet 
      open={open} 
      onOpenChange={setOpen}
    >
      <SheetContent side="right" className="max-w-4xl w-full">
        <SheetHeader className="border-b-2">
          <SheetTitle>Riwayat Notifikasi</SheetTitle>
          <SheetDescription className="text-left hidden" />
        </SheetHeader>
        <div className="flex flex-col w-full h-full py-6 px-0 items-center gap-4">
          <div className="overflow-hidden w-full h-full px-4">
            {/* Filters */}
            <div className="grid grid-cols-3 gap-3 pb-4">
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
                    disabled={
                      !historyData?.notifications?.length || error || isLoading
                    }
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ekspor
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-min p-1" align="center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start hover:bg-green-50 hover:text-green-600"
                    onClick={exportToCSV}
                    disabled={!historyData?.notifications?.length || error}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-inherit">CSV</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start hover:bg-orange-50 hover:text-orange-600"
                    onClick={exportToPDF}
                    disabled={!historyData?.notifications?.length || error}
                  >
                    <FileType className="w-4 h-4 mr-2" />
                    <span className="text-inherit">PDF</span>
                  </Button>
                </PopoverContent>
              </Popover>
            </div>

            {/* Content */}
            <ScrollArea className="h-[55vh]">
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
                    Riwayat alarm yang terpicu akan ditampilkan di sini setelah
                    Anda menyimpannya.
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
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={isDeleting}
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
