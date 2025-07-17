import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { fetchFromBackend } from '@/lib/helper';

// Create context for WhatsApp status
const WhatsAppStatusContext = createContext();

// Provider component
export function WhatsAppStatusProvider({ children }) {
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
      console.error("Error fetching WhatsApp status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

// Hook to use WhatsApp status
export function useWhatsAppStatus() {
  const context = useContext(WhatsAppStatusContext);
  if (!context) {
    throw new Error('useWhatsAppStatus must be used within a WhatsAppStatusProvider');
  }
  return context;
}

// Custom hook for components that don't need the provider
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
      console.error("Error fetching WhatsApp status:", error);
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
