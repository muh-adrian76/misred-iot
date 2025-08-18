"use client";

import { useState, useEffect } from "react";

/**
 * Hook untuk mengelola permission notifikasi browser
 * Menangani request permission dan tracking state
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState("unsupported");
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    // console.log("🔔 Status permission saat ini:", Notification.permission);

    if (Notification.permission === "granted") {
      return "granted";
    }

    if (Notification.permission === "denied") {
      return "denied";
    }

    setIsRequesting(true);
    
    try {
      let result;
      
      // Periksa apakah browser mendukung API Promise-based yang modern
      const requestPermissionMethod = Notification.requestPermission;
      
      if (!requestPermissionMethod) {
        console.error("❌ Notification.requestPermission tidak tersedia");
        setPermission("denied");
        return "denied";
      }

      const permissionResult = Notification.requestPermission();
      
      // Periksa apakah mengembalikan Promise
      if (permissionResult && typeof permissionResult.then === 'function') {
        console.log("🔔 API berbasis Promise terdeteksi");
        // API Promise-based modern
        result = await Promise.race([
          permissionResult,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Waktu permintaan permission habis")), 5000)
          )
        ]);
      } else {
        // API callback-based legacy
        result = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Waktu permintaan permission habis"));
          }, 5000);
          
          if (typeof permissionResult === 'string') {
            // Return sinkron (beberapa browser)
            clearTimeout(timeoutId);
            resolve(permissionResult);
          } else {
            // Coba pendekatan callback
            try {
              Notification.requestPermission((permission) => {
                clearTimeout(timeoutId);
                resolve(permission);
              });
            } catch (callbackError) {
              clearTimeout(timeoutId);
              // Jika callback gagal, gunakan hasil langsung jika tersedia
              if (typeof permissionResult === 'string') {
                resolve(permissionResult);
              } else {
                reject(callbackError);
              }
            }
          }
        });
      }
      setPermission(result);
      
      if (result === "granted") {
        try {
          new Notification("MiSREd IoT", {
            body: "Notifikasi browser telah diaktifkan! Anda akan menerima pemberitahuan alarm secara real-time.",
            icon: "/web-logo.svg",
            tag: "permission-granted"
          });
        } catch (notifError) {
          console.warn("Tidak dapat menampilkan notifikasi welcome:", notifError);
        }
      } else if (result === "denied") {
        console.log("❌ Permission ditolak oleh pengguna");
      }
      
      return result;
    } catch (error) {
      console.error("❌ Error saat meminta permission notifikasi:", error);
      setPermission("denied");
      return "denied";
    } finally {
      setIsRequesting(false);
      console.log("🔔 Permintaan permission selesai");
    }
  };

  const isSupported = typeof window !== "undefined" && "Notification" in window;
  const isGranted = permission === "granted";
  const isDenied = permission === "denied";
  const isDefault = permission === "default";

  return {
    permission,
    isSupported,
    isGranted,
    isDenied,
    isDefault,
    isRequesting,
    requestPermission,
  };
}
