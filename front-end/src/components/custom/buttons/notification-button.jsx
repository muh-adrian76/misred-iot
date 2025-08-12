// Menggunakan "use client" untuk komponen React sisi klien
"use client";

// Import React untuk hooks
import React from 'react';
// Import komponen NotificationCenter untuk menampilkan notifikasi
import { NotificationCenter } from "@/components/custom/other/notification-center";
// Import hook untuk deteksi breakpoint
import { useBreakpoint } from "@/hooks/use-mobile";
// Import provider WebSocket untuk real-time notifications
import { useWebSocket } from "@/providers/websocket-provider";

// --- Fungsi API untuk operasi notifikasi ---
// Tidak perlu fetchRecentNotifications karena menggunakan WebSocket + localStorage

// Fungsi untuk menandai notifikasi sebagai sudah dibaca
const markAsRead = async (id) => {
  // Simulasi API call dengan delay (karena menggunakan localStorage)
  await new Promise(resolve => setTimeout(resolve, 300));
};

// Hapus fungsi markAllAsRead dummy - biarkan NotificationCenter menangani dengan fungsi bawaan

// Fungsi untuk menghapus notifikasi
const deleteNotification = async (id) => {
  // Simulasi API call dengan delay
  await new Promise(resolve => setTimeout(resolve, 300));
};
// --- Akhir dari fungsi API ---

// Komponen yang menggunakan NotificationCenter
function NotificationContent() {
  // Hook untuk deteksi mobile dan WebSocket data
  const { isMobile } = useBreakpoint();
  // Dapatkan notifikasi alarm dari WebSocket + localStorage
  const { alarmNotifications = [] } = useWebSocket(); 
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  // Force refresh NotificationCenter ketika alarmNotifications berubah
  React.useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [alarmNotifications]);
  
  // Transformasi notifikasi alarm ke format yang diharapkan oleh NotificationCenter
  const transformedNotifications = React.useMemo(() => {
    return alarmNotifications.map(alarm => ({
      id: alarm.id || `notification_${Math.random()}`, // ID unik untuk setiap notifikasi
      title: alarm.title || 'Alarm terpicu', // Judul default jika tidak ada
      message: alarm.message, // Pesan notifikasi
      createdAt: alarm.createdAt || new Date().toISOString(), // Timestamp
      isRead: false, // Default belum dibaca
      priority: 'high', // Priority tinggi untuk alarm
      device: alarm.device_name || alarm.device_description || 'Perangkat tidak diketahui' // Nama perangkat
    }));
  }, [alarmNotifications]);

  // Fungsi sederhana yang return notifications dari WebSocket/localStorage
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
  // Hapus prop onMarkAllAsRead - biarkan NotificationCenter menggunakan defaultMarkAllAsRead
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