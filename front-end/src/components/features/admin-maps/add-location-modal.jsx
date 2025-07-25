"use client";

import { useState } from "react";
import { X, MapPin, Loader2, Check, AlertCircle } from "lucide-react";
import { LocationPicker } from "../../location-picker";
import { Button } from "../../ui/button";

export default function AddLocationModal({ 
  device, 
  isOpen, 
  onClose, 
  onLocationUpdated 
}) {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleLocationChange = (locationData) => {
    console.log("Location data received:", locationData);
    setSelectedLocation(locationData.address || "");
    setCoordinates({
      lat: locationData.lat,
      lng: locationData.lng
    });
    setError(null);
  };

  const handleSaveLocation = async () => {
    if (!coordinates.lat || !coordinates.lng) {
      setError("Pilih lokasi terlebih dahulu");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/devices/${device.id}/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          address: selectedLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan lokasi");
      }

      setSuccess(true);
      
      // Call callback to refresh device data
      if (onLocationUpdated) {
        onLocationUpdated(device.id, {
          lat: coordinates.lat,
          lng: coordinates.lng,
          address: selectedLocation,
        });
      }

      // Close modal after a brief delay to show success message
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setSelectedLocation("");
        setCoordinates({ lat: null, lng: null });
      }, 1500);

    } catch (error) {
      console.error("Error saving location:", error);
      setError(error.message || "Gagal menyimpan lokasi");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tambah Lokasi Device
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {device.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Lokasi berhasil disimpan!
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {error}
              </span>
            </div>
          )}

          {/* Current Location */}
          {device.location?.address && (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lokasi Saat Ini:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {device.location.address}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                {device.location.lat?.toFixed(6)}, {device.location.lng?.toFixed(6)}
              </p>
            </div>
          )}

          {/* Location Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih Lokasi Baru
            </label>
            <LocationPicker
              placeholder="Cari lokasi atau klik pada peta"
              onChange={handleLocationChange}
              autoDetectOnLoad={false}
              defaultLocation={selectedLocation}
              variant="input"
              theme={{
                input: "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white",
                suggestionsContainer: "mt-1 w-full bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 shadow-lg max-h-60 overflow-y-auto z-10",
                suggestionItem: "px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0 transition-colors",
              }}
            />
          </div>

          {/* Selected Coordinates */}
          {coordinates.lat && coordinates.lng && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                Koordinat Terpilih:
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
              {selectedLocation && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {selectedLocation}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2"
          >
            Batal
          </Button>
          <Button
            onClick={handleSaveLocation}
            disabled={isLoading || !coordinates.lat || !coordinates.lng}
            className="px-4 py-2 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Simpan Lokasi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
