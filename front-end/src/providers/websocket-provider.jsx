// Directive untuk Next.js - menandakan bahwa komponen ini berjalan di client-side
"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./user-provider";
import { fetchFromBackend } from "@/lib/helper";

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

  // Helper function untuk validasi user login
  // Memastikan user memiliki credentials yang lengkap sebelum koneksi WebSocket
  const isUserLoggedIn = (user) => {
    // First check if user exists and is not null
    if (!user || user.id === "") {
      return false;
    }
    
    const isLoggedIn = user.id && 
           user.email && 
           user.id !== "" && 
           user.email !== "" &&
           user.id !== undefined &&
           user.email !== undefined;
    
    // Debug logging untuk troubleshooting login issues (commented out)
    // if (user && !isLoggedIn) {
    //   console.log("🔍 User object exists but missing credentials:", { 
    //     hasUser: !!user, 
    //     hasId: !!(user?.id), 
    //     hasEmail: !!(user?.email),
    //     id: user?.id || "empty",
    //     email: user?.email || "empty"
    //   });
    // }
    
    return isLoggedIn;
  };

  // Helper function untuk verifikasi autentikasi dengan backend
  // Double-check token validity sebelum establish WebSocket connection
  const verifyAuthentication = async () => {
    try {
      const response = await fetchFromBackend("/auth/verify-token");
      return response.ok;
    } catch (error) {
      console.error("Auth verification failed:", error);
      return false;
    }
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
          console.warn('Invalid localStorage notifications structure, clearing');
          localStorage.removeItem("notifications");
        }
      }
    } catch (error) {
      console.warn("Failed to load notifications from localStorage:", error);
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
          localStorage.setItem("notifications", JSON.stringify(alarmNotifications));
        } else {
          localStorage.removeItem("notifications");
        }
      } catch (error) {
        console.warn("Failed to save notifications to localStorage:", error);
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
        console.warn("Error clearing notifications from localStorage:", error);
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
        console.warn("⏰ Connection timeout - closing socket");
        wsRef.current.close();
      }
    }, connectionTimeout);

    try {
      // Build WebSocket URL dengan fallback untuk development/production
      const backendWsUrl = process.env.NEXT_PUBLIC_BACKEND_WS;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      let wsBaseUrl;
      if (backendWsUrl) {
        wsBaseUrl = `${backendWsUrl}/ws/user`;
      } else if (backendUrl) {
        // Convert HTTP ke WS URL
        wsBaseUrl = backendUrl.replace(/^https?:/, backendUrl.startsWith('https:') ? 'wss:' : 'ws:') + '/ws/user';
      } else {
        // Fallback untuk development
        wsBaseUrl = 'ws://localhost:7601/ws/user';
      }

      // Generate WebSocket token dari backend API
      // Diperlukan karena HttpOnly cookies tidak accessible via JavaScript
      let wsToken = null;
      try {
        const tokenResponse = await fetchFromBackend("/auth/ws-token", {
          method: "GET",
        });
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          wsToken = tokenData.ws_token;
        } else {
          console.error("❌ Failed to get WebSocket token:", tokenResponse.status);
          connectionAttemptRef.current = false;
          return;
        }
      } catch (error) {
        console.error("❌ Error getting WebSocket token:", error);
        connectionAttemptRef.current = false;
        return;
      }
      
      // Construct final WebSocket URL dengan token
      let wsUrl;
      if (wsToken) {
        wsUrl = `${wsBaseUrl}/${encodeURIComponent(wsToken)}`;
      } else {
        console.warn("❌ No WebSocket token available, cannot connect");
        connectionAttemptRef.current = false;
        return;
      }
      
      // Create WebSocket connection
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
          // Debug websocket
          console.log("📥 Pesan diterima:", data);
          
          if (data.type === "status_update") {
            setDeviceStatuses(prev => {
              const newMap = new Map(prev);
              newMap.set(data.device_id, {
                status: data.status,
                timestamp: data.timestamp || new Date().toISOString()
              });
              return newMap;
            });
          }

          if (data.type === "control_status_update") {
            setDeviceControls(prev => {
              const newMap = new Map(prev);
              newMap.set(data.device_id, {
                controls: data.controls,
                timestamp: data.timestamp
              });
              return newMap;
            });
          }

          if (data.type === "command_executed") {
            console.log(`Command executed:`, data.success ? 'SUCCESS' : 'FAILED');
          }

          if (data.type === "alarm_notification") {
            // Tambahkan notifikasi real-time dengan check duplikasi
            setAlarmNotifications(prev => {
              // Check apakah notifikasi dengan ID yang sama sudah ada
              const existingIds = prev.map(n => n.id);
              if (existingIds.includes(data.data.id)) {
                console.log("⚠️ Duplicate notification detected, skipping:", data.data.id);
                return prev; // Skip jika sudah ada
              }
              
              // Tambahkan notifikasi baru dan limit ke 100 item
              return [data.data, ...prev].slice(0, 100);
            });
            
            if (Notification.permission === "granted") {
              new Notification(data.data.title, {
                body: data.data.message,
                icon: "/web-logo.svg"
              });
            }
          }
        } catch (error) {
          console.error("Message parse error:", error);
        }
      };

      socket.onclose = (event) => {
        clearTimeout(connectionTimer);
        setIsConnected(false);
        wsRef.current = null;
        setWs(null);
        connectionAttemptRef.current = false;

        console.log(`🔌 WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);

        // Handle specific authentication failures - don't reconnect immediately
        if (event.code === 1008 && event.reason?.includes("Authentication")) {
          console.error("🚨 Authentication failed - will retry after verifying credentials");
          
          // Verify authentication before attempting reconnection
          if (isUserLoggedIn(user)) {
            setTimeout(async () => {
              const isAuthenticated = await verifyAuthentication();
              if (isAuthenticated && reconnectAttemptsRef.current < maxReconnectAttempts) {
                reconnectAttemptsRef.current += 1;
                // console.log(`🔄 Auth verified, reconnecting... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
                await createWebSocketConnection();
              } else {
                console.error("❌ Authentication verification failed or max attempts reached");
              }
            }, reconnectDelay * 2); // Longer delay for auth failures
          }
          return;
        }

        // Only reconnect for abnormal closures and if user still exists
        if (event.code !== 1000 && isUserLoggedIn(user) && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          // console.log(`🔄 Reconnecting in ${reconnectDelay/1000}s... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(async () => {
            await createWebSocketConnection();
          }, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("❌ Max reconnection attempts reached. Please check your connection and backend server.");
        }
      };

      socket.onerror = (error) => {
        clearTimeout(connectionTimer);
        connectionAttemptRef.current = false;
        console.error("🚨 WebSocket error:", error);
      };

    } catch (error) {
      clearTimeout(connectionTimer);
      connectionAttemptRef.current = false;
      console.error("Socket creation failed:", error);
    }
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
            console.log("❌ User logged out during initialization, aborting");
            setHasAuthChecked(true);
            return;
          }

          const isAuthenticated = await verifyAuthentication();
          
          if (!isAuthenticated) {
            // console.log("❌ Authentication verification failed, skipping initialization");
            setHasAuthChecked(true);
            return;
          }

          // console.log("✅ Authentication verified, proceeding with initialization");
          setHasAuthChecked(true);
          
          // Fetch notifications dari backend (hanya sekali setelah auth verified)
          const fetchLoginNotifications = async () => {
            try {
              if (!isUserLoggedIn(user)) {
                console.log("❌ User logged out before fetch, skipping notifications fetch");
                return;
              }

              // Clear localStorage untuk menghindari data stale/duplikat
              try {
                localStorage.removeItem("notifications");
              } catch (error) {
                console.warn("Error clearing notifications from localStorage:", error);
              }

              // console.log("🔍 Fetching notifications from backend...");
              const response = await fetchFromBackend("/notifications/");
              
              if (response.ok) {
                const data = await response.json();
                // console.log("✅ Notifications fetched successfully");
                if (data.success && data.notifications) {
                  // Final check before updating state
                  if (!isUserLoggedIn(user)) {
                    console.log("❌ User logged out during fetch, discarding notifications");
                    return;
                  }
                  
                  // Replace notifications dengan data fresh dari backend
                  // Tidak merge dengan localStorage untuk menghindari duplikasi
                  setAlarmNotifications(prev => {
                    // Hanya ambil data fresh dari backend untuk konsistensi
                    // dan hindari duplikasi dengan localStorage yang mungkin stale
                    const freshNotifications = data.notifications || [];
                    
                    // Filter hanya notifikasi yang belum dibaca (isRead: false)
                    const unreadNotifications = freshNotifications.filter(notification => 
                      !notification.isRead && notification.isRead !== true
                    );
                    
                    // Sort berdasarkan waktu terbaru
                    const sorted = unreadNotifications.sort((a, b) => 
                      new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    
                    return sorted;
                  });
                }
              } else {
                console.log("❌ Failed to fetch notifications:", response.status);
              }
            } catch (error) {
              // Only log error if user is still logged in (avoid spam during logout)
              if (isUserLoggedIn(user)) {
                console.error('Error fetching recent notifications:', error);
              }
            }
          };

          // Only fetch notifications if user is still logged in
          if (isUserLoggedIn(user)) {
            fetchLoginNotifications();
          }
          
          // Reset connection state
          reconnectAttemptsRef.current = 0;
          connectionAttemptRef.current = false;
          
          // Delayed connection to ensure backend is ready (only if user still logged in)
          if (isUserLoggedIn(user)) {
            const connectTimer = setTimeout(async () => {
              // Final check before connecting
              if (isUserLoggedIn(user)) {
                await createWebSocketConnection();
              }
            }, 2000);
            
            return () => {
              clearTimeout(connectTimer);
            };
          }
          
        } catch (error) {
          // Only log error if user is still logged in
          if (isUserLoggedIn(user)) {
            console.error('Error during initialization:', error);
          }
          setHasAuthChecked(true);
        }
      };

      initializeWebSocketAndNotifications();
    } else if (isInitialized && !isUserLoggedIn(user)) {
      // console.log("❌ User not logged in, skipping WebSocket initialization");
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

  // Manual reconnection
  const reconnectWebSocket = async () => {
    if (isUserLoggedIn(user) && !connectionAttemptRef.current) {
      // console.log("🔄 Mencoba reconnect...");
      
      // Verify auth before reconnecting
      const isAuthenticated = await verifyAuthentication();
      if (!isAuthenticated) {
        console.log("❌ Authentication failed, cannot reconnect");
        return;
      }
      
      reconnectAttemptsRef.current = 0;
      await createWebSocketConnection();
    }
  };

  // Function to send device commands
  const sendDeviceCommand = (deviceId, datastreamId, commandType, value) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const command = {
        type: "device_command",
        device_id: deviceId,
        datastream_id: datastreamId,
        command_type: commandType,
        value: value,
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(command));
      console.log(`📤 Device command sent:`, command);
      return true;
    }
    console.warn("❌ Cannot send command: WebSocket not connected");
    return false;
  };

  // Function to remove a specific alarm notification
  const removeAlarmNotification = (notificationId) => {
    setAlarmNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== notificationId);
      
      // Update localStorage
      try {
        localStorage.setItem("notifications", JSON.stringify(updated));
      } catch (error) {
        console.warn("Error updating notifications in localStorage:", error);
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
      console.warn("Error clearing notifications from localStorage:", error);
    }
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
    reconnectWebSocket,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
