"use client";
import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brandLogo, fetchFromBackend } from "@/lib/helper";
import DescriptionTooltip from "@/components/custom/other/description-tooltip";
import NotifHistory from "@/components/custom/other/notif-history";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CheckCircle,
  Filter,
  History,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const defaultFetchNotifications = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [];
};

const defaultMarkAsRead = async (id) => {
  try {
    const response = await fetchFromBackend(`/notifications/${id}/read`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }
    return response.json();
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

const defaultMarkAllAsRead = async () => {
  try {
    const response = await fetchFromBackend("/notifications/mark-all-read", {
      method: "POST",
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: Failed to mark all notifications as read`);
    }
    
    return data;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error; // Re-throw to let the mutation handle it
  }
};

const defaultDeleteAllNotifications = async () => {
  try {
    const response = await fetchFromBackend("/notifications/delete-all", {
      method: "POST",
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: Failed to delete all notifications`);
    }
    
    return data;
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw error;
  }
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

const getPriorityColor = (priority) => {
  switch (priority) {
    case "high":
      return "text-red-500";
    case "medium":
      return "text-yellow-500";
    case "low":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
};

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onClick,
}) => {
  const handleClick = async () => {
    // Mark as read when clicked (if not already read)
    if (!notification.isRead && onMarkAsRead) {
      try {
        await onMarkAsRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:bg-muted/30 hover:shadow-sm",
        !notification.isRead &&
          "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10 dark:border-l-red-400",
        notification.isRead && "border-border hover:border-muted-foreground/20"
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5 flex-shrink-0">
        <Bell
          className={cn("h-4 w-4", getPriorityColor(notification.priority))}
        />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  "text-sm leading-tight",
                  !notification.isRead
                    ? "font-semibold text-foreground"
                    : "font-medium text-muted-foreground"
                )}
              >
                {notification.title}
              </h4>
              {!notification.isRead && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  Baru
                </span>
              )}
            </div>

            <p
              className={cn(
                "text-sm leading-relaxed",
                !notification.isRead
                  ? "text-foreground/80"
                  : "text-muted-foreground"
              )}
            >
              {notification.message}
            </p>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground font-medium">
                {formatTimeAgo(notification.createdAt)}
              </span>
              {/* {!notification.isRead && (
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Klik untuk tandai dibaca
                </span>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function NotificationCenter({
  className,
  variant = "full",
  notifications: staticNotifications,
  fetchNotifications = defaultFetchNotifications,
  onMarkAsRead = defaultMarkAsRead,
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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useUser(); // Add user context
  const {
    ws,
    alarmNotifications = [],
    removeAlarmNotification,
    clearAlarmNotifications,
  } = useWebSocket();

  // Helper function to check if user is logged in
  const isUserLoggedIn = (user) => {
    return user && user.id && user.email && user.id !== "" && user.email !== "";
  };

  useEffect(() => {
    if (
      enableBrowserNotifications &&
      typeof window !== "undefined" &&
      "Notification" in window
    ) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [enableBrowserNotifications]);

  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, updateInterval, queryClient]);

  // Fetch unread notifications from database - ONLY when user is logged in
  const {
    data: savedNotifications = [],
    isLoading: isLoadingSaved,
    refetch: refetchSaved,
    error: savedNotificationsError,
  } = useQuery({
    queryKey: ["unread-notifications"],
    queryFn: async () => {
      try {
        console.log("🔍 Fetching unread notifications from /notifications/");
        const response = await fetchFromBackend("/notifications/");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch notifications`);
        }
        const data = await response.json();
        console.log("📥 Received unread notifications:", data);
        return data.notifications || [];
      } catch (error) {
        console.error("Error fetching unread notifications:", error);
        throw error; // Re-throw to let React Query handle it
      }
    },
    enabled: Boolean(user && isUserLoggedIn(user)), // Ensure it always returns a boolean
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale to force refetch
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Display only unread notifications from database (savedNotifications)
  // WebSocket notifications (alarmNotifications) are temporary until saved to database
  const displayNotifications = useMemo(() => {
    console.log("🔄 Computing displayNotifications...");
    console.log("📡 WebSocket notifications (alarmNotifications):", alarmNotifications);
    console.log("💾 Database notifications (savedNotifications):", savedNotifications);
    
    // Combine WebSocket notifications (temporary) + Database unread notifications
    const combinedNotifications = [...alarmNotifications, ...savedNotifications];
    console.log("🔗 Combined notifications:", combinedNotifications);
    
    // Remove duplicates by ID (prefer WebSocket version if exists)
    const uniqueNotifications = combinedNotifications.reduce((acc, notification) => {
      const existingIndex = acc.findIndex(n => n.id === notification.id);
      if (existingIndex === -1) {
        acc.push(notification);
      }
      return acc;
    }, []);
    
    console.log("🎯 Unique notifications:", uniqueNotifications);
    
    // Sort by createdAt/triggered_at
    const sortedNotifications = uniqueNotifications.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.triggered_at);
      const dateB = new Date(b.createdAt || b.triggered_at);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log("📈 Final sorted notifications:", sortedNotifications);
    return sortedNotifications;
  }, [alarmNotifications, savedNotifications]);

  const prevDisplayNotificationsRef = React.useRef(null);

  useEffect(() => {
    if (
      enableBrowserNotifications &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const oldNotifications = prevDisplayNotificationsRef.current;

      if (oldNotifications) {
        const newNotifications = displayNotifications.filter(
          (n) => !oldNotifications.some((on) => on.id === n.id)
        );

        newNotifications.forEach((notification) => {
          if (!notification.isRead) {
            new Notification(notification.title, {
              body: notification.message,
              icon: brandLogo,
            });
          }
        });
      }
    }
    prevDisplayNotificationsRef.current = displayNotifications;
  }, [displayNotifications, enableBrowserNotifications]);

  const markAsReadMutation = useMutation({
    mutationFn: onMarkAsRead,
    onSuccess: async (data, id) => {
      if (staticNotifications || !isUserLoggedIn(user)) return;

      console.log(`✅ Notification ${id} marked as read successfully:`, data);
      
      // Remove from WebSocket notifications if present
      removeAlarmNotification(id);
      
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      await refetchSaved();
      
      // Also invalidate history to ensure it updates
      queryClient.invalidateQueries({ queryKey: ["notification-history"] });
    },
    onError: (error) => {
      console.error("Failed to mark notification as read:", error);
      alert(`Gagal menandai notifikasi dibaca: ${error.message || "Unknown error"}`);
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: onMarkAllAsRead,
    onSuccess: async (data) => {
      if (!isUserLoggedIn(user)) return;
      
      console.log("✅ Successfully marked all notifications as read:", data);
      console.log("📊 Current displayNotifications before clear:", displayNotifications);
      console.log("📊 Current savedNotifications before clear:", savedNotifications);
      
      // Clear WebSocket notifications immediately
      clearAlarmNotifications();

      // Force immediate refetch of unread notifications
      console.log("🔄 Forcing refetch of unread notifications...");
      await queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
      await queryClient.refetchQueries({ queryKey: ["unread-notifications"] });
      
      // Also invalidate history to ensure it updates
      queryClient.invalidateQueries({ queryKey: ["notification-history"] });

      // Show success feedback
      const affectedRows = data?.affected_rows || 0;
      console.log("📈 Affected rows:", affectedRows);
      if (affectedRows > 0) {
        alert(`✅ Berhasil menandai ${affectedRows} notifikasi sebagai dibaca`);
      } else {
        console.warn("⚠️ No rows affected - might be an issue with the update");
      }
    },
    onError: (error) => {
      console.error("❌ Error marking all notifications as read:", error);
      alert(`Gagal menandai notifikasi dibaca: ${error.message || "Unknown error"}`);
    }
  });

  const unreadCount = useMemo(
    () => {
      return displayNotifications.filter(n => !n.isRead).length;
    },
    [displayNotifications]
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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
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
            onClick={() => refetchSaved()}
            className="text-sm"
          >
            Coba Lagi
          </Button>
        </div>
      ) : displayNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
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
              onMarkAsRead={
                staticNotifications 
                  ? undefined 
                  : (id) => {
                      // For WebSocket notifications, just remove them locally
                      if (alarmNotifications.some(n => n.id === id)) {
                        removeAlarmNotification(id);
                      } else {
                        // For database notifications, call the mutation
                        markAsReadMutation.mutate(id);
                      }
                    }
              }
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
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
              {(showMarkAllRead && unreadCount > 0) && (
                <div className="flex items-center gap-2 mb-3 px-4 justify-end">
                  {showMarkAllRead && unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                    >
                      {markAllAsReadMutation.isPending ? (
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
              )}

              <div className="max-h-96">
                <NotificationList />
              </div>
            </div>
            <div className="p-2 flex items-center justify-center border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPopoverOpen(false);
                  // Small delay to ensure popover closes before opening history
                  setTimeout(() => {
                    setIsHistoryOpen(true);
                  }, 100);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                Lihat riwayat lengkap
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <NotifHistory open={isHistoryOpen} setOpen={setIsHistoryOpen} />
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
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? (
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
