// Hook dan Provider untuk manajemen status notifikasi WhatsApp
// Menangani: pengambilan status, mengaktifkan/menonaktifkan notifikasi, dan berbagi context
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { fetchFromBackend } from '@/lib/helper';

// Context untuk berbagi status WhatsApp antar komponen
const WhatsAppStatusContext = createContext();

// Komponen Provider untuk status notifikasi WhatsApp
export function WhatsAppStatusProvider({ children }) {
  const [whatsappEnabled, setWhatsappEnabled] = useState(false); // Status notifikasi WA
  const [loading, setLoading] = useState(true);

  // Ambil status notifikasi WhatsApp saat ini dari backend
  const fetchWhatsAppStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFromBackend("/user/whatsapp-notifications");
      if (res.ok) {
        const data = await res.json();
        setWhatsappEnabled(data.whatsapp_notifications_enabled || false);
      }
    } catch (error) {
      console.error("Kesalahan saat mengambil status WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Perbarui status WhatsApp (biasanya dipanggil setelah API call berhasil)
  const updateWhatsAppStatus = useCallback((newStatus) => {
    setWhatsappEnabled(newStatus);
  }, []);

  const refreshWhatsAppStatus = useCallback(() => {
    fetchWhatsAppStatus();
  }, [fetchWhatsAppStatus]);

  useEffect(() => {
    fetchWhatsAppStatus();
  }, [fetchWhatsAppStatus]);

  const value = {
    whatsappEnabled,
    loading,
    updateWhatsAppStatus,
    refreshWhatsAppStatus,
  };

  return (
    <WhatsAppStatusContext.Provider value={value}>
      {children}
    </WhatsAppStatusContext.Provider>
  );
}

// Hook untuk menggunakan status WhatsApp dari context
export function useWhatsAppStatus() {
  const context = useContext(WhatsAppStatusContext);
  if (!context) {
    throw new Error('useWhatsAppStatus harus digunakan di dalam WhatsAppStatusProvider');
  }
  return context;
}

// Hook mandiri untuk komponen yang tidak memakai Provider
export function useWhatsAppStatusStandalone() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWhatsAppStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFromBackend("/user/whatsapp-notifications");
      if (res.ok) {
        const data = await res.json();
        setWhatsappEnabled(data.whatsapp_notifications_enabled || false);
      }
    } catch (error) {
      console.error("Kesalahan saat mengambil status WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWhatsAppStatus = useCallback(() => {
    fetchWhatsAppStatus();
  }, [fetchWhatsAppStatus]);

  useEffect(() => {
    fetchWhatsAppStatus();
  }, [fetchWhatsAppStatus]);

  return {
    whatsappEnabled,
    loading,
    refreshWhatsAppStatus,
  };
}
