import { useEffect, useRef } from "react";

export function useUserWebSocket(onSensorUpdate, onStatusUpdate) {
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(`wss://${process.env.BACKEND_URL}/ws/user`);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "sensor_update" && onSensorUpdate) {
        onSensorUpdate(data);
      }
      if (data.type === "status_update" && onStatusUpdate) {
        onStatusUpdate(data);
      }
    };

    return () => {
      ws.current && ws.current.close();
    };
  }, [onSensorUpdate, onStatusUpdate]);

  return ws;
}