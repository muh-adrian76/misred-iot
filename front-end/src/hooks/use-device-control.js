// Hook untuk kontrol perangkat - mengirim perintah ke perangkat IoT via WebSocket dan REST API
// Menangani: pengiriman perintah, pelacakan status, dan penanganan error dengan notifikasi toast
"use client";
import { useState } from "react";
import { useWebSocket } from "@/providers/websocket-provider";
import { useUser } from "@/providers/user-provider";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useDeviceControl() {
  const { user } = useUser();
  const { ws, sendDeviceCommand } = useWebSocket();
  const [commandStatus, setCommandStatus] = useState({}); // Lacak status per perintah

  /**
   * Mengirim perintah perangkat dengan dua jalur: REST API untuk logging + WebSocket untuk real-time
   * @param {string} deviceId - ID perangkat target
   * @param {string} datastreamId - ID datastream untuk kontrol
   * @param {string} commandType - Jenis perintah (on/off/set_value/dll.)
   * @param {any} value - Nilai yang akan dikirim
   */
  const sendCommand = async (deviceId, datastreamId, commandType, value) => {
    // Validasi autentikasi user
    if (!user?.id) {
      errorToast("Kesalahan", "User tidak terautentikasi");
      return false;
    }

    try {
      // Langkah 1: Kirim via REST API untuk membuat catatan perintah di database
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
        throw new Error(errorData.message || "Gagal mengirim perintah");
      }

      const result = await response.json();
      const commandId = result.data?.command_id;

      // Perbarui status perintah
      setCommandStatus(prev => ({
        ...prev,
        [commandId]: "sent"
      }));

      // Tampilkan pesan sukses
      successToast("Perintah Dikirim", `Perintah berhasil dikirim ke device ${deviceId}`);

      return true;
    } catch (error) {
      console.error("Kesalahan saat mengirim perintah:", error);
      errorToast("Perintah Gagal", error.message || "Gagal mengirim perintah ke device");
      return false;
    }
  };

  /**
   * Mengirim perintah toggle untuk widget switch
   */
  const sendToggleCommand = async (deviceId, datastreamId, currentValue) => {
    const newValue = currentValue > 0 ? 0 : 1; // Toggle 0/1
    return await sendCommand(deviceId, datastreamId, "toggle", newValue);
  };

  /**
   * Mengirim perintah nilai untuk widget slider
   */
  const sendValueCommand = async (deviceId, datastreamId, value) => {
    return await sendCommand(deviceId, datastreamId, "set_value", value);
  };

  /**
   * Cek apakah datastream adalah aktuator (dapat dikontrol)
   */
  const isActuator = (datastreamType) => {
    return ['string', 'boolean'].includes(datastreamType?.toLowerCase());
  };

  /**
   * Cek apakah datastream adalah sensor (read-only)
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
