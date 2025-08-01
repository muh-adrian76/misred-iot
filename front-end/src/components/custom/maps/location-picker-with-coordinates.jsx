/**
 * KOMPONEN LOCATION PICKER WITH COORDINATES
 * 
 * LocationPickerWithCoordinates adalah wrapper komponen yang menambahkan
 * fungsionalitas koordinat geografis (lat/lng) ke LocationPicker dasar.
 * Komponen ini menyediakan:
 * 
 * Fitur tambahan:
 * - Automatic geocoding untuk mendapatkan koordinat dari nama lokasi
 * - Reverse geocoding untuk mendapatkan alamat dari koordinat GPS
 * - Enhanced location data dengan format address yang lebih lengkap
 * - Debouncing untuk mengurangi API calls dan rate limiting
 * - Override geolocation API untuk menangkap koordinat current location
 * - Client-side only rendering untuk menghindari SSR issues
 * 
 * Data yang dikembalikan:
 * - address: Alamat yang diformat dengan baik
 * - displayName: Nama lengkap dari API
 * - lat: Latitude koordinat
 * - lng: Longitude koordinat
 * - details: Detail alamat dari API (address components)
 * - originalQuery: Query pencarian asli (untuk manual search)
 * - isCurrentLocation: Flag untuk lokasi saat ini (untuk GPS detection)
 * 
 * Props yang diterima:
 * @param {Function} onChange - Handler yang menerima object lokasi lengkap
 * @param {string} placeholder - Placeholder text untuk input
 * @param {string} variant - Varian tampilan ("inline" | "popover")
 * @param {Object} theme - Custom theme untuk styling
 * @param {boolean} autoDetectOnLoad - Auto-detect lokasi saat mount
 * @param {...props} - Props lainnya yang diteruskan ke LocationPicker
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { LocationPicker } from "./location-picker";

/**
 * Wrapper komponen LocationPicker yang mengembalikan koordinat lengkap
 * dengan geocoding dan reverse geocoding capabilities
 */
