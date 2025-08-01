"use client";

// Import dependencies untuk notification center IoT  
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  BellRing,
  CheckCircle,
  X,
  Filter,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import { fetchFromBackend } from "@/lib/helper";
import DescriptionTooltip from "./description-tooltip";
import NotifHistory from "./notif-history";
import { successToast } from "./toaster";

/**
 * Fungsi helper untuk memformat waktu relatif
 * Diambil dari notif-history.jsx untuk konsistensi UI
 * Memberikan format yang user-friendly untuk timestamp
 */
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

/**
 * Fungsi helper untuk validasi status login user
 * Mengikuti pattern dari websocket-provider untuk konsistensi
 * Memastikan user benar-benar terautentikasi dengan lengkap
 */
const isUserLoggedIn = (user) => {
  // Cek apakah user ada dan tidak null
  if (!user || user.id === "") {
    return false;
  }
  
  // Validasi lengkap untuk memastikan user benar-benar login
  const isLoggedIn = user.id && 
         user.email && 
         user.id !== "" && 
         user.email !== "" &&
         user.id !== undefined &&
         user.email !== undefined;
  
  return isLoggedIn;
};

/**
 * Fungsi API default untuk mengambil notifikasi dari backend
 * Menghandle error dan response parsing dengan proper error messages
 */
const defaultFetchNotifications = async () => {
  const response = await fetchFromBackend("/notifications");
  if (!response.ok) {
    console.error("❌ Failed to fetch notifications:", response.status);
    throw new Error(`HTTP ${response.status}: Failed to fetch notifications`);
  }
  const data = await response.json();
  return data.notifications || [];
};

/**
 * Fungsi API default untuk menandai semua notifikasi sebagai telah dibaca
 */
const defaultMarkAllAsRead = async () => {
  const response = await fetchFromBackend("/notifications/read", {
    method: "PUT"
  });
  if (!response.ok) {
    console.error("❌ Failed to mark all as read:", response.status);
    throw new Error(`HTTP ${response.status}: Failed to mark all notifications as read`);
  }
  const result = await response.json();
  return result;
};

/**
 * Fungsi API default untuk menghapus semua notifikasi
 */
