// Import hooks React untuk state management dan lifecycle
import { useState, useEffect } from "react";
// Import hook autentikasi admin
import { useAdminAuth } from "@/hooks/use-admin-auth";
// Import utility untuk fetch data dari backend
import { fetchFromBackend } from "@/lib/helper";
// Import komponen toast untuk notifikasi
import { successToast, errorToast } from "@/components/custom/other/toaster";

// Hook kustom untuk logika halaman admin maps/peta device
export function useAdminMapsLogic() {
  // State untuk data devices dengan lokasi
  const [devices, setDevices] = useState([]);
  // State loading untuk indikator proses
  const [isLoading, setIsLoading] = useState(true);
  // State untuk device yang dipilih di peta
  const [selectedDevice, setSelectedDevice] = useState(null);
  // State untuk jenis tampilan peta (satellite, street, hybrid)
  const [mapView, setMapView] = useState('satellite');
  // State untuk menampilkan semua device atau tidak
  const [showAllDevices, setShowAllDevices] = useState(true);
  // State untuk filter status device (all, online, offline)
  const [filterStatus, setFilterStatus] = useState('all');

  // State autentikasi admin dari hook use-admin-auth
  const { user, isAdmin, isAuthenticated, isLoading: adminLoading } = useAdminAuth();

  // Fungsi untuk mengambil semua device dengan data lokasi
  const fetchDevices = async () => {
    try {
      // Set loading state
      setIsLoading(true);
      
      // Fetch data lokasi device dari backend
      const response = await fetchFromBackend("/admin/devices/locations");
      const data = await response.json();
      
      // Cek apakah response berhasil
      if (data.status === "success") {
        // Transform data dari backend ke format frontend
        const transformedDevices = data.data.map(device => ({
          id: device.id, // ID device
          name: device.name, // Nama device
          location: { 
            lat: device.latitude, // Latitude lokasi
            lng: device.longitude, // Longitude lokasi
            address: device.address // Alamat lokasi
          },
          status: device.status, // Status device (online/offline)
          owner: device.user_name, // Nama pemilik device
          lastSeen: device.last_seen, // Waktu terakhir terlihat
          type: "sensor" // Default type karena tidak ada data dari backend
        }));
        
        // Set data devices yang sudah ditransform
        setDevices(transformedDevices);
      } else {
        throw new Error(data.message || "Failed to fetch devices");
      }

      // Set loading selesai
      setIsLoading(false);
    } catch (error) {
      // Handle error fetch
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
