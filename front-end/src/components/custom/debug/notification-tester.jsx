"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * Komponen tester notifikasi sederhana untuk debugging
 * Hanya tampil di mode development
 */
export function NotificationTester() {
  const [status, setStatus] = useState("");

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const testNotificationAPI = async () => {
    setStatus("Menguji...");
    
    try {
      console.log("=== TEST API NOTIFIKASI ===");
      console.log("1. Memeriksa dukungan API...");
      
      if (!("Notification" in window)) {
        setStatus("❌ API Notifikasi tidak didukung");
        return;
      }
      
      console.log("2. Permission saat ini:", Notification.permission);
      setStatus(`Permission: ${Notification.permission}`);
      
      if (Notification.permission === "granted") {
        console.log("3. Menguji notifikasi...");
        new Notification("Notifikasi Test", {
          body: "API berfungsi dengan baik!",
          icon: "/web-logo.svg"
        });
        setStatus("✅ Notifikasi test terkirim!");
        return;
      }
      
      if (Notification.permission === "denied") {
        setStatus("❌ Permission ditolak - aktifkan secara manual");
        return;
      }
      
      console.log("3. Meminta permission...");
      setStatus("Meminta permission...");
      
      // Test panggilan API langsung
      const result = await Notification.requestPermission();
      console.log("4. Hasil permission:", result);
      
      if (result === "granted") {
        new Notification("Permission Diberikan!", {
          body: "API Notifikasi berfungsi dengan baik!",
          icon: "/web-logo.svg"
        });
        setStatus("✅ Permission diberikan & notifikasi test terkirim!");
      } else {
        setStatus(`❌ Permission ${result}`);
      }
      
    } catch (error) {
      console.error("Error test:", error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg border z-50">
      <div className="text-sm font-semibold mb-2">Test API Notifikasi</div>
      <Button size="sm" onClick={testNotificationAPI} className="mb-2 w-full">
        Test API Notifikasi
      </Button>
      {status && (
        <div className="text-xs bg-white dark:bg-gray-800 p-2 rounded">
          {status}
        </div>
      )}
    </div>
  );
}
