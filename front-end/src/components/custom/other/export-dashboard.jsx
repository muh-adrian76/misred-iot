"use client";

// Import dependencies untuk dialog ekspor dashboard IoT
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

/**
 * Komponen ExportDashboardDialog
 * 
 * Dialog ekspor data dashboard IoT yang powerful dengan berbagai fitur:
 * - Ekspor berdasarkan filter waktu atau jumlah data
 * - Ekspor semua data historis
 * - Multiple format (CSV dan PDF)
 * - Seleksi device dan datastream granular
 * - Search dan filter real-time
 * - Progress tracking dan error handling
 * 
 * @param {boolean} open - Status dialog terbuka/tertutup
 * @param {function} setOpen - Callback untuk mengubah status dialog
 * @param {string} currentTimeRange - Range waktu saat ini (1h, 12h, 1d, 1w)
 * @param {number} currentDataCount - Jumlah data saat ini untuk filter count
 * @param {string} filterType - Tipe filter ('time' atau 'count')
 * @param {string} exportMode - Mode ekspor ('filter' atau 'all')
 * @param {boolean} isMobile - Indikator tampilan mobile untuk UI responsif
 */
export default function ExportDashboardDialog({
  open,
  setOpen,
  currentTimeRange,
  currentDataCount,
  filterType,
  exportMode = "filter", // "filter" or "all"
  isMobile,
}) {
  // Hooks dan state management
  const { user } = useUser();
  
  // State untuk data perangkat dan datastream
  const [devices, setDevices] = useState([]); // Daftar perangkat IoT
  const [datastreams, setDatastreams] = useState([]); // Daftar semua datastream
  const [selectedDatastreams, setSelectedDatastreams] = useState([]); // Datastream yang dipilih untuk ekspor
  
  // State untuk UI dan pencarian
  const [searchQuery, setSearchQuery] = useState(""); // Query pencarian device/datastream
  const [exportFormats, setExportFormats] = useState({
    csv: true,
    pdf: exportMode === "filter", // PDF hanya tersedia untuk mode filter
  });
  
  // State untuk loading dan error
  const [isLoading, setIsLoading] = useState(false); // Loading saat fetch initial data
  const [isExporting, setIsExporting] = useState(false); // Loading saat proses ekspor
  const [loadingError, setLoadingError] = useState(null); // Error saat loading data

  // Effect: Update format ekspor ketika mode berubah
  // PDF tidak tersedia untuk mode "all" karena limitasi performa
  useEffect(() => {
    if (exportMode === "all") {
      setExportFormats({ csv: true, pdf: false });
    } else {
      setExportFormats({ csv: true, pdf: false });
    }
  }, [exportMode]);

  // Effect: Fetch data ketika dialog dibuka
  useEffect(() => {
    if (open && user) {
      fetchDevicesAndDatastreams();
      setSearchQuery(""); // Reset pencarian saat dialog dibuka
    }
  }, [open, user]);

  /**
   * Fungsi untuk mengambil daftar perangkat dan datastream dari backend
   * Mengelompokkan datastream berdasarkan device untuk organisasi yang lebih baik
   */
  const fetchDevicesAndDatastreams = async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    try {
      // Ambil semua datastream (sudah termasuk informasi device)
      const response = await fetchFromBackend("/datastream");
      if (!response.ok) {
        throw new Error("Failed to fetch datastreams");
      }
      
      const data = await response.json();
      const datastreamList = data.result || [];
      
      // Kelompokkan datastream berdasarkan device untuk UI yang lebih organized
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

  /**
   * Handler untuk toggle seleksi individual datastream
   * Menambah atau menghapus datastream dari daftar yang akan diekspor
   */
  const handleDatastreamToggle = (datastreamId, checked) => {
    if (checked) {
      setSelectedDatastreams(prev => [...prev, datastreamId]);
    } else {
      setSelectedDatastreams(prev => prev.filter(id => id !== datastreamId));
    }
  };

  /**
   * Handler untuk seleksi semua datastream dalam satu device
   * Memungkinkan user untuk cepat memilih semua sensor dalam satu perangkat
   */
  const handleSelectAllDevice = (deviceId, checked) => {
    const device = filteredDevices.find(d => d.id === deviceId);
    if (!device) return;
    
    const deviceDatastreamIds = device.datastreams.map(ds => ds.id);
    
    if (checked) {
      // Tambahkan semua datastream device ini, hapus yang sudah ada sebelumnya
      setSelectedDatastreams(prev => [
        ...prev.filter(id => !deviceDatastreamIds.includes(id)),
        ...deviceDatastreamIds
      ]);
    } else {
      // Hapus semua datastream device ini dari seleksi
      setSelectedDatastreams(prev => 
        prev.filter(id => !deviceDatastreamIds.includes(id))
      );
    }
  };

  /**
   * Handler untuk toggle format ekspor (CSV/PDF)
   * Mencegah perubahan format yang tidak diizinkan pada mode tertentu
   */
  const handleFormatToggle = (format, checked) => {
    // Cegah perubahan PDF pada mode "all" karena limitasi performa
    if (exportMode === "all" && format === "pdf") {
      return;
    }
    
    setExportFormats(prev => ({
      ...prev,
      [format]: checked
    }));
  };

  /**
   * Fungsi untuk generate judul dialog berdasarkan mode dan filter
   * Memberikan konteks yang jelas tentang data apa yang akan diekspor
   */
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

  /**
   * Fungsi untuk filter device dan datastream berdasarkan query pencarian
   * Mendukung pencarian berdasarkan nama device, deskripsi datastream, dan virtual pin
   */
  const filteredDevices = devices.filter(device => {
    const deviceMatches = device.name.toLowerCase().includes(searchQuery.toLowerCase());
    const datastreamMatches = device.datastreams.some(ds => 
      ds.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.pin.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return deviceMatches || datastreamMatches;
  }).map(device => ({
    ...device,
    // Filter datastream dalam device berdasarkan query
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

  const exportDataToCSV = async (deviceData) => {
    // deviceData is { deviceId, deviceName, datastreams: [{ datastream, data }] }
    const { deviceId, deviceName, datastreams } = deviceData;
    
    const headers = [
      "Tanggal dan Waktu",
      "UID Perangkat", 
      "Nama Perangkat",
      "Datastream",
      "Virtual Pin",
      "Nilai"
    ];

    // Combine all data from all datastreams for this device
    const allRows = [];
    datastreams.forEach(({ datastream, data }) => {
      if (data && data.length > 0) {
        data.forEach((item) => {
          // Get the date string and validate it - use timestamp from backend first
          const dateStr = item.timestamp || item.device_time || item.created_at;
          const dateObj = new Date(dateStr);
          const timestamp = isNaN(dateObj.getTime()) ? 0 : dateObj.getTime(); // Use 0 for invalid dates to sort them last
          
          allRows.push({
            timestamp: timestamp,
            row: [
              formatDateTime(dateStr), // formatDateTime will handle invalid dates
              deviceId,
              deviceName,
              datastream.description,
              datastream.pin,
              item.value || 'N/A'
            ]
          });
        });
      }
    });

    if (allRows.length === 0) {
      throw new Error(`Tidak ada data untuk diekspor pada device: ${deviceName}`);
    }

    // Sort all rows by timestamp (oldest to newest)
    const sortedRows = allRows.sort((a, b) => a.timestamp - b.timestamp);
    const rows = sortedRows.map(item => item.row);

    // Add unique timestamp to prevent filename conflicts
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `device-${deviceName.replace(/[^a-zA-Z0-9]/g, '_')}-${timestamp}`;
    
    // Use utility function for CSV export
    exportToCSV(headers, rows, filename);
  };

  const exportToPDF = async (allDatastreamData) => {
    // allDatastreamData is an array of { datastream, data }
    if (!allDatastreamData || allDatastreamData.length === 0) {
      throw new Error("Tidak ada data untuk diekspor ke PDF");
    }

    // Filter out empty datastreams
    const validDatastreams = allDatastreamData.filter(({ data }) => data && data.length > 0);
    
    if (validDatastreams.length === 0) {
      throw new Error("Semua datastream yang dipilih tidak memiliki data");
    }

    // Generate filename with timestamp and first device info
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const firstDevice = validDatastreams[0].datastream;
    const filename = `laporan-perangkat-${firstDevice.device_description?.replace(/[^a-zA-Z0-9]/g, '_') || `device-${firstDevice.device_id}`}-${timestamp}`;

    // Create React PDF Document component and generate PDF
    const DocumentComponent = DatastreamPDFDocument({ 
      datastreams: validDatastreams.map(d => d.datastream),
      allData: validDatastreams,
      exportMode 
    });
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
      const allDatastreamData = []; // For combined PDF
      
      // Process each datastream sequentially to collect data
      for (const datastreamId of selectedDatastreams) {
        try {
          const datastreamData = await fetchDatastreamData(datastreamId);
          allDatastreamData.push(datastreamData);
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
      
      // Group datastreams by device for CSV export
      if (exportFormats.csv && allDatastreamData.length > 0) {
        const deviceGroups = {};
        
        allDatastreamData.forEach(({ datastream, data }) => {
          const deviceId = datastream.device_id;
          const deviceName = datastream.device_description || `Device ${deviceId}`;
          
          if (!deviceGroups[deviceId]) {
            deviceGroups[deviceId] = {
              deviceId,
              deviceName,
              datastreams: []
            };
          }
          
          deviceGroups[deviceId].datastreams.push({ datastream, data });
        });
        
        // Export one CSV per device
        for (const deviceData of Object.values(deviceGroups)) {
          try {
            await exportDataToCSV(deviceData);
            // Small delay to prevent conflicts
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.error("CSV export failed for device:", deviceData.deviceName, error);
          }
        }
      }
      
      // Export single combined PDF if PDF format is selected and we have data
      if (exportFormats.pdf && allDatastreamData.length > 0) {
        try {
          await exportToPDF(allDatastreamData);
          // Small delay for PDF generation
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error("PDF export failed:", error);
          errorToast("Ekspor PDF gagal: " + error.message);
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
              text={isMobile ? "CSV" : "CSV (Kompatibel dengan Microsoft Excel)"}
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
