/**
 * KOMPONEN MAP VIEW
 * 
 * MapView adalah komponen utama untuk menampilkan peta interaktif dengan marker device IoT.
 * Komponen ini menggunakan React Leaflet untuk rendering peta dan menyediakan:
 * 
 * Fitur utama:
 * - Multiple map layers (street, satellite, hybrid) dengan dynamic switching
 * - Interactive device markers dengan status visual (online/offline)
 * - Auto-fit bounds untuk menampilkan semua device dalam viewport
 * - Zoom to selected device dengan smooth animation
 * - Click handlers untuk marker interaction
 * - Responsive design dengan proper z-index management
 * - Custom marker icons dengan status-based styling
 * 
 * Map Layers:
 * - Street: OpenStreetMap standard tiles
 * - Satellite: Esri World Imagery tiles
 * - Hybrid: Satellite + labels overlay
 * 
 * Device Markers:
 * - Green markers untuk device online
 * - Red markers untuk device offline
 * - Selected device memiliki ukuran lebih besar dan border biru
 * - Popup dengan informasi device lengkap
 * 
 * Props yang diterima:
 * @param {Array} devices - Array device dengan koordinat lat/lng
 * @param {Function} onMarkerClick - Handler untuk click pada marker
 * @param {string} selectedDeviceId - ID device yang sedang dipilih
 * @param {Object} selectedDevice - Data device yang sedang dipilih
 * @param {string} mapView - Tipe tampilan peta ("street"|"satellite"|"hybrid")
 * @param {boolean} shouldFitAllDevices - Flag untuk auto-fit semua device
 */

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

/**
 * KOMPONEN FIT BOUNDS
 * 
 * FitBounds adalah utility component yang mengatur viewport peta untuk menampilkan
 * semua device dalam bounds yang optimal. Komponen ini:
 * 
 * - Menghitung bounds berdasarkan koordinat semua device
 * - Menggunakan animasi smooth untuk transisi viewport
 * - Menambahkan padding untuk visual yang lebih baik
 * - Hanya memproses device dengan koordinat valid
 * 
 * @param {Array} devices - Array device dengan koordinat
 * @param {boolean} shouldFit - Flag untuk trigger fit bounds
 */
function FitBounds({ devices, shouldFit }) {
  // Get map instance dari React Leaflet context
  const map = useMap();
  
  useEffect(() => {
    // Trigger fit bounds jika ada device dan shouldFit aktif
    if ((devices.length > 0 && shouldFit) || shouldFit) {
      // Filter hanya device dengan koordinat valid
      const validDevices = devices.filter(d => d.latitude && d.longitude);
      
      if (validDevices.length > 0) {
        // Buat bounds dari semua koordinat device
        const bounds = L.latLngBounds(
          validDevices.map(device => [device.latitude, device.longitude])
        );
        
        // Fit map ke bounds dengan animasi dan padding
        map.fitBounds(bounds, { 
          padding: [20, 20], // Padding untuk visual yang lebih baik
          animate: true, // Animasi smooth
          duration: 1.0 // Durasi animasi 1 detik
        });
      }
    }
  }, [devices, map, shouldFit]);
  
  return null;
}

/**
 * KOMPONEN ZOOM TO DEVICE
 * 
 * ZoomToDevice adalah utility component yang mengatur zoom peta ke device tertentu.
 * Digunakan ketika user memilih device dari list atau search. Fitur:
 * 
 * - Zoom ke koordinat device dengan level yang optimal
 * - Animasi smooth untuk transisi yang halus
 * - Hanya aktif jika device memiliki koordinat valid
 * - Zoom level 15 untuk detail yang cukup
 * 
 * @param {Object} selectedDevice - Device yang dipilih untuk di-zoom
 */
function ZoomToDevice({ selectedDevice }) {
  // Get map instance dari React Leaflet context
  const map = useMap();
  
  useEffect(() => {
    // Zoom ke device jika memiliki koordinat valid
    if (selectedDevice && selectedDevice.latitude && selectedDevice.longitude) {
      // Set view ke koordinat device dengan animasi smooth
      map.setView(
        [selectedDevice.latitude, selectedDevice.longitude], 
        15, // Zoom level yang lebih dekat untuk detail device
        {
          animate: true, // Enable animasi transisi
          duration: 1.0, // Durasi animasi 1 detik
        }
      );
    }
  }, [selectedDevice, map]);
  
  return null;
}

/**
 * KOMPONEN DYNAMIC TILE LAYER
 * 
 * DynamicTileLayer mengelola berbagai jenis tile layer untuk peta berdasarkan
 * pilihan view mode dari user. Mendukung tiga jenis tampilan:
 * 
 * - Street: OpenStreetMap standard untuk tampilan jalan dan nama tempat
 * - Satellite: Esri World Imagery untuk tampilan satelit berkualitas tinggi  
 * - Hybrid: Kombinasi satelit + label untuk informasi lengkap
 * 
 * Setiap layer memiliki attribution yang proper sesuai dengan provider
 * dan menggunakan key yang unik untuk optimal re-rendering
 * 
 * @param {string} mapView - Tipe tampilan ("street"|"satellite"|"hybrid")
 */
