"use client";

import { useEffect, useState } from "react";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import { useUser } from "@/providers/user-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Smartphone } from "lucide-react";

/**
 * Komponen untuk meminta permission notifikasi browser
 * Muncul saat user pertama kali login atau belum memberikan permission
 */
export function NotificationPermissionDialog() {
  const { user } = useUser();
  const {
    permission,
    isSupported,
    isDefault,
    requestPermission,
    isRequesting,
  } = useNotificationPermission();

  const [showDialog, setShowDialog] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  // Auto-close dialog jika terlalu lama meminta permission
  useEffect(() => {
    if (isRequesting) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Permintaan permission memakan waktu terlalu lama, menutup dialog otomatis");
        setShowDialog(false);
        setHasAsked(true);
        
        try {
          localStorage.setItem("notification_permission_asked", "true");
        } catch (error) {
          console.warn("Tidak dapat menyimpan preferensi notifikasi");
        }
      }, 15000); // 15 detik timeout

      return () => clearTimeout(timeout);
    }
  }, [isRequesting]);

  // Cek apakah user sudah login dan permission masih default
  useEffect(() => {
    if (user && user.id && isSupported && isDefault && !hasAsked) {
      // Delay sedikit untuk memberi waktu UI load
      const timer = setTimeout(() => {
        setShowDialog(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, isSupported, isDefault, hasAsked]);

  const handleAllow = async () => {
    setHasAsked(true);
    
    try {
      // Periksa apakah browser sudah memblokir site ini
      if (Notification.permission === "denied") {
        console.warn("❌ Notifikasi sudah diblokir untuk situs ini sebelumnya");
        setShowDialog(false);
        localStorage.setItem("notification_permission_asked", "true");
        alert("Notifikasi diblokir untuk situs ini. Aktifkan di pengaturan browser:\n\n1. Klik ikon gembok/info di address bar\n2. Pilih 'Notifications' → 'Allow'\n3. Refresh halaman");
        return;
      }
      
      const result = await requestPermission();
      console.log("🔔 Hasil permission akhir:", result);

      // Selalu tutup dialog dan simpan preferensi terlepas dari hasilnya
      setShowDialog(false);
      
      // Simpan preferensi ke localStorage
      try {
        localStorage.setItem("notification_permission_asked", "true");
      } catch (error) {
        console.warn("Tidak dapat menyimpan preferensi notifikasi");
      }

      // Tampilkan feedback berdasarkan hasil
      if (result === "denied") {
        console.log("❌ Permission notifikasi ditolak oleh pengguna");
        // Tampilkan instruksi untuk enable manual
        setTimeout(() => {
          alert("Untuk mengaktifkan notifikasi:\n\n1. Klik ikon gembok/info di address bar\n2. Pilih 'Notifications' → 'Allow'\n3. Refresh halaman");
        }, 1000);
      }
      
    } catch (error) {
      console.error("❌ Error dalam handleAllow:", error);
      // Selalu tutup dialog bahkan jika ada error
      setShowDialog(false);
      
      try {
        localStorage.setItem("notification_permission_asked", "true");
      } catch (storageError) {
        console.warn("Tidak dapat menyimpan preferensi notifikasi");
      }
      
      // Tampilkan instruksi manual saat error
      setTimeout(() => {
        alert("Gagal meminta izin notifikasi. Aktifkan manual:\n\n1. Klik ikon gembok/info di address bar\n2. Pilih 'Notifications' → 'Allow'\n3. Refresh halaman");
      }, 1000);
    }
  };

  const handleDeny = () => {
    setHasAsked(true);
    setShowDialog(false);

    // Simpan preferensi ke localStorage
    try {
      localStorage.setItem("notification_permission_asked", "true");
    } catch (error) {
      console.warn("Tidak dapat menyimpan preferensi notifikasi");
    }
  };

  // Periksa apakah user sudah pernah ditanya sebelumnya
  useEffect(() => {
    try {
      const asked = localStorage.getItem("notification_permission_asked");
      if (asked === "true") {
        setHasAsked(true);
      }
    } catch (error) {
      // localStorage tidak tersedia
    }
  }, []);

  if (!isSupported || !showDialog) {
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            Aktifkan Notifikasi Alarm
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span>Notifikasi akan muncul di desktop dan mobile</span>
              </div>

              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>Tetap mendapat notifikasi meski aplikasi tertutup</span>
              </div>
            </div>
            
            {/* Info debug untuk development */}
            {process.env.NODE_ENV === "development" && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs space-y-1">
                <div><strong>Info Debug:</strong></div>
                <div>Permission: {permission}</div>
                <div>Didukung: {isSupported.toString()}</div>
                <div>Sedang Meminta: {isRequesting.toString()}</div>
                <div>Tipe API: {typeof window !== "undefined" && "Notification" in window ? typeof Notification.requestPermission().then : "N/A"}</div>
              </div>
            )}
            
            <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
              Jika popup tidak muncul, Anda dapat mengaktifkan manual di pengaturan browser
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          {/* Tombol instruksi manual */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                alert("Cara mengaktifkan notifikasi manual:\n\n1. Klik ikon gembok/info di sebelah kiri address bar\n2. Cari 'Notifications' atau 'Pemberitahuan'\n3. Pilih 'Allow' atau 'Izinkan'\n4. Refresh halaman ini\n\nAtau buka Settings browser → Site Settings → Notifications");
              }}
              className="text-xs flex-1 sm:flex-none"
            >
              📖 Cara Manual
            </Button>
            
            {/* Tombol close manual untuk development */}
            {process.env.NODE_ENV === "development" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  console.log("🔧 Tutup manual (debug)");
                  setShowDialog(false);
                  setHasAsked(true);
                  localStorage.setItem("notification_permission_asked", "true");
                }}
                className="text-xs"
              >
                🔧 Tutup
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleDeny}
              disabled={isRequesting}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <BellOff className="h-4 w-4" />
              Tidak Sekarang
            </Button>

            <Button
              type="button"
              onClick={handleAllow}
              disabled={isRequesting}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              {isRequesting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-current" />
                  Meminta Izin...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Aktifkan Notifikasi
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