export function LocationPickerWithCoordinates({ 
  onChange, 
  placeholder = "Pilih lokasi", 
  variant = "inline",
  theme,
  autoDetectOnLoad = false,
  ...props 
}) {
  // ===== STATE MANAGEMENT =====
  // State untuk menunjukkan proses geocoding sedang berlangsung
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Ref untuk menyimpan data lokasi terakhir (mencegah duplicate processing)
  const lastLocationRef = useRef(null);
  
  // Ref untuk debounce timer (mengurangi API calls)
  const debounceTimerRef = useRef(null);

  // ===== SERVER-SIDE RENDERING PROTECTION =====
  /**
   * Early return untuk server-side environment
   * Geolocation dan beberapa browser API tidak tersedia di server
   */
  if (typeof window === 'undefined') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading location picker...</span>
      </div>
    );
  }

  // ===== MAIN LOCATION HANDLER =====
  /**
   * Handler utama untuk perubahan lokasi dari LocationPicker
   * Mengkonversi nama lokasi menjadi koordinat menggunakan Nominatim API
   * 
   * @param {string} selectedLocation - Nama lokasi yang dipilih user
   */
  const handleLocationChange = async (selectedLocation) => {
    // Validasi input harus berupa string yang valid
    if (!selectedLocation || typeof selectedLocation !== 'string') {
      return;
    }

    // Clear debounce timer yang sedang berjalan
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cek apakah ini adalah hasil dari getCurrentLocation yang sudah diproses
    // Untuk mencegah double processing
    if (lastLocationRef.current && lastLocationRef.current.address === selectedLocation) {
      if (onChange) {
        onChange(lastLocationRef.current);
      }
      return;
    }

    // Debounce 1.5 detik untuk menghindari rate limit dari API
    debounceTimerRef.current = setTimeout(async () => {
      setIsProcessing(true);
      
      try {
        // Fetch koordinat dari Nominatim API dengan detail lengkap
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(selectedLocation)}&format=json&addressdetails=1&limit=5&extratags=1`
        );
        const data = await response.json();
      
      if (data && data.length > 0) {
        // Ambil hasil terbaik (yang pertama) dan format alamat yang lebih lengkap
        const place = data[0];
        const address = place.address;
        
        // Buat alamat yang lebih lengkap dan akurat
        let formattedAddress = place.display_name;
        
        // Jika ada detail alamat, buat format yang lebih readable
        if (address) {
          const addressParts = [];
          
          // ===== FORMATTING ALAMAT DENGAN PRIORITAS =====
          // Prioritaskan komponen alamat yang penting
          if (address.house_number && address.road) {
            addressParts.push(`${address.house_number} ${address.road}`);
          } else if (address.road) {
            addressParts.push(address.road);
          } else if (address.hamlet || address.neighbourhood) {
            addressParts.push(address.hamlet || address.neighbourhood);
          }
          
          if (address.suburb || address.quarter) {
            addressParts.push(address.suburb || address.quarter);
          }
          
          if (address.village || address.town || address.city_district) {
            addressParts.push(address.village || address.town || address.city_district);
          }
          
          if (address.city || address.county) {
            addressParts.push(address.city || address.county);
          }
          
          if (address.state) {
            addressParts.push(address.state);
          }
          
          if (address.country) {
            addressParts.push(address.country);
          }
          
          // Gabungkan bagian alamat yang ada
          if (addressParts.length > 0) {
            formattedAddress = addressParts.join(', ');
          }
        }
        
        // Buat object data lokasi lengkap
        const locationData = {
          address: formattedAddress,
          displayName: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
          details: place.address,
          originalQuery: selectedLocation
        };
        
        lastLocationRef.current = locationData;
        
        // Panggil onChange callback dengan data lengkap
        if (onChange) {
          onChange(locationData);
        }
        } else {
          console.warn("No coordinates found for location:", selectedLocation);
          // Fallback untuk lokasi yang tidak ditemukan
          if (onChange) {
            onChange({ address: selectedLocation, lat: null, lng: null });
          }
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error);
        // Error handling dengan informasi error
        if (onChange) {
          onChange({ address: selectedLocation, lat: null, lng: null, error: error.message });
        }
      } finally {
        setIsProcessing(false);
      }
    }, 1500); // Debounce 1.5 detik untuk menghindari rate limiting
  };

  // ===== CLEANUP EFFECT =====
  /**
   * Effect untuk cleanup debounce timer saat komponen unmount
   * Mencegah memory leaks dan unwanted API calls
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ===== GEOLOCATION API OVERRIDE =====
  /**
   * Custom hook untuk menangkap hasil geolocation dari LocationPicker
   * Override navigator.geolocation.getCurrentPosition untuk menangkap koordinat
   * dan melakukan reverse geocoding secara otomatis
   */
  useEffect(() => {
    // Validasi browser environment dan API availability
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    let originalGetCurrentPosition = null;
    
    try {
      // Simpan referensi ke fungsi asli
      originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      
      // Override dengan fungsi custom yang menambahkan reverse geocoding
      navigator.geolocation.getCurrentPosition = function(successCallback, errorCallback, options) {
        const wrappedSuccessCallback = async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding untuk mendapatkan alamat dari koordinat
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&extratags=1&zoom=18`
            );
            const data = await response.json();
            
            // Format alamat yang lebih lengkap dan akurat untuk current location
            let formattedAddress = data.display_name;
            const address = data.address;
            
            if (address) {
              const addressParts = [];
              
              // ===== FORMATTING ALAMAT UNTUK CURRENT LOCATION =====
              // Prioritaskan komponen alamat yang penting untuk lokasi saat ini
              if (address.house_number && address.road) {
                addressParts.push(`${address.house_number} ${address.road}`);
              } else if (address.road) {
                addressParts.push(address.road);
              } else if (address.hamlet || address.neighbourhood) {
                addressParts.push(address.hamlet || address.neighbourhood);
              }
              
              if (address.suburb || address.quarter) {
                addressParts.push(address.suburb || address.quarter);
              }
              
              if (address.village || address.town || address.city_district) {
                addressParts.push(address.village || address.town || address.city_district);
              }
              
              if (address.city || address.county) {
                addressParts.push(address.city || address.county);
              }
              
              if (address.state) {
                addressParts.push(address.state);
              }
              
              if (address.country) {
                addressParts.push(address.country);
              }
              
              // Gabungkan bagian alamat yang ada
              if (addressParts.length > 0) {
                formattedAddress = addressParts.join(', ');
              }
            }
            
            // Buat data lokasi lengkap dengan flag isCurrentLocation
            const locationData = {
              address: formattedAddress,
              displayName: data.display_name,
              lat: latitude,
              lng: longitude,
              details: data.address,
              isCurrentLocation: true // Flag untuk menandai lokasi saat ini
            };
            
            lastLocationRef.current = locationData;
            
            // Panggil callback asli untuk LocationPicker (agar tetap berfungsi normal)
            successCallback(position);
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            // Fallback dengan koordinat saja jika reverse geocoding gagal
            const locationData = {
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              lat: latitude,
              lng: longitude,
              isCurrentLocation: true
            };
            
            lastLocationRef.current = locationData;
            successCallback(position);
          }
        };
        
        // Panggil fungsi asli dengan wrapped callback
        originalGetCurrentPosition.call(this, wrappedSuccessCallback, errorCallback, options);
      };
    } catch (error) {
      console.error("Error setting up geolocation override:", error);
    }
    
    // ===== CLEANUP FUNCTION =====
    /**
     * Cleanup function untuk mengembalikan fungsi geolocation asli
     * Mencegah side effects dan memory leaks
     */
    return () => {
      if (originalGetCurrentPosition && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          navigator.geolocation.getCurrentPosition = originalGetCurrentPosition;
        } catch (error) {
          console.error("Error restoring geolocation:", error);
        }
      }
    };
  }, []);

  // ===== RENDER =====
  /**
   * Render LocationPicker dengan semua props yang diteruskan
   * dan handler custom untuk menangani perubahan lokasi dengan koordinat
   */
  return (
    <LocationPicker
      variant={variant}
      placeholder={placeholder}
      onChange={handleLocationChange}
      theme={theme}
      autoDetectOnLoad={autoDetectOnLoad}
      {...props}
    />
  );
}

export default LocationPickerWithCoordinates;
