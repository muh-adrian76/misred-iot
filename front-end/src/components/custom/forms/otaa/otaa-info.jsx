// Import React hooks untuk state management dan lifecycle
import { useState, useEffect } from "react";
// Import UI components untuk interface
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Import icons untuk UI elements
import { Download, RefreshCw, FileCode, Cpu, HardDrive, Trash2 } from "lucide-react";
// Import helper functions untuk date conversion dan API calls
import { convertDate, fetchFromBackend } from "@/lib/helper";
// Import toaster untuk notifications
import { successToast, errorToast } from "../../other/toaster";
// Import confirm dialog untuk konfirmasi delete
import ConfirmDialog from "../../dialogs/confirm-dialog";

// Komponen OtaaInfoSection untuk menampilkan informasi firmware yang tersedia
export default function OtaaInfoSection({ boardTypes, devices }) {
  // State untuk firmware data dan loading
  const [firmwareList, setFirmwareList] = useState([]); // List firmware grouped by board type
  const [loading, setLoading] = useState(false); // Loading state saat fetch data
  
  // State untuk delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Dialog visibility state
  const [firmwareToDelete, setFirmwareToDelete] = useState(null); // Firmware yang akan dihapus

  // Function untuk fetch firmware data berdasarkan board types
  const fetchFirmwareByBoard = async () => {
    setLoading(true); // Set loading state
    try {
      // API call untuk get firmware list
      const res = await fetchFromBackend('/otaa');
      if (res.ok) {
        const response = await res.json();
        if (response.success) {
          // Group firmware by board type untuk organized display
          const firmwareData = {};
          boardTypes.forEach(boardType => {
            firmwareData[boardType] = response.data.filter(firmware => 
              firmware.board_type === boardType // Filter berdasarkan board type
            );
          });
          setFirmwareList(firmwareData); // Set grouped firmware data
        } else {
          // Handle case ketika belum ada firmware - tidak error, hanya empty state
          const firmwareData = {};
          boardTypes.forEach(boardType => {
            firmwareData[boardType] = []; // Empty array untuk setiap board type
          });
          setFirmwareList(firmwareData);
        }
      } else {
        // Handle response tidak ok - silent fail untuk empty state
        const firmwareData = {};
        boardTypes.forEach(boardType => {
          firmwareData[boardType] = []; // Empty array untuk setiap board type
        });
        setFirmwareList(firmwareData);
      }
    } catch (error) {
      // Silent fail untuk kasus belum ada firmware atau network error
      const firmwareData = {};
      boardTypes.forEach(boardType => {
        firmwareData[boardType] = []; // Empty array untuk setiap board type
      });
      setFirmwareList(firmwareData);
      console.warn("Failed to fetch firmware, showing empty state:", error); // Log warning tanpa error toast
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Effect untuk fetch data hanya saat mount pertama kali
  useEffect(() => {
    if (boardTypes.length > 0) {
      fetchFirmwareByBoard(); // Fetch firmware hanya sekali saat component mount
    }
  }, []); // PERBAIKAN: Empty dependency array untuk mencegah re-fetch berulang

  // Handler untuk download firmware file
  const handleDownload = async (boardType, filename) => {
    try {
      // API call untuk download firmware file
      const res = await fetchFromBackend(`/otaa/download/${boardType}/${filename}`);
      if (!res.ok) throw new Error("Gagal download firmware"); // Throw error jika response tidak ok
      
      // Convert response ke blob untuk file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob); // Create object URL untuk download
      
      // Create temporary link element untuk trigger download
      const a = document.createElement('a');
      a.href = url; // Set URL
      a.download = filename; // Set filename
      document.body.appendChild(a); // Append ke DOM
      a.click(); // Trigger click untuk download
      
      // Cleanup temporary elements dan URLs
      window.URL.revokeObjectURL(url); // Revoke object URL
      document.body.removeChild(a); // Remove link element
      
      successToast("Firmware berhasil didownload!"); // Success notification
    } catch (error) {
      errorToast("Gagal download firmware!"); // Error notification
    }
  };

  // Handler untuk memulai proses hapus firmware (show dialog)
  const handleDeleteStart = (firmware, boardType) => {
    setFirmwareToDelete({ ...firmware, boardType }); // Set firmware data dengan board type
    setDeleteDialogOpen(true); // Buka dialog konfirmasi
  };

  // Handler untuk konfirmasi hapus firmware (actual delete)
  const handleDeleteConfirm = async () => {
    if (!firmwareToDelete) return; // Safety check
    
    try {
      // API call untuk delete firmware
      const res = await fetchFromBackend(`/otaa/${firmwareToDelete.id}`, {
        method: 'DELETE', // HTTP DELETE method
      });
      
      if (!res.ok) throw new Error("Gagal menghapus firmware"); // Throw error jika response tidak ok
      
      // Update local state untuk remove firmware yang dihapus
      setFirmwareList(prevList => {
        const updatedList = { ...prevList };
        updatedList[firmwareToDelete.boardType] = updatedList[firmwareToDelete.boardType].filter(
          firmware => firmware.id !== firmwareToDelete.id // Filter out deleted firmware
        );
        return updatedList;
      });
      
      successToast("Firmware berhasil dihapus!"); // Success notification
      setDeleteDialogOpen(false); // Tutup dialog
      setFirmwareToDelete(null); // Reset firmware data
    } catch (error) {
      errorToast("Gagal menghapus firmware!"); // Error notification
      console.error("Delete firmware error:", error);
      setDeleteDialogOpen(false); // Tutup dialog meskipun error
      setFirmwareToDelete(null); // Reset firmware data
    }
  };

  // Helper function untuk menghitung jumlah device berdasarkan board type
  const getDeviceCountByBoard = (boardType) => {
    return devices.filter(device => device.board_type === boardType).length;
  };

  // Early return jika belum ada device yang terdaftar
  if (boardTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" /> {/* Icon hardware */}
          <p>Belum ada device yang terdaftar</p> {/* Empty state message */}
        </div>
      </div>
    );
  }

  // Render main component content
  return (
    <div className="space-y-4 w-full text-sm">
      {/* Header section dengan title dan refresh button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileCode className="w-4 h-4" /> {/* Icon file code */}
          Firmware yang tersedia {/* Section title */}
        </h3>
        {/* Refresh button untuk reload firmware data */}
        <Button
          size="sm"
          variant="outline"
          onClick={fetchFirmwareByBoard} // Trigger refetch data
          disabled={loading} // Disable saat loading
          className="h-8"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> {/* Icon dengan conditional animation */}
        </Button>
      </div>

      {/* Firmware List section dengan scrollable container */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Loop melalui setiap board type */}
        {boardTypes.map((boardType) => (
          <div key={boardType} className="border rounded-lg p-4 bg-muted/50">
            {/* Board Type Header dengan device count */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" /> {/* Hardware icon */}
                <span className="font-medium">{boardType}</span> {/* Board type name */}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cpu className="w-3 h-3" /> {/* CPU icon */}
                <span>{getDeviceCountByBoard(boardType)} perangkat</span> {/* Device count */}
              </div>
            </div>

            {/* Firmware List untuk board type ini */}
            {loading ? (
              // Loading state
              <div className="flex items-center justify-center h-16 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> {/* Spinning loading icon */}
                Memuat... {/* Loading text */}
              </div>
            ) : firmwareList[boardType]?.length === 0 ? (
              // Empty state ketika belum ada firmware
              <div className="flex items-center justify-center h-16 text-muted-foreground border-2 border-dashed rounded">
                <div className="text-center">
                  <FileCode className="w-6 h-6 mx-auto mb-1 opacity-50" /> {/* File icon */}
                  <p className="text-xs">Belum ada firmware</p> {/* Empty message */}
                </div>
              </div>
            ) : (
              // Firmware list dengan data
              <div className="space-y-2">
                {firmwareList[boardType]?.map((firmware, index) => (
                  <div
                    key={index} // Unique key untuk list item
                    className="flex items-center justify-between p-2 border rounded bg-background"
                  >
                    <div className="flex-1 min-w-0"> {/* Firmware info section */}
                      <p className="font-medium text-xs truncate">{firmware.firmware_url.split('/').pop()}</p> {/* Filename */}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          v{firmware.firmware_version} {/* Version badge */}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {convertDate(firmware.updated_at)} {/* Formatted date */}
                        </span>
                      </div>
                    </div>
                    {/* Action buttons: Download dan Delete */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {/* Download button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(boardType, firmware.firmware_url.split('/').pop())} // Trigger download
                        className="h-8 w-8 p-0"
                        title="Download firmware"
                      >
                        <Download className="w-3 h-3" /> {/* Download icon */}
                      </Button>
                      {/* Delete button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteStart(firmware, boardType)} // Trigger delete dialog
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Hapus firmware"
                      >
                        <Trash2 className="w-3 h-3" /> {/* Delete icon */}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm Dialog untuk hapus firmware */}
      <ConfirmDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        title={
          firmwareToDelete ? (
            <>
              Hapus firmware <i>"{firmwareToDelete.firmware_url?.split('/').pop()}"</i> ?
            </>
          ) : (
            "Hapus firmware"
          )
        }
        description={
          firmwareToDelete ? (
            `Firmware versi ${firmwareToDelete.firmware_version} untuk ${firmwareToDelete.boardType} akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`
          ) : (
            "Tindakan ini tidak dapat dibatalkan."
          )
        }
        confirmHandle={handleDeleteConfirm}
        confirmText="Hapus"
        cancelText="Batal"
        confirmDisabled={false}
      />
    </div>
  );
}