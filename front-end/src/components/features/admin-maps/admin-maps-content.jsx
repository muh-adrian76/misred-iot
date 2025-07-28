import {
  Layers,
  Filter,
  Wifi,
  WifiOff,
  RefreshCw,
  ZoomOut,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MapView from "@/components/custom/other/map-view";
import { successToast } from "@/components/custom/other/toaster";
import {
  DeviceStatusIcon,
  DeviceInfoPanel,
} from "@/components/custom/other/map-info";
import { useState } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { motion } from "framer-motion";
import { useMobile } from "@/hooks/use-mobile";

export default function AdminMapsContent({
  devices,
  isLoading,
  selectedDevice,
  mapView,
  filterStatus,
  setMapView,
  setFilterStatus,
  selectDevice,
  clearSelection,
  handleRefresh,
  fetchDevices,
}) {
  // State for map functionality
  const [isChangingMapView, setIsChangingMapView] = useState(false);
  const [shouldFitAllDevices, setShouldFitAllDevices] = useState(false);
  
  // Use mobile hook for SSR safety
  const isMobile = useMobile();

  // Function to handle map view change with loading
  const handleMapViewChange = (newView) => {
    setIsChangingMapView(true);
    setMapView(newView);
    // Reset loading after a brief delay to allow tiles to load
    setTimeout(() => setIsChangingMapView(false), 1000);
  };

  // Function to zoom to all devices
  const handleZoomToAll = () => {
    clearSelection(); // Clear selected device
    setShouldFitAllDevices(true);
    // Reset trigger after brief delay
    setTimeout(() => setShouldFitAllDevices(false), 100);
  };

  // Function to handle location updated
  const handleLocationUpdated = (deviceId, locationData, updatedDevice) => {
    // Refresh devices to get updated data
    fetchDevices();
    successToast("Lokasi device berhasil diperbarui");

    // Update selected device with new location untuk update map position
    if (updatedDevice && selectedDevice?.id === deviceId) {
      selectDevice(updatedDevice);
    }
  };

  // Function to handle location filter from header LocationPicker
  // const handleLocationFilter = (selectedLocation) => {
  //   console.log("Location filter selected:", selectedLocation);
  // You can implement location-based filtering here
  // For example, filter devices by region or zoom map to location
  // };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg w-1/3 mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded w-1/2"></div>
        </div>
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl h-96 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 admin-maps-content min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1 }}
        className="flex flex-row items-center justify-between gap-4 backdrop-blur-enhanced rounded-2xl"
      >
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Peta Lokasi Device
          </h1>
          {/* <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Monitor lokasi dan status semua perangkat IoT secara real-time
          </p> */}
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Loading..." : "Refresh"}
            </span>
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Controls with shadcn Select components */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.1 }}
        className="bg-card backdrop-blur-enhanced p-4 lg:px-6 lg:py-4 rounded-2xl shadow-lg border"
      >
        <GlowingEffect
          spread={45}
          glow={true}
          disabled={false}
          proximity={72}
          inactiveZone={0.02}
        />
        <div className="lg:flex lg:flex-row grid grid-cols-2 gap-4 lg:gap-6 items-start lg:items-center">
          {/* Map View Selector */}
          <div className="flex max-md:flex-col justify-between items-center gap-3 w-auto">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Layers className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium whitespace-nowrap">
                Tampilan Peta:
              </span>
            </div>
            <Select
              value={mapView}
              onValueChange={handleMapViewChange}
              disabled={isChangingMapView}
            >
              <SelectTrigger className="w-full lg:w-48 h-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm">
                <SelectValue placeholder="Pilih tampilan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
                <SelectItem value="street" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
                    Jalan (Street)
                  </div>
                </SelectItem>
                <SelectItem value="satellite" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    Satelit (Satellite)
                  </div>
                </SelectItem>
                <SelectItem value="hybrid" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    Hybrid (Satelit + Label)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center max-md:flex-col gap-3 w-auto">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Filter className="w-5 h-5 text-pink-600" />
              <span className="text-sm font-medium whitespace-nowrap">
                Status:
              </span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-40 h-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 dark:border-gray-700">
                <SelectItem value="all" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    Semua
                  </div>
                </SelectItem>
                <SelectItem value="online" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Online
                  </div>
                </SelectItem>
                <SelectItem value="offline" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Offline
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Device Count and Actions */}
          <div className="flex items-center justify-center lg:justify-end gap-3 w-full lg:flex-1 lg:ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {devices.length} device{devices.length !== 1 ? "s" : ""}{" "}
                ditemukan
              </span>
            </div>
            {selectedDevice && (
              <Button
                onClick={handleZoomToAll}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20 rounded-xl"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="hidden sm:inline">Lihat Semua</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Enhanced Map Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.2 }}
        className="relative bg-card backdrop-blur-enhanced rounded-2xl shadow-lg border overflow-hidden"
      >
        <GlowingEffect
          spread={45}
          glow={true}
          disabled={false}
          proximity={72}
          inactiveZone={0.02}
        />
        <div className="h-[500px] lg:h-[600px] relative">
          {isChangingMapView && (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-4 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mengubah tampilan peta...
                </span>
              </div>
            </div>
          )}
          <MapView
            devices={devices.map((device) => ({
              ...device,
              latitude: device.location?.lat ?? device.latitude,
              longitude: device.location?.lng ?? device.longitude,
              description: device.name ?? device.description,
              address: device.location?.address ?? device.address,
              status: device.status,
            }))}
            onMarkerClick={selectDevice}
            selectedDeviceId={selectedDevice?.id}
            selectedDevice={
              selectedDevice
                ? {
                    ...selectedDevice,
                    latitude:
                      selectedDevice.location?.lat ?? selectedDevice.latitude,
                    longitude:
                      selectedDevice.location?.lng ?? selectedDevice.longitude,
                  }
                : null
            }
            mapView={mapView}
            shouldFitAllDevices={shouldFitAllDevices}
          />
          {/* Device Info Panel */}
          <DeviceInfoPanel
            device={selectedDevice}
            onClose={clearSelection}
            onLocationUpdated={handleLocationUpdated}
          />
        </div>
      </motion.div>

      {/* Enhanced Device List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.3 }}
        className="bg-card backdrop-blur-enhanced rounded-2xl shadow-lg border"
      >
        <GlowingEffect
          spread={45}
          glow={true}
          disabled={false}
          proximity={72}
          inactiveZone={0.02}
        />
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/50 dark:to-gray-600/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-pink-600" />
            Daftar Device
          </h3>
        </div>

        <div className="p-4 lg:p-6">
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6">
                <MapPin className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Tidak ada device
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                {filterStatus === "all"
                  ? "Belum ada device yang terdaftar dalam sistem"
                  : `Tidak ada device dengan status ${filterStatus === "online" ? "online" : "offline"} saat ini`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`group p-4 lg:p-5 border rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 device-card ${
                    selectedDevice?.id === device.id
                      ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-600 shadow-lg scale-[1.02]"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => {
                    selectDevice(device);
                    // Scroll ke atas untuk melihat peta jika di mobile
                    if (isMobile) {
                      document
                        .querySelector(".admin-maps-content")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <DeviceStatusIcon
                      status={device.status}
                      type={device.type}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate text-base lg:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {device.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1 leading-relaxed">
                        {device.location?.address || "Alamat tidak tersedia"}
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          {device.status === "online" ? (
                            <Wifi className="w-4 h-4 text-green-600" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              device.status === "online"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {device.status === "online" ? "Online" : "Offline"}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {device.lastSeen}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
