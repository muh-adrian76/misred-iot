"use client";

import React from 'react';
import { NotificationCenter } from "@/components/custom/other/notification-center";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useWebSocket } from "@/providers/websocket-provider";

// --- API Functions ---
// Tidak perlu fetchRecentNotifications karena menggunakan WebSocket + localStorage

const markAsRead = async (id) => {
  // Since we're using localStorage, just simulate marking as read
  await new Promise(resolve => setTimeout(resolve, 300));
};

const markAllAsRead = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
};

const deleteNotification = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 300));
};
// --- End of API Functions ---

// Component that uses NotificationCenter
function NotificationContent() {
  const { isMobile } = useBreakpoint();
  const { alarmNotifications = [] } = useWebSocket(); // Get notifications dari WebSocket + localStorage
  const [refreshKey, setRefreshKey] = React.useState(0);
  // Force refresh NotificationCenter ketika alarmNotifications berubah
  React.useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [alarmNotifications]);
  
  // Transform alarm notifications to match the expected format
  const transformedNotifications = React.useMemo(() => {
    return alarmNotifications.map(alarm => ({
      id: alarm.id || `notification_${Math.random()}`,
      title: alarm.title || 'Alarm Triggered',
      message: alarm.message,
      createdAt: alarm.createdAt || new Date().toISOString(),
      isRead: false,
      priority: 'high',
      device: alarm.device_name || alarm.device_description || 'Unknown Device'
    }));
  }, [alarmNotifications]);

  // Simple function yang langsung return notifications dari WebSocket/localStorage
  const fetchNotifications = async () => {
    // console.log("📋 Fetching notifications, count:", transformedNotifications.length);
    return transformedNotifications;
  };

  return (
      <NotificationCenter
        key={refreshKey} // Force re-render saat data berubah
        variant="popover"
        notifications={transformedNotifications} // Pass sebagai static data
        fetchNotifications={fetchNotifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        enableRealTimeUpdates={false} // Disable polling karena menggunakan WebSocket
        updateInterval={0} // No interval needed
        enableBrowserNotifications={false} // Sudah handle di WebSocket provider
        className="rounded-full"
        align={isMobile ? "center" : "end"}
      />
  );
}

export default function NotificationButton() {
  return <NotificationContent />;
}