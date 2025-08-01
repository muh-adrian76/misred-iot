/**
 * KOMPONEN LOCATION PICKER
 * 
 * LocationPicker adalah komponen untuk pencarian dan pemilihan lokasi geografis
 * menggunakan Nominatim OpenStreetMap API. Komponen ini menyediakan:
 * 
 * Fitur utama:
 * - Pencarian lokasi berdasarkan nama/alamat dengan autocomplete
 * - Deteksi lokasi otomatis menggunakan HTML5 Geolocation API
 * - Dua varian tampilan: inline dan popover
 * - Real-time suggestions dengan debouncing untuk performa optimal
 * - Responsive design dengan theming support
 * - Error handling untuk berbagai kasus geolocation
 * - Accessibility support dengan proper ARIA attributes
 * 
 * Varian tampilan:
 * - "inline": Input field langsung dengan suggestions dropdown
 * - "popover": Trigger button yang membuka popover dengan search interface
 * 
 * Props yang diterima:
 * @param {string} className - Additional CSS classes
 * @param {boolean} autoDetectOnLoad - Auto-detect lokasi saat komponen dimount
 * @param {string} defaultLocation - Lokasi default yang ditampilkan
 * @param {Function} onChange - Handler untuk perubahan lokasi terpilih
 * @param {string} variant - Varian tampilan ("inline" | "popover")
 * @param {string} placeholder - Placeholder text untuk input field
 * @param {Object} theme - Custom theme untuk styling komponen
 * 
 * API Integration:
 * - Menggunakan Nominatim OpenStreetMap untuk geocoding/reverse geocoding
 * - Debounced search untuk mengurangi API calls
 * - Rate limiting awareness dengan proper error handling
 */

