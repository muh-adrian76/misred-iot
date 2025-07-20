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
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000; // 5 seconds
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceStatuses, setDeviceStatuses] = useState(new Map());
  const [deviceControls, setDeviceControls] = useState(new Map());
  const [alarmNotifications, setAlarmNotifications] = useState([]);

  // Load notifications dari localStorage saat component mount
  useEffect(() => {
    if (user) {
      try {
        const storedNotifications = localStorage.getItem("notifications");
        // console.log("🔍 Loading from localStorage:", storedNotifications);
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications);
          // console.log("📦 Parsed notifications:", parsed);
          setAlarmNotifications(parsed);
        }
      } catch (error) {
        console.error("Error loading notifications from localStorage:", error);
      }
    }
  }, [user]);

  // Save notifications ke localStorage setiap kali berubah
  useEffect(() => {
    if (user && alarmNotifications.length > 0) {
      try {
        // console.log("💾 Saving to localStorage:", alarmNotifications.length, "notifications");
        localStorage.setItem("notifications", JSON.stringify(alarmNotifications));
      } catch (error) {
        console.error("Error saving notifications to localStorage:", error);
      }
    }
  }, [alarmNotifications, user]);

  // Clear notifications saat user logout
  useEffect(() => {
    if (!user || !user.id) {
      setAlarmNotifications([]);
      setIsConnected(false);
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      try {
        localStorage.removeItem("notifications");
      } catch (error) {
        console.error("Error clearing notifications from localStorage:", error);
      }
    }
  }, [user]);

  // Function to create WebSocket connection
  const createWebSocketConnection = () => {
    if (!user) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWs(null);
      setIsConnected(false);
    }

    console.log(`🔄 Attempting WebSocket connection... (Attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_BACKEND_WS}/ws/user`
    );
    wsRef.current = socket;
    setWs(socket);

    socket.onopen = () => {
      console.log("✅ WebSocket connected!");
      setIsConnected(true);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle device status updates
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
        
        // Handle device control status updates
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

        // Handle command execution results
        if (data.type === "command_executed") {
          console.log(`Command ${data.command_id} executed:`, data.success ? 'SUCCESS' : 'FAILED');
          // You can add toast notifications here
        }

        // Handle alarm notifications
        if (data.type === "alarm_notification") {
          // Tambahkan notification baru ke state dan localStorage
          setAlarmNotifications(prev => {
            const newNotifications = [data.data, ...prev];
            // Limit notifications (misal: maksimal 100)
            return newNotifications.slice(0, 100);
          });
          
          // Show browser notification if permission granted
          if (Notification.permission === "granted") {
            new Notification(data.data.title, {
              body: data.data.message,
              icon: "/web-logo.svg",
              badge: "/web-logo.svg"
            });
          }
        }

      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
    
    socket.onclose = (event) => {
      console.log("❌ WebSocket disconnected!", event.code, event.reason);
      setIsConnected(false);
      wsRef.current = null;
      setWs(null);

      // Only attempt reconnect if user is still logged in and we haven't exceeded max attempts
      if (user && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        console.log(`🔄 Scheduling reconnect in ${reconnectDelay/1000} seconds... (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          createWebSocketConnection();
        }, reconnectDelay);
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error("❌ Max reconnection attempts reached. Please refresh the page.");
      }
    };
    
    socket.onerror = (e) => {
      console.error("❌ WebSocket error:", e);
      setIsConnected(false);
    };
  };

  useEffect(() => {
    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (user) {
      // Fetch notifications saat user login (hanya sekali)
      const fetchLoginNotifications = async () => {
        try {
          const response = await fetchFromBackend("/notifications/");
          
          if (response.ok) {
            const data = await response.json();
            // console.log("🌐 API Response:", data);
            if (data.success && data.notifications) {
              // Merge dengan notifications yang sudah ada di localStorage
              setAlarmNotifications(prev => {
                const combined = [...data.notifications, ...prev];
                // Remove duplicates based on ID
                const unique = combined.filter((notification, index, self) => 
                  index === self.findIndex(n => n.id === notification.id)
                );
                const sorted = unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                // console.log("🔄 Final merged notifications:", sorted.length);
                return sorted;
              });
            }
          }
        } catch (error) {
          console.error('Error fetching login notifications:', error);
        }
      };

      fetchLoginNotifications();
      // Reset reconnect attempts when user changes
      reconnectAttemptsRef.current = 0;
      // Create initial WebSocket connection
      createWebSocketConnection();
    }

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWs(null);
        setIsConnected(false);
      }
    };
  }, [user]);

  // Function to manually trigger reconnection
  const reconnectWebSocket = () => {
    if (user && reconnectAttemptsRef.current < maxReconnectAttempts) {
      console.log("🔄 Manual reconnection triggered...");
      reconnectAttemptsRef.current = 0; // Reset attempts for manual reconnect
      createWebSocketConnection();
    }
  };

  // Function to send device commands
  const sendDeviceCommand = (deviceId, controlId, commandType, value) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      const command = {
        type: "device_command",
        device_id: deviceId,
        control_id: controlId,
        command_type: commandType,
        value: value,
        timestamp: new Date().toISOString()
      };
      ws.send(JSON.stringify(command));
      return true;
    }
    console.warn("❌ Cannot send command: WebSocket not connected");
    return false;
  };

  const contextValue = {
    ws,
    isConnected,
    deviceStatuses,
    deviceControls,
    alarmNotifications,
    setAlarmNotifications,
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
