import {
  MapPin,
  Wifi,
  WifiOff,
  Thermometer,
  Droplets,
  Beaker,
  X,
  Check,
  AlertCircle,
  Save,
  ArrowLeft,
  MapPinned,
  Monitor,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationPickerClient } from "@/components/custom/other/location-picker-client";
import { useState } from "react";
import { fetchFromBackend } from "@/lib/helper";

// Device status icon with enhanced styling
export function DeviceStatusIcon({ status, type }) {
  const getTypeIcon = () => {
    // Dapat digunakan untuk menampilkan ikon lain, defaultnya adalah Pin
    switch (type) {
      case "temperature":
        return <Thermometer className="w-4 h-4" />;
      case "humidity":
        return <Droplets className="w-4 h-4" />;
      case "water_quality":
        return <Beaker className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`p-2.5 rounded-xl shadow-sm transition-all duration-200 ${
        status === "online"
          ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-600 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800 device-status-online"
          : "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 text-red-600 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800 device-status-offline"
      }`}
    >
      {getTypeIcon()}
    </div>
  );
}

// Enhanced Device Info Panel with better responsive design
export function DeviceInfoPanel({ device, onClose, onLocationUpdated }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [inputMode, setInputMode] = useState("address"); // "address" or "coordinates"

  if (!device) return null;

  const handleEditClick = () => {
    setIsEditMode(true);
    setError(null);
    setSuccess(false);
    
    // Pre-fill dengan data yang ada
    if (device.location) {
      setAddressInput(device.location.address || "");
      setLatitudeInput(device.location.lat?.toString() || "");
      setLongitudeInput(device.location.lng?.toString() || "");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setError(null);
    setSuccess(false);
    setAddressInput("");
    setLatitudeInput("");
    setLongitudeInput("");
  };

  const handleSaveLocation = async () => {
    let locationData = null;

    // Validasi input berdasarkan mode
    if (inputMode === "coordinates") {
      const lat = parseFloat(latitudeInput);
      const lng = parseFloat(longitudeInput);
      
      if (isNaN(lat) || isNaN(lng)) {
        setError("Koordinat harus berupa angka yang valid");
        return;
      }
      
      if (lat < -90 || lat > 90) {
        setError("Latitude harus antara -90 dan 90");
        return;
      }
      
      if (lng < -180 || lng > 180) {
        setError("Longitude harus antara -180 dan 180");
        return;
      }

      locationData = {
        lat: lat,
        lng: lng,
        address: addressInput || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
    } else {
      // Mode address menggunakan data dari LocationPicker
      const lat = parseFloat(latitudeInput);
      const lng = parseFloat(longitudeInput);
      
      if (isNaN(lat) || isNaN(lng)) {
        setError("Pilih lokasi menggunakan LocationPicker terlebih dahulu");
        return;
      }

      locationData = {
        lat: lat,
        lng: lng,
        address: addressInput || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const requestBody = {
        latitude: locationData.lat,
        longitude: locationData.lng,
        address: locationData.address,
      };

      const response = await fetchFromBackend(`/admin/devices/${device.id}/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      setSuccess(true);
      
      // Update device data dengan lokasi baru untuk update posisi map
      const updatedDevice = {
        ...device,
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
          address: locationData.address
        },
        latitude: locationData.lat,
        longitude: locationData.lng
      };
      
      // Call callback to refresh device data dan update map position
      if (onLocationUpdated) {
        onLocationUpdated(device.id, locationData, updatedDevice);
      }

      // Reset form setelah berhasil
      setTimeout(() => {
        setIsEditMode(false);
        setSuccess(false);
      }, 1500);

    } catch (error) {
      console.error("Error saving location:", error);
      
      let errorMessage = "Gagal menyimpan lokasi";
      
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      } else if (error.message.includes("401")) {
        errorMessage = "Sesi Anda telah berakhir. Silakan login ulang.";
      } else if (error.message.includes("403")) {
        errorMessage = "Anda tidak memiliki izin untuk mengakses fitur ini.";
      } else if (error.message.includes("404")) {
        errorMessage = "Device tidak ditemukan.";
      } else if (error.message.includes("500")) {
        errorMessage = "Terjadi kesalahan pada server. Coba lagi nanti.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 lg:w-96 max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 z-50 max-h-[calc(100vh-2rem)] overflow-hidden device-info-panel">
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {isEditMode ? (
              <>
                <MapPinned className="w-5 h-5 text-red-600" />
                <span className="hidden sm:inline">Ubah Lokasi Device</span>
                <span className="sm:hidden">Ubah Lokasi</span>
              </>
            ) : (
              <>
                <Monitor className="w-5 h-5 text-red-600" />
                <span className="hidden sm:inline">Informasi Device</span>
                <span className="sm:hidden">Info Device</span>
              </>
            )}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 h-8 w-8 p-0 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="p-1 bg-green-100 dark:bg-green-900/40 rounded-full">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Lokasi berhasil disimpan!
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="p-1 bg-red-100 dark:bg-red-900/40 rounded-full">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              {error}
            </span>
          </div>
        )}

        {isEditMode ? (
          // Edit Mode - Form untuk edit lokasi
          <div className="space-y-4">
            {/* Mode Selector with enhanced styling */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <button
                onClick={() => setInputMode("address")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  inputMode === "address"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-500"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600/50"
                }`}
              >
                <MapPin className="w-4 h-4" />
                Alamat
              </button>
              <button
                onClick={() => setInputMode("coordinates")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  inputMode === "coordinates"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-500"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600/50"
                }`}
              >
                <MapPinned className="w-4 h-4" />
                Koordinat
              </button>
            </div>

            {inputMode === "address" ? (
              // Address Input Mode
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alamat
                  </label>
                  <LocationPickerClient
                    variant="inline"
                    placeholder="Cari lokasi atau klik tombol lokasi"
                    defaultLocation={addressInput} // Set default value untuk sinkronisasi
                    onChange={(locationData) => {
                      if (locationData && locationData.lat && locationData.lng) {
                        setAddressInput(locationData.address || "");
                        setLatitudeInput(locationData.lat.toString());
                        setLongitudeInput(locationData.lng.toString());
                        setError(null);
                      } else if (locationData?.error) {
                        setError(locationData.error);
                      } else if (locationData === null || locationData === "") {
                        // Reset when cleared
                        setAddressInput("");
                        setLatitudeInput("");
                        setLongitudeInput("");
                      }
                    }}
                    autoDetectOnLoad={false}
                    theme={{
                      container: "space-y-3",
                      input: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white",
                      searchButton: "rounded-lg h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white hover:text-white",
                      locateButton: "rounded-lg h-10 w-10 p-0 bg-gray-600 hover:bg-gray-700 dark:bg-gray-300 dark:hover:bg-gray-300 text-white hover:text-white dark:text-black dark:hover:text-black",
                      suggestionsContainer: "w-full bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg max-h-60 overflow-y-auto",
                      suggestionItem: "px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0 transition-colors",
                      suggestionLocation: "text-sm font-medium text-gray-900 dark:text-white",
                      suggestionAddress: "text-xs text-gray-600 dark:text-gray-400 truncate max-w-[250px]",
                      suggestionIcon: "text-blue-600 dark:text-blue-400",
                      errorContainer: "w-full bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3 text-center",
                      loadingContainer: "w-full bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 text-center"
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Gunakan pencarian alamat atau tombol lokasi untuk hasil yang lebih akurat
                  </p>
                </div>
                
                {/* Coordinates display (auto-filled) */}
                {(latitudeInput || longitudeInput) && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Latitude
                      </label>
                      <Input
                        value={latitudeInput}
                        onChange={(e) => setLatitudeInput(e.target.value)}
                        placeholder="-6.200000"
                        className="text-sm"
                        type="number"
                        noInfo
                        step="any"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Longitude
                      </label>
                      <Input
                        value={longitudeInput}
                        onChange={(e) => setLongitudeInput(e.target.value)}
                        placeholder="106.816666"
                        className="text-sm"
                        type="number"
                        noInfo
                        step="any"
                        readOnly
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Coordinates Input Mode
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Latitude *
                    </label>
                    <Input
                      value={latitudeInput}
                      onChange={(e) => setLatitudeInput(e.target.value)}
                      placeholder="-6.200000"
                      className="w-full"
                      type="number"
                      step="any"
                      noInfo
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Longitude *
                    </label>
                    <Input
                      value={longitudeInput}
                      onChange={(e) => setLongitudeInput(e.target.value)}
                      placeholder="106.816666"
                      className="w-full"
                      type="number"
                      noInfo
                      step="any"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deskripsi Alamat (opsional)
                  </label>
                  <Input
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="Deskripsi lokasi atau alamat manual"
                    className="w-full"
                    noInfo
                  />
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Koordinat harus dalam format desimal. Latitude: -90 hingga 90, Longitude: -180 hingga 180
                </p>
              </div>
            )}

            {/* Action Buttons with enhanced styling */}
            <div className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isLoading}
                className="flex-1 h-10 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <Button
                onClick={handleSaveLocation}
                disabled={isLoading}
                className="flex-1 h-10 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white shadow-sm"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Enhanced View Mode - Informasi device
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-50/50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl border border-gray-200/30 dark:border-gray-600/30">
              <DeviceStatusIcon status={device.status} type={device.type} />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {device.name}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  {device.status === "online" ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      device.status === "online" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {device.status === "online" ? "Terhubung" : "Terputus"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Pemilik
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  {device.owner}
                </p>
              </div>
              <div className="p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  Lokasi
                </p>
                <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed">
                  {device.location?.address || "Alamat tidak tersedia"}
                </p>
              </div>
              <div className="p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800/30">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                  Terakhir Terlihat
                </p>
                <p className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                  {device.lastSeen}
                </p>
              </div>
              <div className="p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800/30">
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
                  Koordinat
                </p>
                <p className="text-sm text-orange-900 dark:text-orange-100 font-mono">
                  {device.location?.lat?.toFixed(6) || "0.000000"},{" "}
                  {device.location?.lng?.toFixed(6) || "0.000000"}
                </p>
              </div>
            </div>

            {/* Enhanced Edit Location Button */}
            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <Button
                onClick={handleEditClick}
                className="w-full flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-sm rounded-xl font-medium"
                size="sm"
              >
                <MapPin className="w-4 h-4" />
                {device.location?.lat ? "Ubah Lokasi" : "Tambah Lokasi"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
