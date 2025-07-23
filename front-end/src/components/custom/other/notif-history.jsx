"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
} from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import { cn } from "@/lib/utils";

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

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
            {notification.whatsapp_sent && (
              <Badge variant="outline" className="text-xs">
                <Smartphone className="w-3 h-3 mr-1" />
                WhatsApp
              </Badge>
            )}
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

        <div className="text-right text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(notification.triggered_at)}
          </div>
          <div className="text-xs opacity-75">
            {formatDateTime(notification.triggered_at)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          {notification.whatsapp_sent ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span className="text-xs">WhatsApp terkirim</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <XCircle className="w-3 h-3" />
              <span className="text-xs">Hanya browser</span>
            </div>
          )}
        </div>

        <Badge
          variant={
            notification.notification_type === "all" ? "default" : "secondary"
          }
          className="text-xs"
        >
          {notification.notification_type === "all"
            ? "Browser dan WhatsApp"
            : "Hanya Browser"}
        </Badge>
      </div>
    </div>
  );
};

export default function NotifHistory({ open, setOpen }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeRange, setTimeRange] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

  // Fetch notification history
  const {
    data: historyData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["notification-history", currentPage, timeRange, pageSize],
    queryFn: async () => {
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
          return {
            success: false,
            notifications: [],
            pagination: {
              page: 1,
              limit: pageSize,
              total: 0,
              pages: 1
            },
            message: data.message || "Gagal mengambil riwayat notifikasi"
          };
        }
        throw new Error("Failed to fetch notification history");
      }
      
      return data;
    },
    enabled: open && activeIndex === 0,
    retry: 1, // Only retry once
    refetchOnWindowFocus: false,
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetchFromBackend("/notifications/mark-all-read", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refetch the current page data
      refetch();
    },
    onError: (error) => {
      alert("Gagal menandai semua notifikasi sebagai dibaca: " + error.message);
    },
  });

  // Export functions
  const exportToCSV = () => {
    if (!historyData?.notifications?.length) return;

    const headers = [
      "Tanggal/Waktu",
      "Alarm",
      "Device",
      "Sensor",
      "Nilai",
      "Kondisi",
      "WhatsApp Status",
      "Tipe Notifikasi",
    ];

    const rows = historyData.notifications.map((notif) => [
      formatDateTime(notif.triggered_at),
      notif.alarm_description,
      notif.device_description,
      notif.datastream_description,
      notif.sensor_value,
      notif.conditions_text,
      notif.whatsapp_sent ? "Terkirim" : "Tidak dikirim",
      notif.notification_type === "all" ? "Semua Channel" : "Browser Only",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `riwayat-notifikasi-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToPDF = async () => {
    // Simple PDF export using window.print with custom styles
    if (!historyData?.notifications?.length) return;

    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Riwayat Notifikasi Alarm</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .metadata { margin-bottom: 20px; font-size: 14px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Riwayat Notifikasi Alarm</h1>
          <div class="metadata">
            <p>Periode: ${timeRange === "today" ? "Hari ini" : timeRange === "week" ? "Minggu ini" : timeRange === "month" ? "Bulan ini" : "Semua"}</p>
            <p>Total: ${historyData.notifications.length} notifikasi</p>
            <p>Dicetak: ${formatDateTime(new Date().toISOString())}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tanggal/Waktu</th>
                <th>Alarm</th>
                <th>Device</th>
                <th>Sensor</th>
                <th>Nilai</th>
                <th>Kondisi</th>
                <th>WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              ${historyData.notifications
                .map(
                  (notif) => `
                <tr>
                  <td>${formatDateTime(notif.triggered_at)}</td>
                  <td>${notif.alarm_description}</td>
                  <td>${notif.device_description}</td>
                  <td>${notif.datastream_description}</td>
                  <td>${notif.sensor_value}</td>
                  <td>${notif.conditions_text}</td>
                  <td>${notif.whatsapp_sent ? "✓ Terkirim" : "✗ Tidak"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
                    disabled={!historyData?.notifications?.length || error || isLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ekspor
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-min p-1" align="end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={exportToCSV}
                      disabled={!historyData?.notifications?.length || error}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ekspor CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={exportToPDF}
                      disabled={!historyData?.notifications?.length || error}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ekspor PDF
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
                    {historyData?.message || "Terjadi kesalahan saat mengambil data riwayat notifikasi."}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetch()}
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
                  {historyData.pagination.pages} ({historyData.pagination.total}{" "}
                  total notifikasi)
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {[...Array(Math.min(5, historyData.pagination.pages))].map(
                      (_, i) => {
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
                      }
                    )}

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

            {/* Mark All as Read Button */}
            {historyData?.notifications?.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    markAllAsReadMutation.mutate();
                  }}
                  disabled={markAllAsReadMutation.isPending}
                  className="w-full"
                >
                  {markAllAsReadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground mr-2"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Tandai Semua Sebagai Dibaca
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
