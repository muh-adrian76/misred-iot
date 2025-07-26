"use client";

import { useState, useEffect, useRef } from "react";
import { LocationPicker } from "./location-picker";

// Wrapper untuk LocationPicker yang mengembalikan koordinat lengkap
export function LocationPickerWithCoordinates({ 
  onChange, 
  placeholder = "Pilih lokasi", 
  variant = "inline",
  theme,
  autoDetectOnLoad = false,
  ...props 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastLocationRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const handleLocationChange = async (selectedLocation) => {
    if (!selectedLocation || typeof selectedLocation !== 'string') {
      return;
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cek apakah ini adalah hasil dari getCurrentLocation yang sudah diproses
    if (lastLocationRef.current && lastLocationRef.current.address === selectedLocation) {
      if (onChange) {
        onChange(lastLocationRef.current);
      }
      return;
    }

    // Debounce untuk menghindari rate limit (1.5 detik)
    debounceTimerRef.current = setTimeout(async () => {
      setIsProcessing(true);
      
      try {
        // Fetch koordinat dari Nominatim API untuk pencarian manual dengan detail lebih lengkap
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
        
        const locationData = {
          address: formattedAddress,
          displayName: place.display_name,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon),
          details: place.address,
          originalQuery: selectedLocation
        };
        
        lastLocationRef.current = locationData;
        
        if (onChange) {
          onChange(locationData);
        }
        } else {
          console.warn("No coordinates found for location:", selectedLocation);
          if (onChange) {
            onChange({ address: selectedLocation, lat: null, lng: null });
          }
        }
      } catch (error) {
        console.error("Error fetching coordinates:", error);
        if (onChange) {
          onChange({ address: selectedLocation, lat: null, lng: null, error: error.message });
        }
      } finally {
        setIsProcessing(false);
      }
    }, 1500); // Debounce 1.5 detik
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Custom hook untuk menangkap geolocation dari LocationPicker
  useEffect(() => {
    // Override navigator.geolocation untuk menangkap hasil getCurrentPosition
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      
      navigator.geolocation.getCurrentPosition = function(successCallback, errorCallback, options) {
        const wrappedSuccessCallback = async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding untuk mendapatkan alamat yang lebih lengkap
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&extratags=1&zoom=18`
            );
            const data = await response.json();
            
            // Format alamat yang lebih lengkap dan akurat
            let formattedAddress = data.display_name;
            const address = data.address;
            
            if (address) {
              const addressParts = [];
              
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
            
            const locationData = {
              address: formattedAddress,
              displayName: data.display_name,
              lat: latitude,
              lng: longitude,
              details: data.address,
              isCurrentLocation: true
            };
            
            lastLocationRef.current = locationData;
            
            // Panggil callback asli untuk LocationPicker
            successCallback(position);
          } catch (error) {
            console.error("Error reverse geocoding:", error);
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
        
        originalGetCurrentPosition.call(this, wrappedSuccessCallback, errorCallback, options);
      };
      
      // Cleanup function untuk mengembalikan fungsi asli
      return () => {
        navigator.geolocation.getCurrentPosition = originalGetCurrentPosition;
      };
    }
  }, []);

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
