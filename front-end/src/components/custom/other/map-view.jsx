import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Component to fit bounds when devices change or triggered
function FitBounds({ devices, shouldFit }) {
  const map = useMap();
  
  useEffect(() => {
    if ((devices.length > 0 && shouldFit) || shouldFit) {
      const validDevices = devices.filter(d => d.latitude && d.longitude);
      if (validDevices.length > 0) {
        const bounds = L.latLngBounds(
          validDevices.map(device => [device.latitude, device.longitude])
        );
        map.fitBounds(bounds, { 
          padding: [20, 20],
          animate: true,
          duration: 1.0
        });
      }
    }
  }, [devices, map, shouldFit]);
  
  return null;
}

// Component to zoom to selected device
function ZoomToDevice({ selectedDevice }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedDevice && selectedDevice.latitude && selectedDevice.longitude) {
      // Zoom ke device yang dipilih dengan animasi smooth
      map.setView(
        [selectedDevice.latitude, selectedDevice.longitude], 
        15, // Zoom level yang lebih dekat
        {
          animate: true,
          duration: 1.0, // Durasi animasi 1 detik
        }
      );
    }
  }, [selectedDevice, map]);
  
  return null;
}

// Component to handle dynamic tile layer changes
function DynamicTileLayer({ mapView }) {
  const getTileLayer = () => {
    switch (mapView) {
      case 'satellite':
        return (
          <TileLayer
            key="satellite"
            attribution="&copy; <a href='https://www.esri.com/'>Esri</a>"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        );
      case 'hybrid':
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

// Custom marker icons
const createDeviceIcon = (status, isSelected = false) => {
  const color = status === 'online' ? '#10b981' : '#ef4444'; // green for online, red for offline
  const size = isSelected ? 40 : 32; // Bigger size for selected device
  const strokeColor = isSelected ? '#3b82f6' : 'white'; // Blue stroke for selected
  const strokeWidth = isSelected ? 3 : 1;
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="${size}" height="${size}">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <circle cx="12" cy="9" r="1.5" fill="white"/>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size],
  });
};

export default function MapView({ 
  devices = [], 
  onMarkerClick, 
  selectedDeviceId, 
  selectedDevice, 
  mapView = 'street',
  shouldFitAllDevices = false
}) {
  // Center peta ke Indonesia jika tidak ada device
  const defaultPosition = [-2.5489, 118.0149];
  // Jika ada device, center ke device pertama
  const center = devices.length > 0 && devices[0].latitude && devices[0].longitude
    ? [devices[0].latitude, devices[0].longitude]
    : defaultPosition;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative z-0">
      <MapContainer 
        center={center} 
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        className="z-[1]"
      >
        <DynamicTileLayer mapView={mapView} />
        <FitBounds devices={devices} shouldFit={shouldFitAllDevices} />
        <ZoomToDevice selectedDevice={selectedDevice} />
        {devices.map(device => (
          device.latitude && device.longitude ? (
            <Marker
              key={device.id}
              position={[device.latitude, device.longitude]}
              icon={createDeviceIcon(device.status, device.id === selectedDeviceId)}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(device);
                  }
                }
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{device.description}</strong><br />
                  Status: <span className={device.status === 'online' ? 'text-green-600' : 'text-red-600'}>{device.status}</span><br />
                  {device.address && <span>Alamat: {device.address}<br /></span>}
                  <span>Lat: {device.latitude}, Lng: {device.longitude}</span>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
      </MapContainer>
    </div>
  );
}
