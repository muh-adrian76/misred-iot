"use client";

import React from 'react';
import { NotificationCenter } from "@/components/custom/other/notification-center";
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';

// --- Simulated Backend API ---
let masterNotifications = [ /* ... initial notifications ... */ ];
let nextId = masterNotifications.length + 1;
const fetchNotifications = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...masterNotifications];
};
const markAsRead = async (id) => {
  masterNotifications = masterNotifications.map(n => n.id === id ? { ...n, isRead: true } : n);
};
const markAllAsRead = async () => {
  masterNotifications = masterNotifications.map(n => ({ ...n, isRead: true }));
};
const deleteNotification = async (id) => {
  masterNotifications = masterNotifications.filter(n => n.id !== id);
};
// --- End of Simulated API ---

const queryClient = new QueryClient();

// Separate the component that uses useQueryClient
function NotificationContent() {
  const qc = useQueryClient();

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newNotification = {
        id: String(nextId++),
        title: 'Alarm Aplikasi MiSREd-IoT!',
        message: 'This notification was added automatically.',
        isRead: false,
        createdAt: new Date().toISOString(),
        priority: 'medium',
      };
      masterNotifications.unshift(newNotification);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    }, 600000);
    return () => clearInterval(interval);
  }, [qc]);

  return (
      <NotificationCenter
        variant="popover"
        fetchNotifications={fetchNotifications}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
        enableRealTimeUpdates={true}
        updateInterval={15000}
        enableBrowserNotifications={true}
        className="rounded-full"
      />
  );
}

export default function NotificationButton() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationContent />
    </QueryClientProvider>
  );
}