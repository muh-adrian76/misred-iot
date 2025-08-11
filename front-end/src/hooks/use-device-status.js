// Hook untuk pelacakan status perangkat real-time - gabungan data database + WebSocket
// Menyediakan: status online/offline, waktu terakhir terlihat, dan pemantauan tingkat aktivitas
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/providers/websocket-provider';
import { fetchFromBackend } from '@/lib/helper';

export function useDeviceStatus(devices) {
  const [deviceStatuses, setDeviceStatuses] = useState({}); // Peta status perangkat per ID
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const { deviceStatuses: wsDeviceStatuses, isConnected } = useWebSocket();

  // Effect untuk menggabungkan data perangkat dari database dengan update real-time WebSocket
  useEffect(() => {
    if (devices && Array.isArray(devices)) {
      const statusMap = {};
      devices.forEach(device => {
        // Gabungkan data database dengan status real-time dari WebSocket
        const wsStatus = wsDeviceStatuses.get(device.id);
        statusMap[device.id] = {
          status: wsStatus?.status || device.status || 'offline', // Prioritas real-time
          lastSeenAt: wsStatus?.timestamp || device.last_seen_at,
          activityLevel: device.activity_level || 'unknown',
          secondsSinceLastSeen: device.seconds_since_last_seen || null
        };
      });
      setDeviceStatuses(statusMap);
      setLastUpdateTime(Date.now());
    }
  }, [devices, wsDeviceStatuses]);

  // Dengarkan pembaruan status real-time dari WebSocket - HANYA REAL-TIME
  useEffect(() => {
    if (wsDeviceStatuses && wsDeviceStatuses.size > 0) {
      setDeviceStatuses(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        wsDeviceStatuses.forEach((statusData, deviceId) => {
          if (prev[deviceId]) {
            console.log(`🔄 Pembaruan status perangkat real-time ${deviceId}:`, statusData);
            updated[deviceId] = {
              ...prev[deviceId],
              status: statusData.status,
              lastSeenAt: statusData.timestamp,
              secondsSinceLastSeen: statusData.status === 'offline' ? 0 : prev[deviceId].secondsSinceLastSeen
            };
            hasChanges = true;
          }
        });

        if (hasChanges) {
          setLastUpdateTime(Date.now());
        }

        return hasChanges ? updated : prev;
      });
    }
  }, [wsDeviceStatuses]);

  // Timer sederhana untuk memperbarui tampilan "detik sejak terakhir terlihat" (hanya untuk display)
  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceStatuses(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.keys(updated).forEach(deviceId => {
          const device = updated[deviceId];
          if (device.lastSeenAt && device.status === 'offline') {
            const now = Date.now();
            const lastSeen = new Date(device.lastSeenAt).getTime();
            const secondsSince = Math.floor((now - lastSeen) / 1000);
            
            // Perbarui seconds since last seen untuk tampilan saja
            if (device.secondsSinceLastSeen !== secondsSince) {
              updated[deviceId] = {
                ...device,
                secondsSinceLastSeen: secondsSince
              };
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          setLastUpdateTime(Date.now());
        }

        return hasChanges ? updated : prev;
      });
    }, 5000); // Perbarui setiap 5 detik - HANYA UNTUK TAMPILAN

    return () => clearInterval(interval);
  }, []); // Tidak ada dependency - hanya untuk timer tampilan

  // Ambil status untuk perangkat tertentu
  const getDeviceStatus = useCallback((deviceId) => {
    return deviceStatuses[deviceId] || {
      status: 'offline',
      lastSeenAt: null,
      activityLevel: 'unknown',
      secondsSinceLastSeen: null
    };
  }, [deviceStatuses]);

  // Statistik status
  const getStatusStats = useCallback(() => {
    const stats = {
      total: 0,
      online: 0,
      offline: 0,
      neverSeen: 0,
      recentlyActive: 0
    };

    Object.values(deviceStatuses).forEach(device => {
      stats.total++;
      if (device.status === 'online') stats.online++;
      if (device.status === 'offline') stats.offline++;
      if (!device.lastSeenAt) stats.neverSeen++;
      if (device.activityLevel === 'active') stats.recentlyActive++;
    });

    return stats;
  }, [deviceStatuses]);

  // Paksa refresh status (pemicu manual)
  const refreshDeviceStatuses = useCallback(() => {
    // Sederhana: hanya perbarui timestamp untuk memicu re-render
    setLastUpdateTime(Date.now());
  }, []);

  // Format waktu sejak terakhir terlihat
  const formatTimeSinceLastSeen = useCallback((secondsSince) => {
    if (!secondsSince || secondsSince < 0) return 'Belum pernah';
    
    if (secondsSince < 60) return `${secondsSince} dtk lalu`;
    if (secondsSince < 3600) return `${Math.floor(secondsSince / 60)} mnt lalu`;
    if (secondsSince < 86400) return `${Math.floor(secondsSince / 3600)} jam lalu`;
    return `${Math.floor(secondsSince / 86400)} hr lalu`;
  }, []);

  return {
    deviceStatuses,
    getDeviceStatus,
    getStatusStats,
    refreshDeviceStatuses,
    formatTimeSinceLastSeen,
    lastUpdateTime,
    isConnected
  };
}
