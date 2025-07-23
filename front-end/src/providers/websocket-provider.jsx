"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./user-provider";
import { fetchFromBackend } from "@/lib/helper";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { user } = useUser();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const connectionAttemptRef = useRef(false);
  const maxReconnectAttempts = 3;
  const reconnectDelay = 2000; // 2 seconds
  const connectionTimeout = 10000; // 10 seconds
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatuses, setDeviceStatuses] = useState(new Map());
  const [deviceControls, setDeviceControls] = useState(new Map());
  const [alarmNotifications, setAlarmNotifications] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAuthChecked, setHasAuthChecked] = useState(false);

  // Helper function to check if user is truly logged in
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
    
    // Only log when there's a user object but incomplete credentials
    // This helps debug login issues without spamming the console
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

  // Helper function to verify authentication with backend
  const verifyAuthentication = async () => {
    try {
      const response = await fetchFromBackend("/auth/verify-token", {
        method: "GET",
      });
      return response.ok;
    } catch (error) {
      console.error("Auth verification failed:", error);
      return false;
    }
  };

  // Load notifications dari localStorage saat component mount (seperti pattern dashboard-provider)
  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem("notifications");
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Validate structure
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

  // Save notifications ke localStorage setiap kali berubah (hanya setelah initialized)
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

  // Clear notifications saat user logout
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

  // Safe and reliable WebSocket connection
  const createWebSocketConnection = () => {
    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current || !isUserLoggedIn(user)) {
      // if (!isUserLoggedIn(user)) {
      //   console.log("❌ Cannot create WebSocket connection: User not fully logged in");
      // }
      return;
    }

    connectionAttemptRef.current = true;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close(1000, "Reconnecting");
    }

    console.log(`🔄 Connecting... (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

    const connectionTimer = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
        console.warn("⏰ Connection timeout - closing socket");
        wsRef.current.close();
      }
    }, connectionTimeout);

    try {
      // Build WebSocket URL with fallback
      const backendWsUrl = process.env.NEXT_PUBLIC_BACKEND_WS;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      let wsUrl;
      if (backendWsUrl) {
        wsUrl = `${backendWsUrl}/ws/user`;
      } else if (backendUrl) {
        // Convert HTTP to WS URL
        wsUrl = backendUrl.replace(/^https?:/, backendUrl.startsWith('https:') ? 'wss:' : 'ws:') + '/ws/user';
      } else {
        // Fallback to default development URL
        wsUrl = 'ws://localhost:7601/ws/user';
      }

      console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;
      setWs(socket);

      socket.onopen = () => {
        clearTimeout(connectionTimer);
        console.log("✅ Koneksi websocket berhasil!");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        connectionAttemptRef.current = false;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

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
            setAlarmNotifications(prev => [data.data, ...prev].slice(0, 100));
            
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

        // Only reconnect for abnormal closures and if user still exists
        if (event.code !== 1000 && isUserLoggedIn(user) && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`🔄 Reconnecting in ${reconnectDelay/1000}s... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(createWebSocketConnection, reconnectDelay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("❌ Max reconnection attempts reached. Please check your connection and backend server.");
        }
      };

      socket.onerror = (error) => {
        clearTimeout(connectionTimer);
        connectionAttemptRef.current = false;
        console.error("🚨 WebSocket error:", error);
        console.error("💡 Possible causes:");
        console.error("   1. Backend server is not running");
        console.error("   2. CORS configuration issue");
        console.error("   3. Network connectivity problem");
        console.error("   4. Incorrect WebSocket URL");
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
              // console.log("🔍 Fetching notifications from backend...");
              const response = await fetchFromBackend("/notifications/");
              
              if (response.ok) {
                const data = await response.json();
                // console.log("✅ Notifications fetched successfully");
                if (data.success && data.notifications) {
                  // Merge dengan notifications yang sudah ada di localStorage
                  setAlarmNotifications(prev => {
                    const combined = [...data.notifications, ...prev];
                    // Remove duplicates based on ID
                    const unique = combined.filter((notification, index, self) => 
                      index === self.findIndex(n => n.id === notification.id)
                    );
                    const sorted = unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    return sorted;
                  });
                }
              } else {
                console.log("❌ Failed to fetch notifications:", response.status);
              }
            } catch (error) {
              console.error('Error fetching recent notifications:', error);
            }
          };

          fetchLoginNotifications();
          
          // Reset connection state
          reconnectAttemptsRef.current = 0;
          connectionAttemptRef.current = false;
          
          // Delayed connection to ensure backend is ready
          const connectTimer = setTimeout(createWebSocketConnection, 2000);
          
          return () => {
            clearTimeout(connectTimer);
          };
          
        } catch (error) {
          console.error('Error during initialization:', error);
          setHasAuthChecked(true);
        }
      };

      initializeWebSocketAndNotifications();
    } else if (isInitialized && !isUserLoggedIn(user)) {
      // console.log("❌ User not logged in, skipping WebSocket initialization");
      setHasAuthChecked(false);
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
      console.log("🔄 Manual reconnection...");
      
      // Verify auth before reconnecting
      const isAuthenticated = await verifyAuthentication();
      if (!isAuthenticated) {
        console.log("❌ Authentication failed, cannot reconnect");
        return;
      }
      
      reconnectAttemptsRef.current = 0;
      createWebSocketConnection();
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
