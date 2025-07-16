import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, FileCode, Cpu, HardDrive } from "lucide-react";
import { convertDate, fetchFromBackend } from "@/lib/helper";
import { successToast, errorToast } from "../../other/toaster";

export default function OtaaInfoSection({ boardTypes, devices }) {
  const [firmwareList, setFirmwareList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFirmwareByBoard = async () => {
    setLoading(true);
    try {
      const res = await fetchFromBackend('/otaa');
      if (res.ok) {
        const response = await res.json();
        if (response.success) {
          // Group firmware by board type
          const firmwareData = {};
          boardTypes.forEach(boardType => {
            firmwareData[boardType] = response.data.filter(firmware => 
              firmware.board_type === boardType
            );
          });
          setFirmwareList(firmwareData);
        } else {
          // Jangan tampilkan error jika memang belum ada firmware
          const firmwareData = {};
          boardTypes.forEach(boardType => {
            firmwareData[boardType] = [];
          });
          setFirmwareList(firmwareData);
        }
      } else {
        // Jangan tampilkan error jika memang belum ada firmware
        const firmwareData = {};
        boardTypes.forEach(boardType => {
          firmwareData[boardType] = [];
        });
        setFirmwareList(firmwareData);
      }
    } catch (error) {
      // Silent fail untuk kasus belum ada firmware
      const firmwareData = {};
      boardTypes.forEach(boardType => {
        firmwareData[boardType] = [];
      });
      setFirmwareList(firmwareData);
      console.warn("Failed to fetch firmware, showing empty state:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardTypes.length > 0) {
      fetchFirmwareByBoard();
    }
  }, [boardTypes]);

  const handleDownload = async (boardType, filename) => {
    try {
      const res = await fetchFromBackend(`/otaa/download/${boardType}/${filename}`);
      if (!res.ok) throw new Error("Gagal download firmware");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      successToast("Firmware berhasil didownload!");
    } catch (error) {
      errorToast("Gagal download firmware!");
    }
  };

  const getDeviceCountByBoard = (boardType) => {
    return devices.filter(device => device.board_type === boardType).length;
  };

  if (boardTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Belum ada device yang terdaftar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full text-sm">
      {/* Board Types */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileCode className="w-4 h-4" />
          Firmware yang tersedia
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchFirmwareByBoard}
          disabled={loading}
          className="h-8"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Firmware List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {boardTypes.map((boardType) => (
          <div key={boardType} className="border rounded-lg p-4 bg-muted/50">
            {/* Board Type Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="font-medium">{boardType}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cpu className="w-3 h-3" />
                <span>{getDeviceCountByBoard(boardType)} perangkat</span>
              </div>
            </div>

            {/* Firmware List */}
            {loading ? (
              <div className="flex items-center justify-center h-16 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Memuat...
              </div>
            ) : firmwareList[boardType]?.length === 0 ? (
              <div className="flex items-center justify-center h-16 text-muted-foreground border-2 border-dashed rounded">
                <div className="text-center">
                  <FileCode className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Belum ada firmware</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {firmwareList[boardType]?.map((firmware, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded bg-background"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{firmware.firmware_url.split('/').pop()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          v{firmware.firmware_version}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {convertDate(firmware.updated_at)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(boardType, firmware.firmware_url.split('/').pop())}
                      className="shrink-0 ml-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}