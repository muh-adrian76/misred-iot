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

  // Fungsi untuk mengambil semua perangkat beserta data lokasinya
  const fetchDevices = async () => {
    try {
      // Set status loading
      setIsLoading(true);
      
      // Ambil data lokasi perangkat dari backend
      const response = await fetchFromBackend("/admin/devices/locations");
      const data = await response.json();
      
      // Cek apakah respons berhasil
      if (data.status === "success") {
        // Transformasi data dari backend ke format frontend
        const transformedDevices = data.data.map(device => ({
          id: device.id, // ID perangkat
          name: device.name, // Nama perangkat
          location: { 
            lat: device.latitude, // Latitude lokasi
            lng: device.longitude, // Longitude lokasi
            address: device.address // Alamat lokasi
          },
          status: device.status, // Status perangkat (online/offline)
          owner: device.user_name, // Nama pemilik perangkat
          lastSeen: device.last_seen, // Waktu terakhir terlihat
          type: "sensor" // Default type karena tidak ada data dari backend
        }));
        
        // Set data perangkat yang sudah ditransformasi
        setDevices(transformedDevices);
      } else {
        throw new Error(data.message || "Gagal mengambil data perangkat");
      }

      // Set loading selesai
      setIsLoading(false);
    } catch (error) {
      // Tangani error pengambilan data
      console.error("Gagal mengambil perangkat:", error);
      errorToast("Gagal memuat data lokasi perangkat");
      setIsLoading(false);
    }
  };

  // Filter perangkat berdasarkan status
  const filteredDevices = devices.filter(device => {
    if (filterStatus === 'all') return true;
    return device.status === filterStatus;
  });

  // Saat perangkat dipilih
  const selectDevice = (device) => {
    setSelectedDevice(device);
  };

  // Hapus pilihan
  const clearSelection = () => {
    setSelectedDevice(null);
  };

  // Perbarui lokasi perangkat
  const updateDeviceLocation = async (deviceId, latitude, longitude, address) => {
    try {
      const response = await fetchFromBackend(`/admin/devices/${deviceId}/location`, {
        method: 'PUT',
        body: JSON.stringify({ latitude, longitude, address })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        fetchDevices(); // Segarkan data
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Gagal memperbarui lokasi perangkat:", error);
      errorToast("Gagal memperbarui lokasi perangkat");
      return false;
    }
  };

  // Segarkan data
  const handleRefresh = async () => {
    await fetchDevices();
    successToast("Data berhasil diperbarui");
  };
  
  // Inisialisasi data
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
