"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./user-provider";
import { fetchFromBackend } from "@/lib/helper";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { user } = useUser();
  const wsRef = useRef(null);
  const [ws, setWs] = useState(null);
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
    if (!user) {
      setAlarmNotifications([]);
      try {
        localStorage.removeItem("notifications");
      } catch (error) {
        console.error("Error clearing notifications from localStorage:", error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWs(null);
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

      const socket = new WebSocket(
        `${process.env.NEXT_PUBLIC_BACKEND_WS}/ws/user`
      );
      wsRef.current = socket;
      setWs(socket);

      socket.onopen = () => {
        console.log("WebSocket connected!");
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
      
      socket.onclose = () => {
        console.log("WebSocket disconnected!");
      };
      
      socket.onerror = (e) => {
        // console.error("WebSocket error:", e);
      };
    }
  }, [user]);

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
    return false;
  };

  const contextValue = {
    ws,
    deviceStatuses,
    deviceControls,
    alarmNotifications,
    setAlarmNotifications,
    sendDeviceCommand,
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
