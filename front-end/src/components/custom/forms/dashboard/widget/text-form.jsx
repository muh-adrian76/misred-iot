// TextForm Component - komponen form spesifik untuk text widget dengan single sensor selection
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Activity, Thermometer, Droplets, Zap, Gauge } from "lucide-react";

const accentColorOptions = [
  { value: "blue", label: "Biru", icon: Activity },
  { value: "green", label: "Hijau", icon: Droplets },
  { value: "purple", label: "Ungu", icon: Zap },
  { value: "orange", label: "Oranye", icon: Thermometer }
];

export default function TextForm({ 
  devices = [], 
  datastreams = [], 
  selectedPairs = [], 
  onChange,
  formData = {}
}) {
  // State untuk search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // State untuk form configuration
  const [config, setConfig] = useState({
    maxValue: formData.maxValue || 100,
    precision: formData.precision || 0,
    accentColor: formData.accentColor || "blue",
    thresholds: formData.thresholds || [25, 50, 75, 100],
    ...formData
  });

  // Handler untuk memilih device-datastream pair (hanya satu untuk text widget)
  const handleSelectPair = (value) => {
    if (!value) return;

    const [deviceId, datastreamId] = value.split("|");
    const device_id = parseInt(deviceId);
    const datastream_id = parseInt(datastreamId);

    const newPairs = [{ device_id, datastream_id }];
    onChange && onChange({ selectedPairs: newPairs, config });
  };

  // Handler untuk menghapus selection
  const handleRemovePair = () => {
    onChange && onChange({ selectedPairs: [], config });
  };

  // Handler untuk mengupdate konfigurasi
  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onChange && onChange({ selectedPairs, config: newConfig });
  };

  // Handler untuk threshold changes
  const handleThresholdChange = (index, value) => {
    const newThresholds = [...config.thresholds];
    newThresholds[index] = parseInt(value) || 0;
    handleConfigChange('thresholds', newThresholds);
  };

  // Group datastreams by device
  const datastreamsByDevice = devices.map((device) => ({
    ...device,
    datastreams: datastreams.filter(
      (ds) => String(ds.device_id) === String(device.id)
    ),
  }));

  // Filter berdasarkan search query
  const filteredDatastreamsByDevice = datastreamsByDevice
    .map((device) => ({
      ...device,
      datastreams: device.datastreams.filter((ds) => {
        if (!searchQuery) return true;

        const deviceName = (device.description || device.name || "").toLowerCase();
        const datastreamName = (ds.description || "").toLowerCase();
        const pin = (ds.pin || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        return (
          deviceName.includes(query) ||
          datastreamName.includes(query) ||
          pin.includes(query)
        );
      }),
    }))
    .filter((device) => {
      if (!searchQuery) return device.datastreams.length > 0;

      const deviceName = (device.description || device.name || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      return deviceName.includes(query) || device.datastreams.length > 0;
    });

  // Get current selection value for Select component
  const currentSelection = selectedPairs.length > 0 
    ? `${selectedPairs[0].device_id}|${selectedPairs[0].datastream_id}`
    : "";

  return (
    <div className="flex flex-col gap-4">
      <Label className="text-left ml-1 font-medium">
        Device & Datastream
        <span className="text-xs text-muted-foreground ml-2">
          (Pilih satu sensor untuk Text Widget)
        </span>
      </Label>

      {/* Selected pair display */}
      {selectedPairs.length > 0 && (
        <div className="space-y-2">
          {selectedPairs.map((pair, idx) => {
            const device = devices.find((d) => d.id === pair.device_id);
            const ds = datastreams.find((d) => d.id === pair.datastream_id);
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <div>
                    <p className="text-sm font-medium">
                      {device?.description || device?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ds?.description} (Pin {ds?.pin}) • {ds?.unit}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePair}
                  className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Sensor selection */}
      <Select
        value={currentSelection}
        onValueChange={handleSelectPair}
        open={isSelectOpen}
        onOpenChange={(open) => {
          setIsSelectOpen(open);
          if (!open) {
            setSearchQuery("");
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pilih satu sensor untuk Text Widget" />
        </SelectTrigger>
        <SelectContent>
          {/* Search Input */}
          <div className="flex w-auto items-center border-b px-3 pb-2 mb-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Cari device atau datastream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-100 border-0 p-0 text-sm placeholder:text-muted-foreground focus-visible:outline-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              noInfo
            />
          </div>

          {devices.length === 0 || datastreams.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              {devices.length === 0 && datastreams.length === 0
                ? "Device dan datastream masih kosong"
                : devices.length === 0
                  ? "Device masih kosong"
                  : "Datastream masih kosong"}
            </div>
          ) : filteredDatastreamsByDevice.length === 0 ? (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk "{searchQuery}"
            </div>
          ) : (
            filteredDatastreamsByDevice.map((device) => (
              <div key={device.id}>
                {device.datastreams.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b">
                      <span className="flex items-center gap-2">
                        {device.description || device.name}
                        <span className="text-xs text-muted-foreground/70">
                          ({device.datastreams.length} datastream
                          {device.datastreams.length > 1 ? "s" : ""})
                        </span>
                      </span>
                    </div>
                    {device.datastreams.map((ds) => (
                      <SelectItem
                        key={ds.id}
                        value={`${device.id}|${ds.id}`}
                        className="pl-6"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {ds.description}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Pin {ds.pin} • {ds.unit} • {ds.type}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </div>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Configuration Options */}
      {selectedPairs.length > 0 && (
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm font-medium">Konfigurasi Widget</Label>
          
          {/* Max Value */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nilai Maksimum</Label>
            <Input
              type="number"
              value={config.maxValue}
              onChange={(e) => handleConfigChange('maxValue', parseInt(e.target.value) || 100)}
              placeholder="100"
              className="h-8"
              noInfo
            />
          </div>

          {/* Precision */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Presisi Desimal</Label>
            <Select
              value={config.precision.toString()}
              onValueChange={(value) => handleConfigChange('precision', parseInt(value))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 desimal</SelectItem>
                <SelectItem value="1">1 desimal</SelectItem>
                <SelectItem value="2">2 desimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Warna Tema</Label>
            <Select
              value={config.accentColor}
              onValueChange={(value) => handleConfigChange('accentColor', value)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accentColorOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Thresholds */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nilai Ambang Batas</Label>
            <div className="grid grid-cols-4 gap-2">
              {config.thresholds.map((threshold, index) => (
                <Input
                  key={index}
                  type="number"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(index, e.target.value)}
                  placeholder={`${(index + 1) * 25}`}
                  className="h-8 text-xs"
                  noInfo
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Nilai ambang untuk indikator progress (rendah ke tinggi)
            </p>
          </div>
        </div>
      )}

      {selectedPairs.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Text widget akan menampilkan nilai sensor dengan progress ring dan threshold indicators.
        </p>
      )}
    </div>
  );
}
