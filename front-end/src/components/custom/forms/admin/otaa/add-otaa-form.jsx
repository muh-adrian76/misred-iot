// Add OTAA Form Component - komponen form untuk upload firmware GLOBAL ke sistem
// Fitur: input board type, input versi, upload file, validasi, styling modern
// Admin Mode: Upload firmware global yang akan tersedia untuk semua user dengan board type yang sama
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, RefreshCw, FileCode, AlertCircle, CheckCircle, Cpu } from "lucide-react";

export default function AddOTAAForm({
  // Upload form state - state form upload firmware
  uploadForm, // Object state form berisi board_type, firmware_version, file, filename
  setUploadForm, // Setter untuk mengupdate state form
  handleFileUpload, // Handler untuk memproses file yang dipilih
  handleUploadFirmware, // Handler untuk submit upload firmware
  uploading, // Status uploading untuk disable form saat proses upload
  boardOptions, // Array board options dari device-logic.js (fallback options)
  boardTypes, // Array board types yang tersedia dari database (optional)
  devices, // Array devices untuk menghitung jumlah per board type (opsional)
}) {
  // Gunakan boardTypes dari database jika ada, jika tidak gunakan boardOptions default
  const availableBoardTypes = (boardTypes && boardTypes.length > 0) ? boardTypes : boardOptions;
  return (
    <div className="space-y-6">
      <form onSubmit={handleUploadFirmware} className="space-y-6">
        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Board Type Selection - Full width untuk konsistensi */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Board Type
            </label>
            <Select 
              value={uploadForm.board_type} 
              onValueChange={(value) => setUploadForm(prev => ({
                ...prev,
                board_type: value
              }))}
            >
              <SelectTrigger className="h-11 bg-white w-full dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Pilih board type" />
              </SelectTrigger>
              <SelectContent>
                {availableBoardTypes && availableBoardTypes.length > 0 ? (
                  availableBoardTypes.map((board) => {
                    const deviceCount = devices ? devices.filter(device => device.board_type === board).length : 0;
                    
                    return (
                      <SelectItem key={board} value={board}>
                        <div className="flex items-center justify-between w-full">
                          <span>{board}</span>
                          {devices && deviceCount > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              {deviceCount}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="no-data" disabled>
                    Tidak ada board type tersedia
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Pilih jenis board yang akan menerima firmware global ini
            </p>
          </div>

          {/* Firmware Version Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Versi Firmware
            </label>
            <Input
              type="text"
              placeholder="Contoh: 1.0.0, 2.1.3"
              value={uploadForm.firmware_version}
              onChange={(e) => setUploadForm(prev => ({
                ...prev,
                firmware_version: e.target.value
              }))}
              noInfo
              className="h-11 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Versi firmware global yang akan tersedia untuk semua user
            </p>
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Deskripsi (Opsional)
          </label>
          <textarea
            placeholder="Contoh: Fix bug komunikasi sensor, Penambahan fitur deep sleep, Update driver WiFi"
            value={uploadForm.description || ''}
            onChange={(e) => setUploadForm(prev => ({
              ...prev,
              description: e.target.value
            }))}
            rows={3}
            className="w-full p-3 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Deskripsi perubahan atau catatan versi firmware ini
          </p>
        </div>
        
        {/* File Upload Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            File Firmware
          </label>
          <div className="relative">
            <Input
              type="file"
              accept=".bin,.hex"
              onChange={handleFileUpload}
              noInfo
              className="h-11 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-pink-700 file:cursor-pointer"
              required
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Firmware global yang akan tersedia untuk semua user dengan board ini
          </p>
        </div>

        {/* File Selected Indicator */}
        {uploadForm.filename && (
          <div className="p-4 rounded-xl border border-green-200/50 dark:border-green-800/50 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                  Firmware global siap diupload
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  <strong>Nama file:</strong> {uploadForm.filename}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Akan tersedia untuk semua user dengan board type yang dipilih
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={uploading || !uploadForm.file}
          className="w-full h-12 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-medium rounded-xl shadow-sm transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Mengupload firmware global...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload Firmware Global
            </>
          )}
        </Button>

        {/* Additional Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            ℹ️ Firmware Global Repository:
          </h5>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Firmware yang Anda upload akan tersedia untuk <strong>SEMUA USER</strong> dengan board type yang sama</li>
            <li>• User akan menerima notifikasi "Firmware Terbaru" saat ada global firmware</li>
            <li>• Jika user sudah punya firmware sendiri, mereka tetap bisa pilih global firmware</li>
            <li>• Sistem akan otomatis memilih firmware terbaru (user firmware {'>'}  global firmware)</li>
          </ul>
        </div>
      </form>
    </div>
  );
}
