import { 
  MapPin, 
  Layers, 
  Filter, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Thermometer,
  Droplets,
  Beaker,
  X
} from "lucide-react";

// Device status icon
function DeviceStatusIcon({ status, type }) {
  const getTypeIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'humidity':
        return <Droplets className="w-4 h-4" />;
      case 'water_quality':
        return <Beaker className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className={`p-2 rounded-full ${
      status === 'online' 
        ? 'bg-green-100 text-green-600' 
        : 'bg-red-100 text-red-600'
    }`}>
      {getTypeIcon()}
    </div>
  );
}

// Device Info Panel
function DeviceInfoPanel({ device, onClose }) {
  if (!device) return null;

  return (
    <div className="absolute top-4 right-4 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Device Information
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <DeviceStatusIcon status={device.status} type={device.type} />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{device.name}</h4>
            <div className="flex items-center gap-2">
              {device.status === 'online' ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm capitalize ${
                device.status === 'online' ? 'text-green-600' : 'text-red-600'
              }`}>
                {device.status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Owner</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{device.owner}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{device.location.address}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Seen</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{device.lastSeen}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Coordinates</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {device.location.lat.toFixed(6)}, {device.location.lng.toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminMapsContent({ 
  devices, 
  loading, 
  selectedDevice,
  mapView,
  filterStatus,
  setMapView,
  setFilterStatus,
  selectDevice,
  clearSelection,
  fetchDevices
}) {
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-gray-300 rounded-xl h-96 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Peta Lokasi Device
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor lokasi dan status semua perangkat IoT
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Map View Selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View:</span>
            <select
              value={mapView}
              onChange={(e) => setMapView(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="satellite">Satellite</option>
              <option value="street">Street</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Semua</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Device Count */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {devices.length} device{devices.length !== 1 ? 's' : ''} ditemukan
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Map Placeholder - You can integrate with Google Maps or other map services */}
        <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center relative">
          {/* Map would go here */}
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
              Interactive Map
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Integrasi dengan Google Maps atau layanan peta lainnya
            </p>
          </div>

          {/* Sample Device Markers */}
          <div className="absolute inset-0">
            {devices.map((device, index) => (
              <button
                key={device.id}
                onClick={() => selectDevice(device)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
                  selectedDevice?.id === device.id ? 'scale-125 z-10' : ''
                }`}
                style={{
                  left: `${30 + index * 20}%`,
                  top: `${40 + index * 10}%`
                }}
              >
                <div className={`p-2 rounded-full shadow-lg border-2 ${
                  device.status === 'online'
                    ? 'bg-green-500 border-green-600 text-white'
                    : 'bg-red-500 border-red-600 text-white'
                }`}>
                  <MapPin className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Device Info Panel */}
          <DeviceInfoPanel 
            device={selectedDevice} 
            onClose={clearSelection}
          />
        </div>
      </div>

      {/* Device List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daftar Device
          </h3>
        </div>
        
        <div className="p-6">
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Tidak ada device
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filterStatus === 'all' 
                  ? 'Belum ada device yang terdaftar'
                  : `Tidak ada device dengan status ${filterStatus}`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedDevice?.id === device.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => selectDevice(device)}
                >
                  <div className="flex items-start gap-3">
                    <DeviceStatusIcon status={device.status} type={device.type} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {device.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {device.location.address}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {device.status === 'online' ? (
                          <Wifi className="w-4 h-4 text-green-600" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-xs ${
                          device.status === 'online' ? 'text-green-600' : 'text-red-600'
                        }`}>
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
      </div>
    </div>
  );
}
