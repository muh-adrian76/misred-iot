"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./user-provider";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { user } = useUser();
  const wsRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [deviceStatuses, setDeviceStatuses] = useState(new Map());
  const [deviceControls, setDeviceControls] = useState(new Map());

  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWs(null);
    }

    if (user) {
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
