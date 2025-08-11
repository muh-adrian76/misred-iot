// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./user-provider";
import { fetchFromBackend } from "@/lib/helper";
import ResponsiveDialog from "@/components/custom/dialogs/responsive-dialog";
import { RefreshCw, WifiOff } from "lucide-react";

// Context untuk WebSocket connection dan real-time data
const WebSocketContext = createContext(null);

// Provider utama untuk WebSocket - mengelola koneksi real-time dengan backend
// Handles: device status updates, device controls, alarm notifications
export function WebSocketProvider({ children }) {
  const { user } = useUser();

  // Refs untuk menyimpan state yang persisten across re-renders
  const wsRef = useRef(null); // WebSocket instance
  const reconnectTimeoutRef = useRef(null); // Timeout untuk auto-reconnect
  const reconnectAttemptsRef = useRef(0); // Counter percobaan reconnect
  const connectionAttemptRef = useRef(false); // Flag untuk prevent multiple connections

  // Konfigurasi koneksi
  const maxReconnectAttempts = 10;
  const reconnectDelay = 2000; // 2 seconds
  const connectionTimeout = 10000; // 10 seconds

  // States untuk WebSocket dan real-time data
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatuses, setDeviceStatuses] = useState(new Map()); // Status device real-time
  const [deviceControls, setDeviceControls] = useState(new Map()); // Control states
  const [alarmNotifications, setAlarmNotifications] = useState([]); // Notifikasi alarm
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAuthChecked, setHasAuthChecked] = useState(false);
  const [showConnectionError, setShowConnectionError] = useState(false); // Modal error koneksi

  // Helper function untuk validasi user login
  // Memastikan user memiliki credentials yang lengkap sebelum koneksi WebSocket
  const isUserLoggedIn = (user) => {
    // First check if user exists and is not null
    if (!user || user.id === "") {
      return false;
    }

    const isLoggedIn =
      user.id &&
      user.email &&
      user.id !== "" &&
      user.email !== "" &&
      user.id !== undefined &&
      user.email !== undefined;

    return isLoggedIn;
  };

  // Effect untuk load notifications dari localStorage saat component mount
  // Mengikuti pattern yang sama dengan dashboard-provider untuk konsistensi
  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem("notifications");
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Validate structure - pastikan data adalah array
        if (Array.isArray(parsed)) {
          setAlarmNotifications(parsed);
        } else {
          console.warn(
            "Struktur notifications di localStorage tidak valid, membersihkan"
          );
          localStorage.removeItem("notifications");
        }
      }
    } catch (error) {
      console.warn("Gagal memuat notifikasi dari localStorage:", error);
      localStorage.removeItem("notifications");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Effect untuk save notifications ke localStorage setiap kali berubah
  // Hanya berjalan setelah initialized untuk avoid overwrite data awal
  useEffect(() => {
    if (isInitialized && isUserLoggedIn(user)) {
      try {
        if (alarmNotifications.length > 0) {
          localStorage.setItem(
            "notifications",
            JSON.stringify(alarmNotifications)
          );
        } else {
          localStorage.removeItem("notifications");
        }
      } catch (error) {
        console.warn("Gagal menyimpan notifikasi ke localStorage:", error);
      }
    }
  }, [alarmNotifications, user, isInitialized]);

  // Effect untuk cleanup saat user logout
  // Clear semua data dan close WebSocket connection
  useEffect(() => {
    if (isInitialized && !isUserLoggedIn(user)) {
      setAlarmNotifications([]);
      setIsConnected(false);
      setHasAuthChecked(false);
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      try {
        localStorage.removeItem("notifications");
      } catch (error) {
        console.warn("Gagal menghapus notifikasi dari localStorage:", error);
      }
    }
  }, [user, isInitialized]);

  // Fungsi utama untuk membuat koneksi WebSocket yang aman dan reliable
  // Handles authentication, connection timeout, dan error handling
  const createWebSocketConnection = async () => {
    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current || !isUserLoggedIn(user)) {
      return;
    }

    connectionAttemptRef.current = true;

    // Clean up existing connection jika ada
    if (wsRef.current) {
      wsRef.current.close(1000, "Reconnecting");
    }

    // Setup connection timeout untuk avoid hanging connections
    const connectionTimer = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
        console.warn("⏰ Batas waktu koneksi tercapai - menutup socket");
        wsRef.current.close();
      }
    }, connectionTimeout);

    // Create WebSocket connection dengan user_id parameter
    const wsUrl = `${process.env.NEXT_PUBLIC_BACKEND_WS}/ws/user/${user.id}`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    setWs(socket);

    socket.onopen = () => {
      clearTimeout(connectionTimer);
      console.log("✅ Terkoneksi ke server via websocket!");
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      connectionAttemptRef.current = false;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle ping from server
        if (data.type === "ping") {
          // Respond with pong
          socket.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          return;
        }

        // Debug websocket
        console.log("📥 Pesan diterima:", data);

        // Handle sensor data updates
        if (data.type === "sensor_update") {
          // Update device controls dengan data sensor terbaru
          setDeviceControls((prev) => {
            const newMap = new Map(prev);
            const deviceId = data.device_id;
            const existing = newMap.get(deviceId) || {
              controls: {},
              timestamp: data.timestamp,
            };

            // Update specific datastream value
            existing.controls[data.datastream_id] = {
              value: data.value,
              timestamp: data.timestamp,
            };
            existing.timestamp = data.timestamp;

            newMap.set(deviceId, existing);
            return newMap;
          });
        }

        if (data.type === "status_update") {
          console.log(`📡 Pembaruan status perangkat diterima:`, data);
          setDeviceStatuses((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.device_id, {
              status: data.status,
              timestamp: data.timestamp || data.last_seen || new Date().toISOString(),
            });
            return newMap;
          });
        }

        if (data.type === "control_status_update") {
          setDeviceControls((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.device_id, {
              controls: data.controls,
              timestamp: data.timestamp,
            });
            return newMap;
          });
        }

        if (data.type === "command_executed") {
          console.log(`Perintah dieksekusi:`, data.success ? "BERHASIL" : "GAGAL");
          // Update UI atau state jika diperlukan berdasarkan response command
        }

        if (data.type === "command_sent") {
          console.log(
            `✅ Perintah dikirim ke perangkat ${data.device_id}:`,
            data.message
          );
        }

        if (data.type === "command_status") {
          console.log(`📋 Pembaruan status perintah:`, data);
        }

        if (data.type === "echo") {
          console.log(`🔊 Respons echo:`, data.message);
        }

        if (data.type === "alarm_notification") {
          // Tambahkan notifikasi real-time dengan check duplikasi
          setAlarmNotifications((prev) => {
            // Check apakah notifikasi dengan ID yang sama sudah ada
            const existingIds = prev.map((n) => n.id);
            if (existingIds.includes(data.data.id)) {
              console.log(
                "⚠️ Notifikasi duplikat terdeteksi, dilewati:",
                data.data.id
              );
              return prev; // Skip jika sudah ada
            }

            // Tambahkan notifikasi baru dan limit ke 100 item
            return [data.data, ...prev].slice(0, 100);
          });

          if (Notification.permission === "granted") {
            new Notification(data.data.title, {
              body: data.data.message,
              icon: "/web-logo.svg",
            });
          }
        }

        // Handle real-time device offline notifications
        if (data.type === "notification") {
          console.log("📢 Notifikasi real-time diterima:", data.data);
          
          // Tambahkan notifikasi real-time ke state dengan check duplikasi
          setAlarmNotifications((prev) => {
            // Check apakah notifikasi dengan ID yang sama atau device_id + timestamp yang sama sudah ada
            const isDuplicate = prev.some((n) => 
              n.id === data.data.id || 
              (n.device_id === data.data.device_id && 
               n.type === data.data.type && 
               Math.abs(new Date(n.triggered_at).getTime() - new Date(data.data.triggered_at).getTime()) < 5000) // 5 second tolerance
            );
            
            if (isDuplicate) {
              console.log("⚠️ Notifikasi perangkat duplikat terdeteksi, dilewati:", data.data);
              return prev;
            }

            // Tambahkan notifikasi baru dan limit ke 100 item
            console.log("✅ Menambahkan notifikasi real-time baru ke state");
            return [data.data, ...prev].slice(0, 100);
          });

          // Show browser notification jika permission granted
          if (Notification.permission === "granted") {
            new Notification(data.data.title, {
              body: data.data.message,
              icon: "/web-logo.svg",
            });
          }
        }
      } catch (error) {
        console.error("Gagal memproses pesan:", error);
      }
    };

    socket.onclose = (event) => {
      clearTimeout(connectionTimer);
      setIsConnected(false);
      wsRef.current = null;
      setWs(null);
      connectionAttemptRef.current = false;

      console.log(
        `🔌 WebSocket ditutup. Kode: ${event.code}, Alasan: ${event.reason}`
      );

      // Handle specific close codes - don't reconnect immediately for certain failures
      if (event.code === 1008 && event.reason?.includes("not online")) {
        console.error("🚨 Pengguna tidak online - akan mencoba lagi setelah jeda");

        // Retry connection after delay
        if (isUserLoggedIn(user)) {
          setTimeout(async () => {
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectAttemptsRef.current += 1;
              await createWebSocketConnection();
            }
          }, reconnectDelay * 2); // Longer delay for user status issues
        }
        return;
      }

      // Only reconnect for abnormal closures and if user still exists
      if (
        event.code !== 1000 &&
        isUserLoggedIn(user) &&
        reconnectAttemptsRef.current < maxReconnectAttempts
      ) {
        reconnectAttemptsRef.current += 1;
        // console.log(`🔄 Reconnecting in ${reconnectDelay/1000}s... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

        reconnectTimeoutRef.current = setTimeout(async () => {
          await createWebSocketConnection();
        }, reconnectDelay);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error(
          "❌ Batas maksimum percobaan koneksi tercapai. Periksa koneksi dan server backend."
        );
        // Tampilkan modal error koneksi untuk user
        setShowConnectionError(true);
      }
    };

    socket.onerror = (error) => {
      clearTimeout(connectionTimer);
      connectionAttemptRef.current = false;
      console.error("🚨 Kesalahan WebSocket:", error);
    };
  };

  useEffect(() => {
    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Only proceed if initialized and user looks logged in
    if (isInitialized && isUserLoggedIn(user) && !hasAuthChecked) {
      // console.log("✅ User appears logged in, verifying authentication...");

      // Verify authentication with backend before proceeding
      const initializeWebSocketAndNotifications = async () => {
        try {
          // Double check user is still logged in before making any API calls
          if (!isUserLoggedIn(user)) {
            console.log("❌ User logout saat inisialisasi, membatalkan");
            setHasAuthChecked(true);
            return;
          }

          // Fetch notifications dari backend (hanya sekali setelah auth verified)
          const fetchLoginNotifications = async () => {
            try {
              if (!isUserLoggedIn(user)) {
                console.log(
                  "❌ User logout sebelum fetch, melewati pengambilan notifikasi"
                );
                return;
              }

              // Clear localStorage untuk menghindari data stale/duplikat
              try {
                localStorage.removeItem("notifications");
              } catch (error) {
                console.warn(
                  "Gagal menghapus notifikasi dari localStorage:",
                  error
                );
              }

              // console.log("🔍 Mengambil notifikasi dari backend...");
              const response = await fetchFromBackend("/notifications/");

              if (response.ok) {
                const data = await response.json();
                // console.log("✅ Notifikasi berhasil diambil");
                if (data.success && data.notifications) {
                  // Final check before updating state
                  if (!isUserLoggedIn(user)) {
                    console.log(
                      "❌ User logout saat fetch, membuang notifikasi"
                    );
                    return;
                  }

                  // Replace notifications dengan data fresh dari backend
                  setAlarmNotifications((prev) => {
                    const freshNotifications = data.notifications || [];

                    // Filter hanya notifikasi yang belum dibaca
                    const unreadNotifications = freshNotifications.filter(
                      (notification) =>
                        !notification.isRead && notification.isRead !== true
                    );

                    // Sort berdasarkan waktu terbaru
                    const sorted = unreadNotifications.sort(
                      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                    );

                    return sorted;
                  });
                }
              } else {
                console.log(
                  "❌ Gagal mengambil notifikasi:",
                  response.status
                );
              }
            } catch (error) {
              if (isUserLoggedIn(user)) {
                console.error("Kesalahan saat mengambil notifikasi terbaru:", error);
              }
            }
          };

          if (isUserLoggedIn(user)) {
            fetchLoginNotifications();
          }

          // Reset connection state
          reconnectAttemptsRef.current = 0;
          connectionAttemptRef.current = false;

          // Delayed connection to ensure backend is ready (only if user still logged in)
          if (isUserLoggedIn(user)) {
            const connectTimer = setTimeout(async () => {
              if (isUserLoggedIn(user)) {
                await createWebSocketConnection();
              }
            }, 2000);

            return () => {
              clearTimeout(connectTimer);
            };
          }
        } catch (error) {
          if (isUserLoggedIn(user)) {
            console.error("Kesalahan saat inisialisasi:", error);
          }
          setHasAuthChecked(true);
        }
      };

      initializeWebSocketAndNotifications();
    } else if (isInitialized && !isUserLoggedIn(user)) {
      // console.log("❌ User tidak login, melewati inisialisasi WebSocket");
      setHasAuthChecked(false);

      // Clean up any pending connections or operations
      if (wsRef.current) {
        wsRef.current.close(1000, "User logged out");
        wsRef.current = null;
        setWs(null);
        setIsConnected(false);
      }
    }

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      connectionAttemptRef.current = false;
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
        setWs(null);
        setIsConnected(false);
      }
    };
  }, [user, isInitialized, hasAuthChecked]);

  // Function to send device commands
  const sendDeviceCommand = (deviceId, datastreamId, commandType, value) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const command = {
        type: "device_command",
        device_id: deviceId.toString(),
        control_id: datastreamId.toString(), // Backend expects control_id
        command_type: commandType,
        value: value,
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(command));
      console.log(`📤 Perintah perangkat dikirim:`, command);
      return true;
    }
    console.warn("❌ Tidak dapat mengirim perintah: WebSocket belum terhubung");
    return false;
  };

  // Function to remove a specific alarm notification
  const removeAlarmNotification = (notificationId) => {
    setAlarmNotifications((prev) => {
      const updated = prev.filter((notif) => notif.id !== notificationId);

      // Update localStorage
      try {
        localStorage.setItem("notifications", JSON.stringify(updated));
      } catch (error) {
        console.warn("Kesalahan saat memperbarui notifikasi di localStorage:", error);
      }

      return updated;
    });
  };

  // Function to clear alarm notifications (for save all functionality)
  const clearAlarmNotifications = () => {
    setAlarmNotifications([]);
    // Also clear from localStorage
    try {
      localStorage.removeItem("notifications");
    } catch (error) {
      console.warn("Gagal menghapus notifikasi dari localStorage:", error);
    }
  };

  // Function to test echo (untuk debugging)
  const testWebSocketConnection = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const testMessage = {
        type: "echo",
        message: "Halo dari frontend!",
        timestamp: new Date().toISOString(),
      };
      console.log(`🧪 Mengirim pesan uji:`, testMessage);
      ws.send(JSON.stringify(testMessage));
      return true;
    }
    console.warn("❌ Tidak dapat menguji: WebSocket belum terhubung");
    return false;
  };

  // Function untuk test device command
  const testDeviceCommand = (deviceId = "1") => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const testCommand = {
        type: "device_command",
        device_id: deviceId,
        control_id: "led1",
        command_type: "set_value",
        value: 1,
        timestamp: new Date().toISOString(),
      };
      console.log(`🧪 Mengirim perintah uji perangkat:`, testCommand);
      ws.send(JSON.stringify(testCommand));
      return true;
    }
    console.warn("❌ Tidak dapat menguji perintah: WebSocket belum terhubung");
    return false;
  };

  // Function untuk reload halaman saat koneksi bermasalah
  const handleReloadPage = () => {
    window.location.reload();
  };

  const contextValue = {
    ws,
    isConnected,
    deviceStatuses,
    deviceControls,
    alarmNotifications,
    setAlarmNotifications,
    removeAlarmNotification,
    clearAlarmNotifications,
    sendDeviceCommand,
    testWebSocketConnection, // Tambah function untuk testing echo
    testDeviceCommand, // Tambah function untuk testing device command
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}

      {/* Modal error koneksi - mirip dengan celebration modal di to-do-list */}
      <ResponsiveDialog
        open={showConnectionError}
        setOpen={() => {}} // Disable close via backdrop/X button - force user to reload
        title={"Koneksi Bermasalah"}
        content={
          <div className="text-center space-y-4">
            {/* Icon WiFi Off dengan animasi */}
            <div className="flex justify-center -mt-4">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-400 dark:to-orange-400 p-4 rounded-full shadow-lg">
                <WifiOff className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Pesan detail */}
            <div className="text-center p-4 bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                <strong>Koneksi internet Anda sedang tidak stabil.</strong>
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                Tolong muat ulang halaman untuk memuat ulang koneksi.
              </div>
            </div>

            {/* Informasi troubleshooting */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Jika masalah berlanjut, periksa koneksi internet Anda atau hubungi
              administrator sistem.
            </div>
          </div>
        }
        contentHandle={handleReloadPage}
        confirmText={
          <>
            <RefreshCw className="w-4 h-4" />
            Muat Ulang Halaman
          </>
        }
        oneButton={true}
      />
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