"use client";
import * as React from "react"
import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, LoaderCircle, Search, MapPinned, Locate } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LocationPicker({
  className,
  autoDetectOnLoad = false,
  defaultLocation = "",
  onChange,
  variant = 'popover',
  placeholder = "Masukkan lokasi atau cari berdasarkan nama",
  theme
}) {
  // ===== STATE MANAGEMENT =====
  // State untuk menyimpan kota/lokasi yang sedang aktif terpilih
  const [activeCity, setActiveCity] = useState(defaultLocation)
  
  // State untuk loading indicator saat proses geocoding
  const [isLoading, setIsLoading] = useState(false)
  
  // State untuk input pencarian lokasi
  const [locationSearch, setLocationSearch] = useState('')
  
  // State untuk mengontrol visibility popover (hanya untuk variant popover)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  
  // State untuk menyimpan daftar suggestions dari API
  const [suggestions, setSuggestions] = useState([])
  
  // State untuk loading indicator saat fetch suggestions
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  
  // State untuk error handling
  const [error, setError] = useState(null)

  // ===== CONFIGURATION =====
  // Base URL untuk Nominatim OpenStreetMap API
  const API_URL = "https://nominatim.openstreetmap.org"

  /**
   * KONFIGURASI THEME DEFAULT
   * Object yang berisi semua class CSS default untuk styling komponen
   * Dapat di-override melalui props theme untuk customization
   */
  const defaultTheme = {
    container: "space-y-4",
    input: "border-border focus:border-primary focus:ring-primary/20 bg-background text-foreground",
    searchButton: "rounded-md h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground",
    locateButton: "rounded-md h-10 w-10 p-0 bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    suggestionsContainer: "w-full bg-background rounded-md border border-border shadow-lg max-h-60 overflow-y-auto",
    suggestionItem: "px-4 py-2 hover:bg-muted cursor-pointer border-b border-border last:border-0 transition-colors",
    suggestionLocation: "text-sm font-medium text-foreground",
    suggestionAddress: "text-xs text-muted-foreground truncate max-w-[250px]",
    suggestionIcon: "text-primary",
    errorContainer: "w-full bg-destructive/10 rounded-md border border-destructive/20 p-3 text-center",
    loadingContainer: "w-full bg-background rounded-md border border-border shadow-md p-4 text-center",
    popoverContent: "w-80 p-0 shadow-lg dark:bg-background",
    popoverTrigger: "flex items-center gap-2 text-muted-foreground hover:text-foreground border-b border-transparent hover:border-primary cursor-pointer px-3 py-2 transition-colors"
  }

  // Merge theme default dengan custom theme yang diberikan melalui props
  const appliedTheme = { ...defaultTheme, ...theme }

  // ===== API FUNCTIONS =====
  /**
   * Fungsi untuk reverse geocoding - mengkonversi koordinat lat/lng menjadi alamat
   * Digunakan ketika user menggunakan fitur "Use Current Location"
   * 
   * @param {number} lat - Latitude koordinat
   * @param {number} long - Longitude koordinat
   */
  const getLocation = async (lat, long) => {
    setIsLoading(true)
    try {
      // Call reverse geocoding API dengan format JSON
      const res = await fetch(`${API_URL}/reverse?lat=${lat}&lon=${long}&format=json`)
      const data = await res.json()
      
      // Extract nama kota/lokasi dari response API dengan prioritas tertentu
      const city = data.address?.county || data.address?.city || data.address?.state || ''

      if (city) {
        setActiveCity(city)
      }
    } catch (error) {
      console.log("Error fetching location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fungsi untuk pencarian lokasi berdasarkan query text
   * Menggunakan Nominatim search API untuk mendapatkan koordinat dan detail lokasi
   */
  const searchLocation = async () => {
    // Validasi input tidak boleh kosong
    if (!locationSearch.trim()) return

    setIsLoading(true)
    try {
      // Call search API dengan addressdetails untuk mendapatkan informasi lengkap
      const res = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(locationSearch)}&format=json&addressdetails=1`
      )
      const data = await res.json()

      // Jika ada hasil pencarian, ambil yang pertama (paling relevan)
      if (data && data.length > 0) {
        const place = data[0]
        // Extract nama kota dengan prioritas city > county > state
        const city = place.address?.city || place.address?.county || place.address?.state || ''

        setActiveCity(city)
        setLocationSearch('') // Clear input setelah berhasil
        setSuggestions([]) // Clear suggestions
        setIsPopoverOpen(false) // Close popover jika sedang terbuka
      } else {
        console.log("No location found")
      }
    } catch (error) {
      console.log("Error searching location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fungsi untuk mendapatkan lokasi saat ini menggunakan HTML5 Geolocation API
   * Menghandle berbagai error cases dan memberikan feedback yang jelas kepada user
   */
  const getCurrentLocation = useCallback(() => {
    // Validasi browser environment - geolocation hanya tersedia di browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      setError("Geolocation is only available in browser environment")
      return
    }

    setIsLoading(true)
    setError(null) // Clear previous errors

    // Check browser support untuk geolocation
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser")
      setIsLoading(false)
      return
    }

    // Request current position dengan proper error handling
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords
      // Call reverse geocoding untuk mengkonversi koordinat ke alamat
      getLocation(latitude, longitude)
    }, (error) => {
      // Handle berbagai tipe error dengan pesan yang user-friendly
      let errorMessage = "Unable to retrieve location"
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user"
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable"
          break
        case error.TIMEOUT:
          errorMessage = "Location request timed out"
          break
      }
      setError(errorMessage)
      setIsLoading(false)
    }, { 
      // Options untuk getCurrentPosition
      timeout: 10000, // 10 detik timeout
      enableHighAccuracy: true // Request akurasi tinggi
    })
  }, []);

  /**
   * Fungsi untuk mengambil suggestions berdasarkan query pencarian
   * Menggunakan debouncing untuk mengurangi API calls dan rate limiting
   * 
   * @param {string} query - Query pencarian yang diinput user
   */
  const fetchSuggestions = async (query) => {
    // Validasi minimum 2 karakter untuk memulai pencarian
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      // Search API dengan limit 5 hasil untuk performa optimal
      const res = await fetch(
        `${API_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (error) {
      console.log("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  /**
   * Handler untuk memilih salah satu suggestion dari dropdown
   * Mengupdate active city dan menutup suggestions/popover
   * 
   * @param {Object} suggestion - Data lokasi yang dipilih dari API
   */
  const selectSuggestion = (suggestion) => {
    // Extract nama kota dari suggestion dengan prioritas tertentu
    const city = suggestion.address?.city || suggestion.address?.county || suggestion.address?.state || '';
    setActiveCity(city);
    setLocationSearch(""); // Clear search input
    setSuggestions([]); // Clear suggestions dropdown
    setIsPopoverOpen(false); // Close popover
  };

  /**
   * Utility function untuk memformat nama lokasi yang ditampilkan di suggestions
   * Membuat format yang lebih readable dengan menggabungkan nama utama dan region
   * 
   * @param {Object} suggestion - Data lokasi dari API
   * @returns {string} - Formatted location name
   */
  const formatLocationName = (suggestion) => {
    const mainName = suggestion.address?.city || suggestion.address?.county || suggestion.address?.state || '';
    const region = suggestion.address?.state || suggestion.address?.country || '';

    // Jika main name dan region berbeda, gabungkan keduanya
    if (mainName && region && mainName !== region) {
      return `${mainName}, ${region}`;
    }
    // Fallback ke bagian pertama dari display_name
    return mainName || suggestion.display_name.split(',')[0];
  };


  // ===== EFFECTS & LIFECYCLE =====
  /**
   * Effect untuk debounced search suggestions
   * Menunggu 300ms setelah user berhenti mengetik sebelum melakukan API call
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(locationSearch);
    }, 300); // Debounce 300ms untuk performa optimal

    return () => {
      clearTimeout(handler);
    };
  }, [locationSearch]);

  /**
   * Effect untuk clear suggestions ketika popover ditutup
   * Mencegah suggestions tetap muncul setelah popover tidak aktif
   */
  useEffect(() => {
    if (!isPopoverOpen) {
      setSuggestions([]);
    }
  }, [isPopoverOpen]);

  /**
   * Effect untuk auto-detect lokasi saat komponen pertama kali dimount
   * Hanya berjalan jika autoDetectOnLoad=true dan belum ada activeCity
   */
  useEffect(() => {
    // Validasi browser environment dan kondisi auto-detect
    if (autoDetectOnLoad && !activeCity && typeof window !== 'undefined') {
      getCurrentLocation();
    }
  }, [autoDetectOnLoad, activeCity, getCurrentLocation]);

  /**
   * Effect untuk memanggil onChange callback ketika activeCity berubah
   * Memungkinkan parent component untuk bereaksi terhadap perubahan lokasi
   */
  useEffect(() => {
    if (onChange && activeCity) {
      onChange(activeCity);
    }
  }, [activeCity, onChange]);

  // ===== RENDER LOGIC =====
  /**
   * VARIANT INLINE - Render mode untuk integrasi langsung dalam form
   * Menampilkan input field langsung dengan suggestions dropdown di bawahnya
   */
  if (variant === 'inline') {
    return (
      <div className={cn(appliedTheme.container, className)}>
        <div className="space-y-3">
          {/* Input dan tombol controls */}
          <div className="flex items-center gap-2">
            {/* Input field utama untuk pencarian lokasi */}
            <div className="relative flex-1">
              <Input
                placeholder={placeholder}
                value={activeCity || locationSearch}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocationSearch(value);
                  // Clear activeCity jika user mengubah input yang sudah terpilih
                  if (activeCity && value !== activeCity) {
                    setActiveCity('');
                  }
                }}
                noInfo
                onKeyUp={(e) => e.key === 'Enter' && suggestions.length === 0 && searchLocation()}
                aria-label="Search for location"
                aria-describedby={suggestions.length > 0 ? "suggestions-list" : undefined}
                className={appliedTheme.input} />
            </div>

            {/* Tombol untuk search manual */}
            <Button
              className={appliedTheme.searchButton}
              variant="outline"
              onClick={searchLocation}
              disabled={isLoading || !locationSearch.trim()}
              title="Search Location">
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            {/* Tombol untuk detect lokasi saat ini */}
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              className={appliedTheme.locateButton}
              title="Use Current Location">
              <Locate className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggestions dropdown dengan proper accessibility */}
          {suggestions.length > 0 && (
            <div
              id="suggestions-list"
              role="listbox"
              aria-label="Location suggestions"
              className={appliedTheme.suggestionsContainer}>
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  className={appliedTheme.suggestionItem}
                  onClick={() => selectSuggestion(suggestion)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectSuggestion(suggestion)
                    }
                  }}>
                  <div className="flex items-start">
                    <MapPinned
                      size={16}
                      className={cn("mt-0.5 mr-2 shrink-0", appliedTheme.suggestionIcon)} />
                    <div>
                      <p className={appliedTheme.suggestionLocation}>
                        {formatLocationName(suggestion)}
                      </p>
                      <p className={appliedTheme.suggestionAddress}>
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading state untuk suggestions */}
          {isFetchingSuggestions && locationSearch.length >= 2 && suggestions.length === 0 && (
            <div className={appliedTheme.loadingContainer}>
              <LoaderCircle
                size={20}
                className={cn("animate-spin mx-auto", appliedTheme.suggestionIcon)} />
              <p className="text-sm text-muted-foreground mt-1">Searching locations...</p>
            </div>
          )}

          {/* Empty state ketika tidak ada hasil pencarian */}
          {locationSearch.length >= 2 && !isFetchingSuggestions && suggestions.length === 0 && (
            <div className={appliedTheme.loadingContainer}>
              <p className="text-sm text-muted-foreground">No locations found for &quot;{locationSearch}&quot;</p>
            </div>
          )}

          {/* Error state untuk menampilkan pesan error */}
          {error && (
            <div className={appliedTheme.errorContainer}>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /**
   * VARIANT POPOVER - Render mode untuk trigger button dengan popover
   * Menggunakan Popover component untuk interface yang compact
   */
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      {/* Trigger button yang menampilkan lokasi terpilih */}
      <PopoverTrigger asChild>
        <div className={cn(appliedTheme.popoverTrigger, className)}>
          <MapPin size={16} className={cn("text-primary", appliedTheme.suggestionIcon)} />
          {isLoading ? (
            <div className="flex items-center gap-1">
              <LoaderCircle size={14} className="animate-spin" />
              <span className="text-sm">Locating...</span>
            </div>
          ) : (
            <span className="text-sm font-medium">
              {/* Truncate nama lokasi jika terlalu panjang */}
              {activeCity.length > 15 ? activeCity.slice(0, 15) + '...' : activeCity || 'Pilih Lokasi'}
            </span>
          )}
        </div>
      </PopoverTrigger>
      
      {/* Popover content dengan search interface lengkap */}
      <PopoverContent
        className={appliedTheme.popoverContent}
        side="bottom"
        align="start"
        sideOffset={4}>
        <div className="p-4">
          {/* Input dan controls dalam popover */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder={placeholder}
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyUp={(e) => e.key === 'Enter' && suggestions.length === 0 && searchLocation()}
                aria-label="Search for location"
                noInfo
                aria-describedby={suggestions.length > 0 ? "suggestions-list" : undefined}
                className={appliedTheme.input} />
            </div>

            <Button
              className={appliedTheme.searchButton}
              variant="outline"
              onClick={searchLocation}
              disabled={isLoading || !locationSearch.trim()}
              title="Search Location">
              {isLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              onClick={getCurrentLocation}
              className={appliedTheme.locateButton}
              title="Use Current Location">
              <Locate className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggestions dalam popover dengan z-index tinggi */}
          {suggestions.length > 0 && (
            <div className={cn("z-50 mt-1 mb-4", appliedTheme.suggestionsContainer)}>
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className={appliedTheme.suggestionItem}
                  onClick={() => selectSuggestion(suggestion)}>
                  <div className="flex items-start">
                    <MapPinned
                      size={16}
                      className={cn("mt-0.5 mr-2 shrink-0", appliedTheme.suggestionIcon)} />
                    <div>
                      <p className={appliedTheme.suggestionLocation}>
                        {formatLocationName(suggestion)}
                      </p>
                      <p className={appliedTheme.suggestionAddress}>
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading state dalam popover */}
          {isFetchingSuggestions && locationSearch.length >= 2 && suggestions.length === 0 && (
            <div className={cn("z-50 mt-1 mb-4", appliedTheme.loadingContainer)}>
              <LoaderCircle
                size={20}
                className={cn("animate-spin mx-auto", appliedTheme.suggestionIcon)} />
              <p className="text-sm text-muted-foreground mt-1">Searching locations...</p>
            </div>
          )}

          {/* Empty state dalam popover */}
          {locationSearch.length >= 2 && !isFetchingSuggestions && suggestions.length === 0 && (
            <div className={appliedTheme.loadingContainer}>
              <p className="text-sm text-muted-foreground">No locations found for &quot;{locationSearch}&quot;</p>
            </div>
          )}

          {/* Error state dalam popover */}
          {error && (
            <div className={appliedTheme.errorContainer}>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}