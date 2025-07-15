"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./user-provider";

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const { user } = useUser();
  const wsRef = useRef(null);
  const [ws, setWs] = useState(null);

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
      socket.onclose = () => {
        console.log("WebSocket disconnected!");
      };
      socket.onerror = (e) => {
        // console.error("WebSocket error:", e);
      };
    }
  }, [user]);

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