const defaultDeleteAllNotifications = async () => {
  const response = await fetchFromBackend("/notifications", { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Failed to delete all notifications");
  }
  return response.json();
};

/**
 * KOMPONEN NOTIFICATION ITEM
 * 
 * NotificationItem adalah sub-komponen untuk menampilkan setiap notifikasi individual
 * dalam daftar notification center. Komponen ini menghandle:
 * 
 * Fitur per item:
 * - Visual indicator untuk notifikasi yang belum dibaca (unread state)
 * - Click handler untuk membuka detail atau menandai sebagai dibaca
 * - Responsive styling dengan hover effects
 * - Timestamp formatting untuk menampilkan waktu yang user-friendly
 * - Badge status untuk membedakan notifikasi read/unread
 * 
 * Props:
 * @param {Object} notification - Data notifikasi yang akan ditampilkan
 * @param {Function} onMarkAsRead - Handler untuk menandai notifikasi sebagai dibaca
 * @param {Function} onClick - Handler untuk click pada item notifikasi
 */
const NotificationItem = ({ notification, onMarkAsRead, onClick }) => {
  // Cek status unread dari dua possible property (untuk compatibility)
  const isUnread = !notification.isRead && !notification.is_read;

  return (
    <div
      className={cn(
        "group relative p-3 border border-border/40 rounded-lg transition-all duration-200",
        isUnread
          // Styling conditional berdasarkan status read/unread
          ? "bg-muted/30 hover:bg-primary/5 border-primary/20 dark:bg-primary/20 dark:hover:bg-primary/50 shadow-sm"
          : "bg-card/50 hover:bg-muted/20 dark:bg-card/50 dark:hover:bg-accent"
      )}
      onClick={() => onClick?.(notification)}
    >
      {/* Layout flex untuk mengatur posisi konten dan indicator */}
      <div className="flex items-start justify-between gap-3">
        {/* Konten utama notifikasi */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Header dengan status indicator dan title */}
          <div className="flex items-center gap-2">
            {/* Status indicator - berubah warna dan animasi berdasarkan read state */}
            <div
              className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                isUnread ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
              )}
            />
            {/* Title/pesan utama dengan truncation untuk text panjang */}
            <p
              className={cn(
                "text-sm font-medium leading-none truncate",
                isUnread
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {notification.title}
            </p>
          </div>

          <p
            className={cn(
              "text-xs mt-2 leading-relaxed whitespace-pre-line",
              isUnread
                ? "text-foreground/80"
                : "text-muted-foreground"
            )}
          >
            {notification.message}
          </p>

          {/* Footer dengan timestamp dan border separator */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            {/* Timestamp dengan format yang user-friendly */}
            <span className="text-xs text-muted-foreground font-medium">
              {formatTimeAgo(notification.createdAt || notification.triggered_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * KOMPONEN UTAMA NOTIFICATION CENTER
 * 
 * NotificationCenter adalah komponen utama yang mengelola sistem notifikasi real-time
 * untuk IoT dashboard. Komponen ini menyediakan interface lengkap untuk:
 * 
 * Fitur-fitur utama:
 * - Real-time notification management dengan WebSocket
 * - Persistent storage menggunakan localStorage
 * - Browser notifications untuk alert di luar aplikasi
 * - Bulk operations (mark all as read, delete all)
 * - Auto-refresh dan caching mechanism
 * - Responsive popover interface
 * - Integration dengan authentication system
 * 
 * Varian tampilan:
 * - "full": Tampilan lengkap dengan semua fitur dan controls
 * - "compact": Tampilan minimal untuk space-constrained areas
 * 
 * Props yang diterima:
 * @param {string} className - Additional CSS classes
 * @param {string} variant - Varian tampilan ("full" | "compact")
 * @param {Array} notifications - Static notifications (optional, untuk testing)
 * @param {Function} fetchNotifications - Custom function untuk fetch data
 * @param {Function} onMarkAllAsRead - Custom handler untuk mark all as read
 * @param {Function} onDeleteAllNotifications - Custom handler untuk delete all
 */
export function NotificationCenter({
  className,
  variant = "full",
  notifications: staticNotifications,
  fetchNotifications = defaultFetchNotifications,
  onMarkAllAsRead = defaultMarkAllAsRead,
  onDeleteAllNotifications = defaultDeleteAllNotifications,
  onNotificationClick,
  maxHeight = "h-96",
  showFilter = true,
  showMarkAllRead = true,
  showDeleteAll = true,
  enableRealTimeUpdates = false,
  updateInterval = 30000,
  enableBrowserNotifications = false,
  align = "end",
  emptyState = {
    title: "Tidak ada alarm yang terpicu.",
    description: "Alarm yang terpicu akan otomatis ditampilkan disini.",
  },
}) {
  // ===== STATE MANAGEMENT =====
  // State untuk mengontrol visibility popover dan history dialog
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // State untuk filter tampilan notifikasi (all/unread)
  const [filter, setFilter] = useState("unread");
  
  // State untuk operasi mark all as read (mencegah multiple calls)
  const [isProcessingMarkAll, setIsProcessingMarkAll] = useState(false);
  
  // State untuk notifikasi yang tersimpan di database
  const [savedNotifications, setSavedNotifications] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [savedNotificationsError, setSavedNotificationsError] = useState(null);
  const markAllMutexRef = React.useRef(false);
  const popoverOpenRef = React.useRef(false); // Add ref to track popover state more reliably
  const { user } = useUser(); // Add user context
  const {
    ws,
    alarmNotifications = [],
    clearAlarmNotifications,
    removeAlarmNotification,
  } = useWebSocket();

  // Always use database functionality - remove static mode logic

  // Fetch saved notifications from database using simple fetch
  const fetchSavedNotifications = async () => {
    if (!isUserLoggedIn(user)) {
      setSavedNotifications([]);
      return;
    }
    
    setIsLoadingSaved(true);
    setSavedNotificationsError(null);
    
    try {
      const notifications = await fetchNotifications();
      setSavedNotifications(notifications || []);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      setSavedNotificationsError(error);
      setSavedNotifications([]);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Load notifications when user changes or component mounts
  useEffect(() => {
    if (user && isUserLoggedIn(user)) {
      fetchSavedNotifications();
    } else {
      setSavedNotifications([]);
    }
  }, [user, filter]);

  // Display notifications based on filter
  const displayNotifications = useMemo(() => {
    let notifications = [];
    
    if (filter === "unread") {
      // For unread filter: 
      // 1. WebSocket notifications (always unread, real-time)
      // 2. Database unread notifications (persisted unread)
      notifications = [...alarmNotifications, ...savedNotifications];
    } else {
      // For all filter: Use database history (all notifications regardless of read status)
      notifications = savedNotifications;
    }
    
    // Remove duplicates by ID (prefer WebSocket version if exists)
    const uniqueNotifications = notifications.reduce((acc, notification) => {
      const existingIndex = acc.findIndex(n => n.id === notification.id);
      if (existingIndex === -1) {
        // Normalize isRead field (support both isRead and is_read)
        const normalizedNotification = {
          ...notification,
          isRead: notification.isRead || notification.is_read || false,
          // Ensure we have all required fields for display
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt || notification.triggered_at || new Date().toISOString()
        };
        acc.push(normalizedNotification);
      }
      return acc;
    }, []);
    
    // Apply additional filter if needed (for "unread" mode, ensure we only show unread)
    let filteredNotifications = uniqueNotifications;
    if (filter === "unread") {
      filteredNotifications = uniqueNotifications.filter(n => !n.isRead);
    }
    
    // Sort by createdAt/triggered_at
    const sortedNotifications = filteredNotifications.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.triggered_at);
      const dateB = new Date(b.createdAt || b.triggered_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedNotifications;
  }, [alarmNotifications, savedNotifications, filter]);

  const prevDisplayNotificationsRef = React.useRef(null);

  useEffect(() => {
    if (
      enableBrowserNotifications &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const newNotifications = displayNotifications.filter(
        (notification) =>
          !prevDisplayNotificationsRef.current?.some(
            (prev) => prev.id === notification.id
          )
      );

      newNotifications.forEach((notification) => {
        new window.Notification(notification.title, {
          body: notification.message,
          icon: "/web-logo.svg",
        });
      });
    }
    prevDisplayNotificationsRef.current = displayNotifications;
  }, [displayNotifications, enableBrowserNotifications]);

  // Custom popover control function 
  const handlePopoverOpenChange = (open) => {
    setIsPopoverOpen(open);
    popoverOpenRef.current = open;
  };

  // Mark all notifications as read - SIMPLE REST API VERSION
  const handleMarkAllAsRead = async () => {
    if (markAllMutexRef.current || isProcessingMarkAll) {
      return;
    }
    setIsProcessingMarkAll(true);
    markAllMutexRef.current = true;
    
    try {
      // Clear WebSocket notifications first
      if (alarmNotifications.length > 0) {
        clearAlarmNotifications();
      }

      const response = await fetchFromBackend("/notifications/read", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to mark all notifications as read'}`);
      }
      
      await fetchSavedNotifications();
      successToast("Semua notifikasi telah dibaca.", "Anda dapat membacanya kembali pada riwayat notifikasi.");
      setIsHistoryOpen(true);
    } catch (error) {
      console.error("❌ Error marking all notifications as read:", error);
      alert(`❌ Gagal menandai notifikasi dibaca: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessingMarkAll(false);
      markAllMutexRef.current = false;
    }
  };

  const unreadCount = useMemo(
    () => {
      // Always calculate unread count from all available notifications, not just filtered
      const allNotifications = [...alarmNotifications, ...savedNotifications];
      const uniqueNotifications = allNotifications.reduce((acc, notification) => {
        const existingIndex = acc.findIndex(n => n.id === notification.id);
        if (existingIndex === -1) {
          acc.push(notification);
        }
        return acc;
      }, []);
      return uniqueNotifications.filter(n => !n.isRead && !n.is_read).length;
    },
    [alarmNotifications, savedNotifications]
  );

  const totalCount = useMemo(
    () => displayNotifications.length,
    [displayNotifications]
  );

  const NotificationList = () => (
    <ScrollArea className={cn(maxHeight)}>
      {isLoadingSaved ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Loading notifications...
            </p>
          </div>
        </div>
      ) : savedNotificationsError ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-[40vh]">
          <X className="h-16 w-16 text-red-500/40 mb-4" />
          <h3 className="font-semibold text-lg text-foreground mb-2">
            Gagal memuat notifikasi
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {savedNotificationsError.message || "Terjadi kesalahan saat mengambil data notifikasi."}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchSavedNotifications()}
            className="text-sm"
          >
            Coba Lagi
          </Button>
        </div>
      ) : displayNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center h-[40vh]">
          <BellRing className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg text-foreground mb-2">
            Tidak ada notifikasi baru
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Notifikasi alarm akan muncul di sini saat terpicu
          </p>
        </div>
      ) : (
        <div className="space-y-2 px-3">
          {displayNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={(id) => {
                // Only handle WebSocket notifications - database notifications will be handled by "Mark All Read" button
                if (alarmNotifications.some(n => n.id === id)) {
                  removeAlarmNotification(id);
                }
              }}
              onClick={onNotificationClick}
            />
          ))}
        </div>
      )}
    </ScrollArea>
  );

  if (variant === "popover") {
    return (
      <>
        <Popover 
          open={isPopoverOpen} 
          onOpenChange={handlePopoverOpenChange}
        >
          <DescriptionTooltip content={"Notifikasi Terbaru"}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "relative hover:bg-muted transition-all duration-500 hover:scale-105",
                  className
                )}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </Button>
            </PopoverTrigger>
          </DescriptionTooltip>
          <PopoverContent
            className="w-84 p-0 max-sm:mr-3 shadow-xl border-border/50"
            side="bottom"
            align={align}
            sideOffset={8}
          >
            <div className="p-4 border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-lg text-foreground">
                    Pesan Notifikasi
                  </h4>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      {unreadCount} baru
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-muted"
                  onClick={() => setIsPopoverOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="px-1 py-3">
              {/* Filter Toggle and Mark All Read Controls */}
              <div className="flex items-center justify-between gap-2 mb-3 px-4">
                {/* Filter Toggle Button */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFilter(filter === "unread" ? "all" : "unread");
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Filter className="mr-1.5 h-3 w-3" />
                  {filter === "unread" ? "Belum dibaca" : "Semua"}
                </Button> */}

                {/* Mark All Read Button */}
                {showMarkAllRead && (unreadCount > 0 || isProcessingMarkAll) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 text-xs w-full transition-all duration-200",
                      isProcessingMarkAll && "opacity-75 cursor-not-allowed"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllAsRead();
                    }}
                    disabled={isProcessingMarkAll}
                  >
                    {isProcessingMarkAll ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1.5" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-1.5 h-3 w-3" />
                        Tandai telah dibaca
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="max-h-96">
                <NotificationList />
              </div>
            </div>
            <div className="p-2 flex items-center justify-center border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full cursor-pointer"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setIsHistoryOpen(true);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                Lihat riwayat lengkap
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <NotifHistory 
          open={isHistoryOpen} 
          setOpen={setIsHistoryOpen} 
        />
      </>
    );
  }

  return (
    <Card
      className={cn("w-full max-w-2xl shadow-sm border-border/50", className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-foreground" />
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>
            <span className="text-xl font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {showMarkAllRead && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleMarkAllAsRead()}
                disabled={isProcessingMarkAll}
              >
                {isProcessingMarkAll ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1.5" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-1.5 h-3 w-3" />
                    Tandai telah dibaca
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <NotificationList />
      </CardContent>
    </Card>
  );
}