function DynamicTileLayer({ mapView }) {
  /**
   * Function untuk mendapatkan tile layer berdasarkan mapView
   * Menggunakan conditional rendering untuk performa optimal
   */
  const getTileLayer = () => {
    switch (mapView) {
      case 'satellite':
        // Esri World Imagery untuk tampilan satelit berkualitas tinggi
        return (
          <TileLayer
            key="satellite"
            attribution="&copy; <a href='https://www.esri.com/'>Esri</a>"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        );
      case 'hybrid':
        // Kombinasi satelit + labels untuk informasi komprehensif
        return (
          <>
            <TileLayer
              key="hybrid-satellite"
              attribution="&copy; <a href='https://www.esri.com/'>Esri</a>"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
            <TileLayer
              key="hybrid-labels"
              attribution="&copy; <a href='https://www.esri.com/'>Esri</a>"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            />
          </>
        );
      case 'street':
      default:
        // OpenStreetMap sebagai default - gratis dan reliable
        return (
          <TileLayer
            key="street"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        );
    }
  };

  return getTileLayer();
}

/**
 * FACTORY FUNCTION UNTUK CUSTOM MARKER ICONS
 * 
 * createDeviceIcon membuat custom icon untuk marker device berdasarkan status
 * dan state selection. Icon dibuat menggunakan SVG yang di-encode ke base64
 * untuk performa yang optimal.
 * 
 * Fitur icon:
 * - Warna berdasarkan status: hijau (online), merah (offline)
 * - Ukuran lebih besar untuk device yang dipilih
 * - Border biru untuk device yang sedang dipilih
 * - Inner circle putih untuk kontras yang baik
 * - SVG-based untuk scalability dan kualitas
 * 
 * @param {string} status - Status device ("online"|"offline")
 * @param {boolean} isSelected - Apakah device sedang dipilih
 * @returns {L.Icon} - Leaflet icon object yang siap digunakan
 */
const createDeviceIcon = (status, isSelected = false) => {
  // Tentukan warna berdasarkan status device
  const color = status === 'online' ? '#10b981' : '#ef4444'; // hijau untuk online, merah untuk offline
  
  // Ukuran icon lebih besar untuk device yang dipilih
  const size = isSelected ? 40 : 32;
  
  // Border styling untuk device yang dipilih
  const strokeColor = isSelected ? '#3b82f6' : 'white'; // Border biru untuk yang dipilih
  const strokeWidth = isSelected ? 3 : 1;
  
  // Buat Leaflet Icon dengan SVG custom
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <circle cx="12" cy="9" r="1.5" fill="white"/>
      </svg>
    `)}`,
    iconSize: [size, size], // Ukuran icon
    iconAnchor: [size/2, size], // Anchor point untuk positioning yang tepat
    popupAnchor: [0, -size], // Posisi popup relatif terhadap icon
  });
};

/**
 * KOMPONEN UTAMA MAP VIEW
 * 
 * MapView adalah komponen utama yang merender peta interaktif dengan semua
 * device IoT sebagai marker. Komponen ini mengintegrasikan semua sub-komponen
 * dan mengelola state serta interactions.
 */
export default function MapView({ 
  devices = [], 
  onMarkerClick, 
  selectedDeviceId, 
  selectedDevice, 
  mapView = 'street',
  shouldFitAllDevices = false
}) {
  // ===== MAP CONFIGURATION =====
  // Default center ke Indonesia jika tidak ada device
  const defaultPosition = [-2.5489, 118.0149]; // Koordinat tengah Indonesia
  
  // Jika ada device dengan koordinat valid, center ke device pertama
  const center = devices.length > 0 && devices[0].latitude && devices[0].longitude
    ? [devices[0].latitude, devices[0].longitude]
    : defaultPosition;

  // ===== RENDER MAP =====
  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative z-0">
      {/* MapContainer adalah wrapper utama untuk peta Leaflet */}
      <MapContainer 
        center={center} 
        zoom={5} // Initial zoom level untuk tampilan Indonesia
        scrollWheelZoom={true} // Enable zoom dengan mouse wheel
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        className="z-[1]" // Z-index management untuk layering yang proper
      >
        {/* Dynamic tile layer berdasarkan mapView selection */}
        <DynamicTileLayer mapView={mapView} />
        
        {/* Utility component untuk auto-fit bounds */}
        <FitBounds devices={devices} shouldFit={shouldFitAllDevices} />
        
        {/* Utility component untuk zoom ke selected device */}
        <ZoomToDevice selectedDevice={selectedDevice} />
        
        {/* Render semua device markers */}
        {devices.map(device => (
          // Hanya render device yang memiliki koordinat valid
          device.latitude && device.longitude ? (
            <Marker
              key={device.id}
              position={[device.latitude, device.longitude]}
              icon={createDeviceIcon(device.status, device.id === selectedDeviceId)}
              eventHandlers={{
                click: () => {
                  // Handler untuk marker click - delegate ke parent component
                  if (onMarkerClick) {
                    onMarkerClick(device);
                  }
                }
              }}
            >
              {/* Popup dengan informasi device ketika marker diklik */}
              <Popup>
                <div className="text-sm">
                  <strong>{device.description}</strong><br />
                  Status: <span className={device.status === 'online' ? 'text-green-600' : 'text-red-600'}>
                    {device.status === 'online' ? 'online' : 'offline'}
                  </span><br />
                  {/* Alamat jika tersedia */}
                  {device.address && <span>Alamat: {device.address}<br /></span>}
                  {/* Koordinat untuk referensi */}
                  <span>Lat: {device.latitude}, Lng: {device.longitude}</span>
                </div>
              </Popup>
            </Marker>
          ) : null // Skip device tanpa koordinat
        ))}
      </MapContainer>
    </div>
  );
}
