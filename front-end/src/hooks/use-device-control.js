// Hook untuk device control - mengirim perintah ke IoT devices via WebSocket dan REST API
// Handles: command sending, status tracking, error handling dengan toast notifications
"use client";
import { useState } from "react";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useDeviceControl() {
  const { user } = useUser();
  const { ws, sendDeviceCommand } = useWebSocket();
  const [commandStatus, setCommandStatus] = useState({}); // Track status per command

  /**
   * Send device command dengan dual approach: REST API untuk logging + WebSocket untuk real-time
   * @param {string} deviceId - ID device target
   * @param {string} datastreamId - ID datastream untuk control
   * @param {string} commandType - Jenis command (on/off/set_value/etc)
   * @param {any} value - Value yang akan dikirim
   */
  const sendCommand = async (deviceId, datastreamId, commandType, value) => {
    // Validasi user authentication
    if (!user?.id) {
      errorToast("Error", "User tidak terautentikasi");
      return false;
    }

    try {
      // Step 1: Send via REST API untuk create command record di database
      const response = await fetchFromBackend("/device-command/send", {
        method: "POST",
        body: JSON.stringify({
          device_id: deviceId,
          datastream_id: datastreamId,
          command_type: commandType,
          value: value
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send command");
      }

      const result = await response.json();
      const commandId = result.data?.command_id;

      // Update command status
      setCommandStatus(prev => ({
        ...prev,
        [commandId]: "sent"
      }));

      // Show success message
      successToast("Command Sent", `Perintah berhasil dikirim ke device ${deviceId}`);

      return true;
    } catch (error) {
      console.error("Error sending command:", error);
      errorToast("Command Failed", error.message || "Gagal mengirim perintah ke device");
      return false;
    }
  };

  /**
   * Send toggle command for switch widgets
   */
  const sendToggleCommand = async (deviceId, datastreamId, currentValue) => {
    const newValue = currentValue > 0 ? 0 : 1; // Toggle 0/1
    return await sendCommand(deviceId, datastreamId, "toggle", newValue);
  };

  /**
   * Send value command for slider widgets
   */
  const sendValueCommand = async (deviceId, datastreamId, value) => {
    return await sendCommand(deviceId, datastreamId, "set_value", value);
  };

  /**
   * Check if datastream is actuator (controllable)
   */
  const isActuator = (datastreamType) => {
    return ['string', 'boolean'].includes(datastreamType?.toLowerCase());
  };

  /**
   * Check if datastream is sensor (read-only)
   */
  const isSensor = (datastreamType) => {
    return ['integer', 'double'].includes(datastreamType?.toLowerCase());
  };

  return {
    sendCommand,
    sendToggleCommand,
    sendValueCommand,
    isActuator,
    isSensor,
    commandStatus
  };
}
