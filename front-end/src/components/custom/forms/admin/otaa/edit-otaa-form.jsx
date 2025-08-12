// Edit OTAA Form Component - form untuk mengedit firmware yang sudah ada
// Fitur: ubah board type, ubah versi, ganti file, validasi, modal dialog
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, RefreshCw, FileCode, AlertCircle, CheckCircle, Cpu, Edit } from "lucide-react";

export default function EditOTAAForm({
  // State dialog dan handler
  editFormOpen, // Apakah dialog edit terbuka
  setEditFormOpen, // Setter dialog
  firmwareToEdit, // Data firmware yang akan diedit
  setFirmwareToEdit, // Setter data firmware
  handleEditFirmware, // Handler submit perubahan firmware
  boardTypes, // Daftar board type dari database (opsional)
  boardOptions, // Daftar board type default (fallback)
}) {
  // Gunakan boardTypes dari database jika ada, jika tidak gunakan boardOptions default
  const availableBoardTypes = (boardTypes && boardTypes.length > 0) ? boardTypes : boardOptions;
  // State lokal form edit
  const [editForm, setEditForm] = useState({
    board_type: "",
    firmware_version: "",
    file: null,
    filename: "",
  });
  const [updating, setUpdating] = useState(false);

  // Isi ulang form saat firmwareToEdit berubah
  useEffect(() => {
    if (firmwareToEdit) {
      setEditForm({
        board_type: firmwareToEdit.board_type || "",
        firmware_version: firmwareToEdit.firmware_version || "",
        file: null,
        filename: "",
      });
    }
  }, [firmwareToEdit]);

  // Handler memilih file firmware + validasi
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

  // Validasi ekstensi file (hanya .bin dan .hex)
    const allowedExt = ['.bin', '.hex'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExt.includes(ext)) {
      alert("Hanya file .bin atau .hex yang diperbolehkan");
      return;
    }

  // Validasi ukuran file maksimal 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      return;
    }

    setEditForm(prev => ({
      ...prev,
      file: file,
      filename: file.name
    }));
  };

  // Submit perubahan firmware
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.board_type.trim()) {
      alert("Board type wajib dipilih");
      return;
    }

    if (!editForm.firmware_version.trim()) {
      alert("Versi firmware wajib diisi");
      return;
    }

    setUpdating(true);

    try {
      const updateData = {
        id: firmwareToEdit.id,
        board_type: editForm.board_type,
        firmware_version: editForm.firmware_version.trim(),
      };

      // Jika ada file baru, convert ke base64
      if (editForm.file) {
        const fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(editForm.file);
        });

        updateData.filename = editForm.filename;
        updateData.file_base64 = fileBase64;
      }

      await handleEditFirmware(updateData);
      
      // Reset form dan tutup dialog
      setEditForm({
        board_type: "",
        firmware_version: "",
        file: null,
        filename: "",
      });
      setEditFormOpen(false);
      setFirmwareToEdit(null);
    } catch (error) {
  console.error("Kesalahan memperbarui firmware:", error);
    } finally {
      setUpdating(false);
    }
  };

  // Batalkan proses edit
  const handleCancel = () => {
    setEditForm({
      board_type: "",
      firmware_version: "",
      file: null,
      filename: "",
    });
    setEditFormOpen(false);
    setFirmwareToEdit(null);
  };

  return (
    <Dialog open={editFormOpen} onOpenChange={setEditFormOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Firmware
          </DialogTitle>
          <DialogDescription>
            Ubah informasi firmware yang sudah ada. File firmware opsional - kosongkan jika tidak ingin mengganti.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Header info */}
          <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
              <FileCode className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                Edit Firmware: {firmwareToEdit?.firmware_url?.split('/').pop()}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Ubah metadata firmware atau ganti dengan file baru jika diperlukan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Board Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Board Type
                </label>
                <Select 
                  value={editForm.board_type} 
                  onValueChange={(value) => setEditForm(prev => ({
                    ...prev,
                    board_type: value
                  }))}
                >
                  <SelectTrigger className="h-11 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Pilih board type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBoardTypes && availableBoardTypes.length > 0 ? (
                      availableBoardTypes.map((board) => (
                        <SelectItem key={board} value={board}>
                          <div className="flex items-center gap-2">
                            <Cpu className="w-3 h-3" />
                            <span>{board}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        Tidak ada board type tersedia
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Pilih jenis board microcontroller
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
                  placeholder="Contoh: 1.0.1, 2.1.4"
                  value={editForm.firmware_version}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    firmware_version: e.target.value
                  }))}
                  noInfo
                  className="h-11 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Versi firmware yang akan diupdate (gunakan semantic versioning)
                </p>
              </div>
            </div>
            
            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                File Firmware (Opsional)
              </label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".bin,.hex"
                  onChange={handleFileSelect}
                  noInfo
                  className="h-11 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-blue-700 file:cursor-pointer"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Kosongkan jika tidak ingin mengganti file. Format: .bin, .hex (Maksimal 10MB)
              </p>
            </div>

            {/* File Selected Indicator */}
            {editForm.filename && (
              <div className="p-4 rounded-xl border border-green-200/50 dark:border-green-800/50 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      File baru dipilih
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      <strong>Nama file:</strong> {editForm.filename}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      File ini akan menggantikan file firmware yang lama
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updating}
                className="flex-1 h-12 rounded-xl"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={updating || !editForm.board_type || !editForm.firmware_version.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Memperbarui firmware...
                  </>
                ) : (
                  <>
                    <Edit className="w-5 h-5 mr-2" />
                    Perbarui Firmware
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
