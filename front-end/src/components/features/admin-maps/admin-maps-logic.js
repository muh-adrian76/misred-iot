import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "@/components/custom/other/toaster";

export function useAdminMapsLogic() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [mapView, setMapView] = useState('satellite'); // satellite, street, hybrid
  const [showAllDevices, setShowAllDevices] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, online, offline

  // Admin auth state
  const { user, isAdmin, isAuthenticated, isLoading: adminLoading } = useAdminAuth();

  // Fetch all devices with location data
  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetchFromBackend("/admin/devices/locations");
      const data = await response.json();
      
      if (data.status === "success") {
        // Transform data to match frontend format
        const transformedDevices = data.data.map(device => ({
          id: device.id,
          name: device.name,
          location: { 
            lat: device.latitude, 
            lng: device.longitude, 
            address: device.address 
          },
          status: device.status,
          owner: device.user_name,
          lastSeen: device.last_seen,
          type: "sensor" // Default type since it's not in backend data
        }));
        
        setDevices(transformedDevices);
      } else {
        throw new Error(data.message || "Failed to fetch devices");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching devices:", error);
      errorToast("Gagal memuat data lokasi device");
      setIsLoading(false);
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

  // Update device location
  const updateDeviceLocation = async (deviceId, latitude, longitude, address) => {
    try {
      const response = await fetchFromBackend(`/admin/devices/${deviceId}/location`, {
        method: 'PUT',
        body: JSON.stringify({ latitude, longitude, address })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchDevices(); // Refresh data
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error updating device location:", error);
      errorToast("Gagal memperbarui lokasi device");
      return false;
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    await fetchDevices();
    successToast("Data berhasil diperbarui");
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
    isLoading: isLoading || adminLoading,
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
    updateDeviceLocation,
    handleRefresh,
    fetchDevices
  };
}
