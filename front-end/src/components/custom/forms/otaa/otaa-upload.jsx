// Import React hooks untuk state management
import { useState } from "react";
// Import UI components untuk form inputs
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Import icons untuk UI elements
import { Upload, FileCode, X, HardDrive, Users, Cpu } from "lucide-react";
// Import toaster untuk notifications
import { successToast, errorToast } from "../../other/toaster";
// Import helper function untuk API calls
import { fetchFromBackend } from "@/lib/helper";

// Komponen OtaaUploadSection untuk mengunggah firmware Over The Air ke perangkat IoT
export default function OtaaUploadSection({ 
  boardOptions, // Array board types yang didukung sistem
  boardTypesInUse, // Array board types yang sedang digunakan devices
  devices, // Array devices yang terdaftar dalam sistem
  handleFirmwareUploaded, // Callback function setelah firmware berhasil diupload
  setOpen // Setter untuk close modal parent
}) {
  // State untuk form fields
  const [selectedBoardType, setSelectedBoardType] = useState(""); // Board type yang dipilih untuk firmware
  const [firmwareVersion, setFirmwareVersion] = useState(""); // Versi firmware yang akan diunggah
  const [selectedFile, setSelectedFile] = useState(null); // File firmware yang dipilih
  const [uploading, setUploading] = useState(false); // Loading state saat upload

  // Handler untuk memilih file firmware dengan validasi
  const handleFileSelect = (e) => {
    const file = e.target.files[0]; // Get first selected file
    if (!file) return; // Exit jika tidak ada file yang dipilih

  // Validasi ekstensi file - hanya .bin dan .hex diperbolehkan
    const allowedExt = ['.bin', '.hex'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase(); // Extract file extension
    
    if (!allowedExt.includes(ext)) {
  errorToast("Hanya file .bin atau .hex yang diperbolehkan"); // Error ekstensi tidak valid
      return; // Stop execution jika ekstensi tidak valid
    }

  // Validasi ukuran file maksimal 5MB
    if (file.size > 5 * 1024 * 1024) {
  errorToast("Ukuran file maksimal 5MB"); // Error file terlalu besar
      return; // Stop execution jika file terlalu besar
    }

    setSelectedFile(file); // Set file yang valid ke state
  };

  // Handler untuk menghapus file yang sudah dipilih
  const handleRemoveFile = () => {
    setSelectedFile(null); // Clear selected file
  };

  // Helper untuk menghitung jumlah perangkat berdasarkan board type
  const getDeviceCountByBoard = (boardType) => {
    return devices.filter(device => device.board_type === boardType).length;
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedBoardType) {
  errorToast("Pilih tipe board terlebih dahulu");
      return;
    }

    if (!firmwareVersion.trim()) {
  errorToast("Versi firmware wajib diisi");
      return;
    }

    if (!selectedFile) {
  errorToast("Pilih file firmware terlebih dahulu");
      return;
    }

    setUploading(true);

    try {
  // Konversi file ke base64
      const fileBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const payload = {
        board_type: selectedBoardType,
        firmware_version: firmwareVersion.trim(),
        filename: selectedFile.name,
        file_base64: fileBase64,
      };

      const res = await fetchFromBackend('/otaa/upload', {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal upload firmware");
      }

      const data = await res.json();
      
      const affectedDevices = getDeviceCountByBoard(selectedBoardType);
  // successToast(`Firmware berhasil diunggah untuk ${affectedDevices} perangkat ${selectedBoardType}!`);
      
      // Reset form
      setSelectedBoardType("");
      setFirmwareVersion("");
      setSelectedFile(null);
      
      // Callback untuk update parent component
      if (handleFirmwareUploaded) {
        handleFirmwareUploaded(data);
      }
    } catch (error) {
      errorToast(error.message || "Gagal upload firmware!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 w-full text-sm">
      <form onSubmit={handleUpload} className="space-y-4">
  {/* Pemilihan Tipe Board */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Pilih Tipe Board
          </Label>
          <Select value={selectedBoardType} onValueChange={setSelectedBoardType}>
            <SelectTrigger className={"w-full"}>
              <SelectValue placeholder="Pilih tipe board" />
            </SelectTrigger>
            <SelectContent>
              {boardOptions.map((board) => {
                const deviceCount = getDeviceCountByBoard(board);
                const isInUse = boardTypesInUse.includes(board);
                
                return (
                  <SelectItem key={board} value={board}>
                    <div className="flex items-center justify-between w-full">
                      <span>{board}</span>
                      {isInUse && (
                        <span className="ml-2 text-xs text-muted-foreground flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          {deviceCount}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          {/* Info tentang perangkat yang akan terpengaruh */}
          {selectedBoardType && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-xs">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="font-medium">Board: {selectedBoardType}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Cpu className="w-3 h-3" />
                <span>{getDeviceCountByBoard(selectedBoardType)} perangkat akan menggunakan firmware ini</span>
              </div>
            </div>
          )}
        </div>

  {/* Input Versi Firmware */}
        <div className="space-y-2">
          <Label htmlFor="firmwareVersion" className="text-sm font-medium">
            Versi Firmware
          </Label>
          <Input
            id="firmwareVersion"
            type="text"
            placeholder="Contoh: 1.0.0"
            value={firmwareVersion}
            noInfo
            onChange={(e) => setFirmwareVersion(e.target.value)}
            required
          />
        </div>

  {/* Unggah File */}
        <div className="space-y-2">
          <Label htmlFor="firmwareFile" className="text-sm font-medium">
            File Firmware (.bin atau .hex)
          </Label>
          
          {!selectedFile ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
              <input
                id="firmwareFile"
                type="file"
                accept=".bin,.hex"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Label
                htmlFor="firmwareFile"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium">Klik untuk pilih berkas</span>
                <span className="text-xs text-muted-foreground">
                  Maksimal 5MB, format .bin atau .hex
                </span>
              </Label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

  {/* Tombol Unggah */}
        <Button
          type="submit"
          className="w-full"
          disabled={uploading || !selectedBoardType || !firmwareVersion.trim() || !selectedFile}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Mengunggah...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Unggah Firmware
            </>
          )}
        </Button>
      </form>
    </div>
  );
}