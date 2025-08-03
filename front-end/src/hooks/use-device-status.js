// Hook untuk real-time device status tracking - gabungan database + WebSocket data
// Provides: online/offline status, last seen time, activity level monitoring
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/providers/websocket-provider';
import { fetchFromBackend } from '@/lib/helper';

export function useDeviceStatus(devices) {
  const [deviceStatuses, setDeviceStatuses] = useState({}); // Map device status by ID
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const { deviceStatuses: wsDeviceStatuses, isConnected } = useWebSocket();

  // Effect untuk merge device data dari database dengan real-time WebSocket updates
  useEffect(() => {
    if (devices && Array.isArray(devices)) {
      const statusMap = {};
      devices.forEach(device => {
        // Combine database data dengan WebSocket real-time status
        const wsStatus = wsDeviceStatuses.get(device.id);
        statusMap[device.id] = {
          status: wsStatus?.status || device.status || 'offline', // Real-time priority
          lastSeenAt: wsStatus?.timestamp || device.last_seen_at,
          activityLevel: device.activity_level || 'unknown',
          secondsSinceLastSeen: device.seconds_since_last_seen || null
        };
      });
      setDeviceStatuses(statusMap);
      setLastUpdateTime(Date.now());
    }
  }, [devices, wsDeviceStatuses]);

  // Listen for WebSocket real-time status updates - REAL-TIME ONLY
  useEffect(() => {
    if (wsDeviceStatuses && wsDeviceStatuses.size > 0) {
      setDeviceStatuses(prev => {
        const updated = { ...prev };
        let hasChanges = false;

        wsDeviceStatuses.forEach((statusData, deviceId) => {
          if (prev[deviceId]) {
            console.log(`🔄 Real-time device ${deviceId} status update:`, statusData);
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

  // Simple timer untuk update "seconds since last seen" display saja (tidak untuk logic offline)
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
            
            // Update seconds since last seen untuk display saja
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
    }, 5000); // Update every 5 seconds - HANYA UNTUK DISPLAY

    return () => clearInterval(interval);
  }, []); // Removed dependencies - hanya untuk display timer

  // Get status for specific device
  const getDeviceStatus = useCallback((deviceId) => {
    return deviceStatuses[deviceId] || {
      status: 'offline',
      lastSeenAt: null,
      activityLevel: 'unknown',
      secondsSinceLastSeen: null
    };
  }, [deviceStatuses]);

  // Get status statistics
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

  // Force refresh status (manual trigger)
  const refreshDeviceStatuses = useCallback(() => {
    // Sederhana: hanya update timestamp untuk trigger re-render
    setLastUpdateTime(Date.now());
  }, []);

  // Format time since last seen
  const formatTimeSinceLastSeen = useCallback((secondsSince) => {
    if (!secondsSince || secondsSince < 0) return 'Never';
    
    if (secondsSince < 60) return `${secondsSince}s ago`;
    if (secondsSince < 3600) return `${Math.floor(secondsSince / 60)}m ago`;
    if (secondsSince < 86400) return `${Math.floor(secondsSince / 3600)}h ago`;
    return `${Math.floor(secondsSince / 86400)}d ago`;
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
