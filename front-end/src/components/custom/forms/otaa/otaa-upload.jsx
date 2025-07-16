import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileCode, X, HardDrive, Users, Cpu } from "lucide-react";
import { successToast, errorToast } from "../../other/toaster";
import { fetchFromBackend } from "@/lib/helper";

export default function OtaaUploadSection({ 
  boardOptions, 
  boardTypesInUse, 
  devices, 
  handleFirmwareUploaded, 
  setOpen 
}) {
  const [selectedBoardType, setSelectedBoardType] = useState("");
  const [firmwareVersion, setFirmwareVersion] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ekstensi file
    const allowedExt = ['.bin', '.hex'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExt.includes(ext)) {
      errorToast("Hanya file .bin atau .hex yang diperbolehkan");
      return;
    }

    // Validasi ukuran file (maksimal 10MB)
    if (file.size > 5 * 1024 * 1024) {
      errorToast("Ukuran file maksimal 5MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

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
      // Convert file to base64
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
      // successToast(`Firmware berhasil diupload untuk ${affectedDevices} device ${selectedBoardType}!`);
      
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
        {/* Board Type Selection */}
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
          
          {/* Info tentang device yang akan terpengaruh */}
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

        {/* Firmware Version Input */}
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

        {/* File Upload */}
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
                <span className="text-sm font-medium">Klik untuk pilih file</span>
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

        {/* Upload Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={uploading || !selectedBoardType || !firmwareVersion.trim() || !selectedFile}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload Firmware
            </>
          )}
        </Button>
      </form>
    </div>
  );
}