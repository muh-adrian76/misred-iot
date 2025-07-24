import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Component to fit bounds when devices change
function FitBounds({ devices }) {
  const map = useMap();
  
  useEffect(() => {
    if (devices.length > 0) {
      const validDevices = devices.filter(d => d.latitude && d.longitude);
      if (validDevices.length > 0) {
        const bounds = L.latLngBounds(
          validDevices.map(device => [device.latitude, device.longitude])
        );
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [devices, map]);
  
  return null;
}

// Custom marker icons
const createDeviceIcon = (status) => {
  const color = status === 'online' ? '#10b981' : '#ef4444'; // green for online, red for offline
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        <circle cx="12" cy="9" r="1.5" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function MapView({ devices = [], onMarkerClick, selectedDeviceId }) {
  // Center peta ke Indonesia jika tidak ada device
  const defaultPosition = [-2.5489, 118.0149];
  // Jika ada device, center ke device pertama
  const center = devices.length > 0 && devices[0].latitude && devices[0].longitude
    ? [devices[0].latitude, devices[0].longitude]
    : defaultPosition;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <MapContainer 
        center={center} 
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds devices={devices} />
        {devices.map(device => (
          device.latitude && device.longitude ? (
            <Marker
              key={device.id}
              position={[device.latitude, device.longitude]}
              icon={createDeviceIcon(device.status)}
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
