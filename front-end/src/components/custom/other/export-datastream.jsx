"use client";
import { useState, useEffect } from "react";
import ResponsiveDialog from "../dialogs/responsive-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import CheckboxButton from "../buttons/checkbox-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Loader2 
} from "lucide-react";
import { fetchFromBackend } from "@/lib/helper";
import { useUser } from "@/providers/user-provider";
import { successToast, errorToast } from "./toaster";
import { generatePDFHtmlContent, exportToCSV as exportCSVUtil, printHTMLContent, formatDateTime } from "@/lib/export-utils";

export default function ExportDashboardDialog({
  open,
  setOpen,
  currentTimeRange,
  currentDataCount,
  filterType,
}) {
  const { user } = useUser();
  const [devices, setDevices] = useState([]);
  const [datastreams, setDatastreams] = useState([]);
  const [selectedDatastreams, setSelectedDatastreams] = useState([]);
  const [exportFormats, setExportFormats] = useState({
    csv: true,
    pdf: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingError, setLoadingError] = useState(null);

  // Fetch devices and datastreams
  useEffect(() => {
    if (open && user) {
      fetchDevicesAndDatastreams();
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
    const device = devices.find(d => d.id === deviceId);
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
    setExportFormats(prev => ({
      ...prev,
      [format]: checked
    }));
  };

  const fetchDatastreamData = async (datastreamId) => {
    try {
      const datastream = datastreams.find(ds => ds.id === datastreamId);
      if (!datastream) {
        throw new Error(`Datastream ${datastreamId} not found`);
      }

      // Use the timeseries endpoint for consistent data
      const params = new URLSearchParams();
      if (filterType === 'time' && currentTimeRange) {
        params.append('range', currentTimeRange);
      } else if (filterType === 'count' && currentDataCount) {
        params.append('count', currentDataCount.toString());
      }

      const response = await fetchFromBackend(
        `/payload/timeseries/${datastream.device_id}/${datastreamId}?${params}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data for datastream ${datastreamId}`);
      }
      
      const data = await response.json();
      return {
        datastream,
        data: data.result || []
      };
    } catch (error) {
      console.error(`Error fetching data for datastream ${datastreamId}:`, error);
      throw error;
    }
  };

  const exportToCSV = async (datastreamData) => {
    const { datastream, data } = datastreamData;
    
    if (!data || data.length === 0) {
      console.warn(`No data found for datastream: ${datastream.description}`);
      return;
    }

    const headers = [
      "Tanggal/Waktu",
      "Device ID", 
      "Device Name",
      "Datastream",
      "Value"
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
      datastream.device_description,
      datastream.description,
      item.value
    ]);

    const filename = `datastream-${datastream.description.replace(/[^a-zA-Z0-9]/g, '_')}`;
    exportCSVUtil(headers, rows, filename);
  };

  const exportToPDF = async (datastreamData) => {
    const { datastream, data } = datastreamData;
    
    if (!data || data.length === 0) {
      console.warn(`No data found for datastream: ${datastream.description}`);
      return;
    }

    // Sort data from oldest to newest
    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.device_time || a.created_at);
      const dateB = new Date(b.device_time || b.created_at);
      return dateA.getTime() - dateB.getTime();
    });

    const headers = ["Tanggal/Waktu", "Device ID", "Device Name", "Datastream", "Value"];
    
    const rows = sortedData.map((item) => [
      formatDateTime(item.device_time || item.created_at),
      datastream.device_id,
      datastream.device_description || `Device ${datastream.device_id}`,
      datastream.description,
      item.value
    ]);

    const metadata = {
      "Device": datastream.device_description || `Device ${datastream.device_id}`,
      "Datastream": datastream.description,
      "Total": `${sortedData.length} data`
    };

    const htmlContent = generatePDFHtmlContent({
      title: `Data Ekspor - ${datastream.description}`,
      subtitle: "Monitoring System Report",
      headers,
      data: rows,
      metadata,
      filename: `datastream-${datastream.description.replace(/[^a-zA-Z0-9]/g, '_')}`
    });

    printHTMLContent(htmlContent);
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
      // Fetch data for all selected datastreams
      const exportPromises = selectedDatastreams.map(async (datastreamId) => {
        try {
          const datastreamData = await fetchDatastreamData(datastreamId);
          
          // Export in selected formats
          if (exportFormats.csv) {
            await exportToCSV(datastreamData);
          }
          
          if (exportFormats.pdf) {
            await exportToPDF(datastreamData);
          }
          
          return { success: true, datastreamId };
        } catch (error) {
          console.error(`Failed to export datastream ${datastreamId}:`, error);
          return { success: false, datastreamId, error: error.message };
        }
      });

      const results = await Promise.all(exportPromises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        successToast(
          `Berhasil mengekspor ${successCount} datastream`, 
          failCount > 0 ? `${failCount} datastream gagal diekspor` : undefined
        );
      }
      
      if (failCount > 0 && successCount === 0) {
        errorToast("Semua ekspor gagal. Silakan coba lagi.");
      }
      
      // Close dialog on success
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
    <div className="space-y-6">
      {/* Datastream Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Pilih Datastream untuk Diekspor</Label>
        
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
        ) : devices.length === 0 ? (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>Tidak ada datastream yang tersedia</span>
          </div>
        ) : (
          <ScrollArea className="h-48 border border-accent rounded-lg p-3">
            <div className="space-y-4">
              {devices.map((device) => (
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

      <Separator className={"bg-accent"} />

      {/* Export Format Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Format Ekspor</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckboxButton
              id="export-csv"
              text="CSV (Kompatibel dengan Excel)"
              checked={exportFormats.csv}
              onChange={(e) => handleFormatToggle('csv', e.target.checked)}
            />
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <CheckboxButton
              id="export-pdf"
              text="PDF (Siap Cetak)"
              checked={exportFormats.pdf}
              onChange={(e) => handleFormatToggle('pdf', e.target.checked)}
            />
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedDatastreams.length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-accent rounded-lg border border-red-200">
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
      title="Ekspor Data Dashboard"
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
