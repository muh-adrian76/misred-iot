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
  Trash2,
  Filter,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const defaultFetchNotifications = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [];
};

const defaultMarkAsRead = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
};

const defaultMarkAllAsRead = async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
};

const defaultDeleteNotification = async (id) => {
  try {
    const response = await fetchFromBackend(`/notifications/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
    return response.json();
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

const deleteAllNotifications = async () => {
  try {
    const response = await fetchFromBackend('/notifications', {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete all notifications');
    }
    return response.json();
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

const saveAllNotifications = async () => {
  try {
    const response = await fetchFromBackend('/notifications/save-all', {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Failed to save all notifications');
    }
    return response.json();
  } catch (error) {
    console.error('Error saving all notifications:', error);
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
  onDelete,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) {
      try {
        await onDelete(notification.id);
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 hover:bg-muted/30 hover:shadow-sm",
        !notification.isRead &&
          "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/10 dark:border-l-red-400",
        notification.isRead && "border-border hover:border-muted-foreground/20",
        onClick && "cursor-pointer"
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

              {onDelete && (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  variant={"outline"}
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </Button>
              )}
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
  onDeleteNotification = defaultDeleteNotification,
  onNotificationClick,
  maxHeight = "h-96",
  showFilter = true,
  showMarkAllRead = true,
  enableRealTimeUpdates = false,
  updateInterval = 30000,
  enableBrowserNotifications = false,
  align = "end",
  emptyState = {
    title: "Tidak ada alarm yang terpicu.",
    description: "Alarm yang terpicu akan otomatis ditampilkan disini.",
  },
}) {
  const [filter, setFilter] = useState("unread");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const queryClient = useQueryClient();
  const { ws, alarmNotifications = [], clearAlarmNotifications } = useWebSocket();

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

  // Fetch saved notifications from database
  const { data: savedNotifications = [], isLoading: isLoadingSaved, refetch: refetchSaved } = useQuery({
    queryKey: ["saved-notifications"],
    queryFn: async () => {
      try {
        const response = await fetchFromBackend('/notifications');
        if (!response.ok) {
          throw new Error('Failed to fetch saved notifications');
        }
        const data = await response.json();
        return data.notifications || [];
      } catch (error) {
        console.error('Error fetching saved notifications:', error);
        return [];
      }
    },
    enabled: filter === "all",
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    initialData: staticNotifications,
    refetchInterval: enableRealTimeUpdates ? updateInterval : false,
    enabled: !staticNotifications && filter === "all",
  });

  // Choose notifications based on filter
  const displayNotifications = useMemo(() => {
    if (filter === "unread") {
      return alarmNotifications; // WebSocket notifications (temporary)
    } else {
      return savedNotifications; // Database notifications (saved)
    }
  }, [filter, alarmNotifications, savedNotifications]);

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
    onSuccess: (_, id) => {
      if (staticNotifications) return;

      queryClient.setQueryData(["notifications"], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
  });

  // Save all WebSocket notifications to database
  const markAllAsReadMutation = useMutation({
    mutationFn: saveAllNotifications,
    onSuccess: () => {
      // Clear WebSocket notifications
      clearAlarmNotifications();
      
      // Refresh saved notifications
      refetchSaved();
      
      // Switch to "all" filter to show saved notifications
      setFilter("all");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: onDeleteNotification,
    onSuccess: (_, id) => {
      if (filter === "all") {
        refetchSaved();
      }
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      if (filter === "all") {
        refetchSaved();
      } else {
        clearAlarmNotifications();
      }
    },
  });

  const filteredNotifications = useMemo(
    () => displayNotifications,
    [displayNotifications]
  );

  const unreadCount = useMemo(
    () => alarmNotifications.length, // Only count WebSocket notifications as unread
    [alarmNotifications]
  );

  const NotificationList = () => (
    <ScrollArea className={cn(maxHeight)}>
      {(isLoading || isLoadingSaved) ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              Loading notifications...
            </p>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <BellRing className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg text-foreground mb-2">
            {filter === "unread"
              ? "Tidak ada notifikasi baru."
              : "Tidak ada notifikasi tersimpan."}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {filter === "unread"
              ? "Notifikasi alarm akan muncul di sini saat terpicu."
              : "Klik 'Simpan Semua' untuk menyimpan notifikasi ke riwayat."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 px-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={
                staticNotifications ? undefined : markAsReadMutation.mutate
              }
              onDelete={filter === "all" ? deleteMutation.mutate : undefined}
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
          className="w-80 p-0 max-sm:mr-7 shadow-xl border-border/50"
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
            {(showFilter || (showMarkAllRead && unreadCount > 0)) && (
              <div className="flex items-center gap-2 mb-3 px-4 justify-between">
                {showFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      setFilter(filter === "all" ? "unread" : "all")
                    }
                  >
                    <Filter className="mr-1.5 h-3 w-3" />
                    {filter === "all" ? "Belum dibaca" : "Semua"}
                  </Button>
                )}

                {showMarkAllRead && unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    {markAllAsReadMutation.isPending ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1.5" />
                    ) : (
                      <CheckCheck className="mr-1.5 h-3 w-3" />
                    )}
                    Simpan Semua
                  </Button>
                )}
              </div>
            )}

            <div className="max-h-96">
              <NotificationList />
            </div>
          </div>
          <div className="p-2 flex items-center justify-between border-t">
            <Button
              variant={"ghost"}
              size="sm"
              className="cursor-pointer"
              onClick={() => {
                setIsPopoverOpen(false);
                setIsHistoryOpen(true);
              }}
              >
              Lihat riwayat lengkap
            </Button>
            <Button 
              variant={"ghost"} 
              size="sm" 
              className="py-4"
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending || filteredNotifications.length === 0}
            >
              {deleteAllMutation.isPending ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1.5" />
              ) : (
                <Trash2 className="mr-1.5 h-3 w-3" />
              )}
              Hapus semua
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
            {showFilter && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setFilter(filter === "all" ? "unread" : "all")}
              >
                <Filter className="mr-1.5 h-3 w-3" />
                {filter === "all" ? "Show Unread" : "Show All"}
              </Button>
            )}

            {showMarkAllRead && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1.5" />
                ) : (
                  <CheckCheck className="mr-1.5 h-3 w-3" />
                )}
                Mark All Read
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
