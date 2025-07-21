import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useAdminMapsLogic() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [mapView, setMapView] = useState('satellite'); // satellite, street, hybrid
  const [showAllDevices, setShowAllDevices] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, online, offline

  // Admin auth state
  const { user, isAdmin, isAuthenticated, loading: adminLoading } = useAdminAuth();

  // Fetch all devices with location data
  const fetchDevices = async () => {
    try {
      setLoading(true);
      
      // You can implement this endpoint later to get devices with location
      // const response = await fetchFromBackend("/api/admin/devices/locations");
      
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDevices([
        {
          id: 1,
          name: "Sensor Suhu Lab A",
          location: { lat: -7.2575, lng: 112.7521, address: "Lab A, Gedung Utama" },
          status: "online",
          owner: "John Doe",
          lastSeen: "2 menit lalu",
          type: "temperature"
        },
        {
          id: 2,
          name: "Sensor Kelembaban Greenhouse",
          location: { lat: -7.2580, lng: 112.7530, address: "Greenhouse, Area Belakang" },
          status: "online",
          owner: "Jane Smith",
          lastSeen: "5 menit lalu",
          type: "humidity"
        },
        {
          id: 3,
          name: "Monitor Kualitas Air",
          location: { lat: -7.2570, lng: 112.7510, address: "Kolam Penelitian" },
          status: "offline",
          owner: "Bob Wilson",
          lastSeen: "2 jam lalu",
          type: "water_quality"
        }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching devices:", error);
      errorToast("Gagal memuat data lokasi device");
      setLoading(false);
    }
  };

  // Filter devices based on status
  const filteredDevices = devices.filter(device => {
    if (filterStatus === 'all') return true;
    return device.status === filterStatus;
  });

  // Handle device selection
  const selectDevice = (device) => {
    setSelectedDevice(device);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedDevice(null);
  };

  // Initialize data
  useEffect(() => {
    if (!adminLoading && isAuthenticated && isAdmin) {
      fetchDevices();
    }
  }, [adminLoading, isAuthenticated, isAdmin]);

  return {
    // State
    devices: filteredDevices,
    loading: loading || adminLoading,
    selectedDevice,
    mapView,
    showAllDevices,
    filterStatus,
    user,
    isAdmin,
    isAuthenticated,
    
    // Actions
    setMapView,
    setShowAllDevices,
    setFilterStatus,
    selectDevice,
    clearSelection,
    fetchDevices
  };
}
