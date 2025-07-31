"use client";
import { useState, useEffect } from "react";
import ResponsiveDialog from "../dialogs/responsive-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import CheckboxButton from "../buttons/checkbox-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileDown,
  Search,
} from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import { useUser } from "@/providers/user-provider";
import { successToast, errorToast } from "./toaster";
import { exportToCSV, formatDateTime, generateReactPDF } from "@/lib/export-utils";
import { DatastreamPDFDocument } from "@/components/custom/other/pdf-content";

export default function ExportDashboardDialog({
  open,
  setOpen,
  currentTimeRange,
  currentDataCount,
  filterType,
  exportMode = "filter", // "filter" or "all"
  isMobile,
}) {
  const { user } = useUser();
  const [devices, setDevices] = useState([]);
  const [datastreams, setDatastreams] = useState([]);
  const [selectedDatastreams, setSelectedDatastreams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportFormats, setExportFormats] = useState({
    csv: true,
    pdf: exportMode === "filter", // PDF only available for filter mode
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  // Update export formats when mode changes
  useEffect(() => {
    if (exportMode === "all") {
      setExportFormats({ csv: true, pdf: false });
    } else {
      setExportFormats({ csv: true, pdf: false });
    }
  }, [exportMode]);

  // Fetch devices and datastreams
  useEffect(() => {
    if (open && user) {
      fetchDevicesAndDatastreams();
      setSearchQuery(""); // Clear search when dialog opens
    }
  }, [open, user]);

  const fetchDevicesAndDatastreams = async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      // Fetch all datastreams (which includes device info)
      const response = await fetchFromBackend("/datastream");
      if (!response.ok) {
        throw new Error("Failed to fetch datastreams");
      }
      
      const data = await response.json();
      const datastreamList = data.result || [];
      
      // Group datastreams by device
      const deviceMap = {};
      datastreamList.forEach(datastream => {
        if (!deviceMap[datastream.device_id]) {
          deviceMap[datastream.device_id] = {
            id: datastream.device_id,
            name: datastream.device_description || `Device ${datastream.device_id}`,
            datastreams: []
          };
        }
        deviceMap[datastream.device_id].datastreams.push(datastream);
      });
      
      const deviceList = Object.values(deviceMap);
      setDevices(deviceList);
      setDatastreams(datastreamList);
      
    } catch (error) {
      console.error("Error fetching devices and datastreams:", error);
      setLoadingError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDatastreamToggle = (datastreamId, checked) => {
    if (checked) {
      setSelectedDatastreams(prev => [...prev, datastreamId]);
    } else {
      setSelectedDatastreams(prev => prev.filter(id => id !== datastreamId));
    }
  };

  const handleSelectAllDevice = (deviceId, checked) => {
    const device = filteredDevices.find(d => d.id === deviceId);
    if (!device) return;
    
    const deviceDatastreamIds = device.datastreams.map(ds => ds.id);
    
    if (checked) {
      setSelectedDatastreams(prev => [
        ...prev.filter(id => !deviceDatastreamIds.includes(id)),
        ...deviceDatastreamIds
      ]);
    } else {
      setSelectedDatastreams(prev => 
        prev.filter(id => !deviceDatastreamIds.includes(id))
      );
    }
  };

  const handleFormatToggle = (format, checked) => {
    // Prevent changing formats in "all" mode where only CSV is allowed
    if (exportMode === "all" && format === "pdf") {
      return;
    }
    
    setExportFormats(prev => ({
      ...prev,
      [format]: checked
    }));
  };

  // Generate dialog title based on export mode and filter
  const getDialogTitle = () => {
    if (exportMode === "all") {
      return "Ekspor semua data";
    } else {
      if (filterType === "time") {
        const timeRangeText = {
          "1h": "1 jam terakhir",
          "12h": "12 jam terakhir", 
          "1d": "1 hari terakhir",
          "1w": "1 minggu terakhir"
        }[currentTimeRange] || `${currentTimeRange} terakhir`;
        return `Ekspor ${timeRangeText}`;
      } else {
        return `Ekspor ${currentDataCount} data terakhir`;
      }
    }
  };

  // Filter devices and datastreams based on search query
  const filteredDevices = devices.filter(device => {
    const deviceMatches = device.name.toLowerCase().includes(searchQuery.toLowerCase());
    const datastreamMatches = device.datastreams.some(ds => 
      ds.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.pin.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return deviceMatches || datastreamMatches;
  }).map(device => ({
    ...device,
    datastreams: device.datastreams.filter(ds =>
      searchQuery === "" || 
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.pin.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }));

  const fetchDatastreamData = async (datastreamId) => {
    try {
      const datastream = datastreams.find(ds => ds.id === datastreamId);
      if (!datastream) {
        throw new Error(`Datastream ${datastreamId} not found`);
      }

      // Use the timeseries endpoint for consistent data
      const params = new URLSearchParams();
      
      // Only add filter parameters if in filter mode
      if (exportMode === "filter") {
        if (filterType === 'time' && currentTimeRange) {
          params.append('range', currentTimeRange);
        } else if (filterType === 'count' && currentDataCount) {
          params.append('count', currentDataCount.toString());
        }
      } else if (exportMode === "all") {
        // For "all" mode, explicitly request all data
        params.append('range', 'all');
      }

      const url = `/payload/timeseries/${datastream.device_id}/${datastreamId}?${params}`;

      const response = await fetchFromBackend(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data for datastream ${datastreamId}`);
      }
      
      const data = await response.json();
      const resultData = data.result || [];
      
      return {
        datastream,
        data: resultData
      };
    } catch (error) {
      console.error(`Error fetching data for datastream ${datastreamId}:`, error);
      throw error;
    }
  };

  const exportDataToCSV = async (datastreamData) => {
    const { datastream, data } = datastreamData;
    
    if (!data || data.length === 0) {
      throw new Error(`Tidak ada data untuk diekspor pada datastream: ${datastream.description}`);
    }

    const headers = [
      "Tanggal dan Waktu",
      "UID Perangkat", 
      "Deskripsi",
      "Datastream",
      "Nilai"
    ];

    // Sort data from oldest to newest
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.device_time || a.created_at);
      const dateB = new Date(b.device_time || b.created_at);
      return dateA.getTime() - dateB.getTime();
    });

    const rows = sortedData.map((item) => [
      formatDateTime(item.device_time || item.created_at),
      datastream.device_id,
      item.device_name || datastream.device_description || `Device ${datastream.device_id}`,
      datastream.description,
      item.value
    ]);

    // Add unique timestamp to prevent filename conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `datastream-${datastream.description.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}`;
    
    // Use utility function for CSV export
    exportToCSV(headers, rows, filename);
  };

  const exportToPDF = async (datastreamData) => {
    const { datastream, data } = datastreamData;
    
    if (!data || data.length === 0) {
      throw new Error(`Tidak ada data untuk diekspor pada datastream: ${datastream.description}`);
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `datastream-${datastream.description.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}`;

    // Create React PDF Document component and generate PDF
    const DocumentComponent = DatastreamPDFDocument({ datastream, data });
    await generateReactPDF(DocumentComponent, filename);
  };

  const handleExport = async () => {
    if (selectedDatastreams.length === 0) {
      errorToast("Silakan pilih minimal satu datastream untuk diekspor");
      return;
    }

    if (!exportFormats.csv && !exportFormats.pdf) {
      errorToast("Silakan pilih minimal satu format ekspor");
      return;
    }

    setIsExporting(true);

    try {
      let successCount = 0;
      let failCount = 0;
      let emptyDataCount = 0;
      const emptyDatastreams = [];
      
      // Process each datastream sequentially to avoid race conditions
      for (const datastreamId of selectedDatastreams) {
        try {
          const datastreamData = await fetchDatastreamData(datastreamId);
          
          // Export in selected formats
          if (exportFormats.csv) {
            await exportDataToCSV(datastreamData);
            // Small delay to prevent conflicts
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          if (exportFormats.pdf) {
            await exportToPDF(datastreamData);
            // Small delay for PDF generation
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          successCount++;
        } catch (error) {
          // Check if error is due to empty data
          if (error.message.includes('Tidak ada data untuk diekspor')) {
            emptyDataCount++;
            const datastream = datastreams.find(ds => ds.id === datastreamId);
            if (datastream) {
              emptyDatastreams.push(datastream.description);
            }
          } else {
            failCount++;
          }
        }
      }
      
      // Show appropriate toast messages
      if (successCount > 0) {
        let message = `Berhasil mengekspor ${successCount} datastream`;
        let description = undefined;
        
        if (emptyDataCount > 0 || failCount > 0) {
          const issues = [];
          if (emptyDataCount > 0) {
            issues.push(`${emptyDataCount} datastream tidak memiliki data`);
          }
          if (failCount > 0) {
            issues.push(`${failCount} datastream gagal diekspor`);
          }
          description = issues.join(", ");
        }
        
        successToast(message, description);
      } else if (emptyDataCount > 0 && failCount === 0) {
        // All selected datastreams have empty data
        const modeText = exportMode === "all" ? "semua data" : "data sesuai filter";
        errorToast(
          "Tidak ada data untuk diekspor", 
          `Datastream yang dipilih (${emptyDatastreams.join(", ")}) tidak memiliki ${modeText}`
        );
      } else if (failCount > 0 && emptyDataCount === 0) {
        // All exports failed due to other errors
        errorToast("Semua ekspor gagal. Silakan coba lagi.");
      } else {
        // Mixed failures
        const errorParts = [];
        if (emptyDataCount > 0) {
          errorParts.push(`${emptyDataCount} datastream tidak memiliki data`);
        }
        if (failCount > 0) {
          errorParts.push(`${failCount} datastream gagal diekspor`);
        }
        errorToast("Ekspor gagal", errorParts.join(", "));
      }
      
      // Close dialog only on successful exports
      if (successCount > 0) {
        setOpen(false);
      }
      
    } catch (error) {
      console.error("Export failed:", error);
      errorToast("Ekspor gagal: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const formContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Datastream Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
          <Label className="text-sm font-medium">Pilih Datastream untuk Diekspor</Label>
          <div className="relative max-sm:w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari device atau datastream..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-8 w-64 max-sm:w-full max-sm:text-xs text-sm"
              noInfo
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Memuat datastreams...</span>
            </div>
          </div>
        ) : loadingError ? (
          <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>Error: {loadingError}</span>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>
              {searchQuery ? 
                `Tidak ada datastream yang cocok dengan pencarian "${searchQuery}"` : 
                "Tidak ada datastream yang tersedia"
              }
            </span>
          </div>
        ) : (
          <ScrollArea className="h-48 max-sm:h-36 border border-accent rounded-lg p-3">
            <div className="space-y-4">
              {filteredDevices.map((device) => (
                <div key={device.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckboxButton
                      id={`device-${device.id}`}
                      text={device.name}
                      checked={device.datastreams.every(ds => 
                        selectedDatastreams.includes(ds.id)
                      )}
                      onChange={(e) => 
                        handleSelectAllDevice(device.id, e.target.checked)
                      }
                    />
                    <Badge variant="secondary" className="text-xs ml-2">
                      {device.datastreams.length} datastream
                    </Badge>
                  </div>
                  
                  <div className="ml-6 space-y-1">
                    {device.datastreams.map((datastream) => (
                      <div key={datastream.id} className="flex items-center gap-2">
                        <CheckboxButton
                          id={`datastream-${datastream.id}`}
                          text={`${datastream.description} (${datastream.pin})`}
                          checked={selectedDatastreams.includes(datastream.id)}
                          onChange={(e) => 
                            handleDatastreamToggle(datastream.id, e.target.checked)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Separator className={"bg-accent max-sm:hidden"} />

      {/* Export Format Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex gap-3 items-center">
          Pilih Format Ekspor
          <FileDown className="w-4 h-4" />
        </Label>
        <div className="sm:space-y-2 max-sm:flex max-sm:gap-3">
          <div className="flex items-center gap-2">
            <CheckboxButton
              id="export-csv"
              text={isMobile ? "CSV" : "CSV (Kompatibel dengan Excel)"}
              checked={exportFormats.csv}
              onChange={(e) => handleFormatToggle('csv', e.target.checked)}
            />
          </div>
          <div className="flex items-center gap-2">
            <CheckboxButton
              id="export-pdf"
              text={isMobile ? "PDF" : "PDF (Siap Cetak)"}
              checked={exportFormats.pdf}
              onChange={(e) => handleFormatToggle('pdf', e.target.checked)}
              disabled={exportMode === "all"}
            />
            {exportMode === "all" && (
              <span className="text-xs text-muted-foreground">(Tidak tersedia untuk semua data)</span>
            )}
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedDatastreams.length > 0 && (
        <div className="max-sm:py-1 max-sm:px-3 p-3 bg-red-50 dark:bg-accent rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-red-600 dark:text-foreground" />
            <span className="text-red-800 dark:text-foreground">
              {selectedDatastreams.length} datastream dipilih untuk diekspor
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      setOpen={setOpen}
      title={getDialogTitle()}
      form={formContent}
      formHandle={(e) => {
        e.preventDefault();
        handleExport();
      }}
      confirmText={
        isExporting ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Mengekspor...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Ekspor Data
          </div>
        )
      }
      cancelText="Batal"
      loading={isExporting}
    />
  );
}
