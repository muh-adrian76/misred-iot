// Admin OTAA Content Component - komponen konten utama untuk manajemen firmware
// Fitur: header modern, pencarian/filter, daftar firmware, form upload dengan animasi
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { 
  Search, 
  Download, 
  Trash2, 
  Upload, 
  FileCode, 
  Cpu, 
  HardDrive,
  RefreshCw,
  Calendar,
  User,
  MemoryStick,
  CheckCircle,
  AlertCircle,
  Edit
} from "lucide-react";
import { convertDate } from "@/lib/helper";
import AddOTAAForm from "@/components/custom/forms/admin/otaa/add-otaa-form";
import EditOTAAForm from "@/components/custom/forms/admin/otaa/edit-otaa-form";
import DeleteOTAAForm from "@/components/custom/forms/admin/otaa/delete-otaa-form";
import { motion } from "framer-motion";

export default function AdminOTAAContent({
  // Data props - data firmware dan tipe board
  filteredFirmwares, // Array firmware yang sudah difilter
  boardTypes, // Array tipe board yang tersedia
  boardOptions, // Array board options default dari device-logic
  devices, // Array devices untuk device count
  
  // Loading states - status loading untuk UI feedback
  loading, // Status loading data firmware
  uploading, // Status uploading firmware baru
  
  // Search and filter - kontrol pencarian dan filter
  searchTerm, // Term pencarian saat ini
  setSearchTerm, // Setter untuk mengubah term pencarian
  selectedBoardType, // Tipe board yang dipilih untuk filter
  setSelectedBoardType, // Setter untuk mengubah filter board type
  
  // Upload form - kontrol form upload firmware
  uploadForm, // State form upload
  setUploadForm, // Setter untuk form upload
  handleFileUpload, // Handler untuk upload file
  handleUploadFirmware, // Handler untuk submit upload
  
  // Edit form - kontrol form edit firmware
  editFormOpen, // State untuk dialog edit firmware
  setEditFormOpen, // Setter untuk dialog edit firmware
  firmwareToEdit, // Firmware yang akan diedit
  setFirmwareToEdit, // Setter untuk firmware yang akan diedit
  handleEditFirmware, // Handler untuk submit edit firmware
  
  // Delete form - kontrol form delete firmware
  deleteDialogOpen, // State untuk dialog delete firmware
  setDeleteDialogOpen, // Setter untuk dialog delete firmware
  firmwareToDelete, // Firmware yang akan dihapus
  setFirmwareToDelete, // Setter untuk firmware yang akan dihapus
  handleDeleteConfirm, // Handler untuk konfirmasi delete firmware
  
  // Actions - fungsi aksi untuk firmware
  fetchFirmwares, // Fungsi untuk refresh data firmware
  handleDownload, // Handler untuk download firmware
  handleDeleteStart, // Handler untuk mulai hapus firmware
  handleEditStart, // Handler untuk mulai edit firmware
}) {
  return (
    <div className="space-y-4 lg:space-y-6 admin-otaa-content min-h-screen">
      {/* Header dengan styling yang konsisten dengan halaman lain */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1 }}
        className="flex flex-row items-center justify-between gap-4 backdrop-blur-enhanced rounded-2xl"
      >
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Over-The-Air Updates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Kelola firmware untuk update perangkat IoT secara remote
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchFirmwares}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {loading ? "Loading..." : "Refresh"}
            </span>
          </Button>
        </div>
      </motion.div>

      {/* Statistics Cards seperti di halaman users */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.1 }}
          className="relative rounded-xl border h-full"
        >
          <GlowingEffect
            spread={30}
            glow={true}
            disabled={false}
            proximity={48}
            inactiveZone={0.1}
          />
          <Card className="relative overflow-hidden border-0 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Firmware</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {filteredFirmwares.length}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Firmware tersedia
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.2 }}
          className="relative rounded-xl border h-full"
        >
          <GlowingEffect
            spread={35}
            glow={true}
            disabled={false}
            proximity={56}
            inactiveZone={0.05}
          />
          <Card className="relative overflow-hidden border-0 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Board Types</CardTitle>
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {boardTypes.length}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Jenis board tersedia
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.3 }}
          className="relative rounded-xl border h-full"
        >
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
          />
          <Card className="relative overflow-hidden border-0 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Update Ready</CardTitle>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {filteredFirmwares.length}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Siap untuk deploy
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.4 }}
          className="relative rounded-xl border h-full"
        >
          <GlowingEffect
            spread={45}
            glow={true}
            disabled={false}
            proximity={72}
            inactiveZone={0.02}
          />
          <Card className="relative overflow-hidden border-0 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <MemoryStick className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                {(filteredFirmwares.length * 0.5).toFixed(1)}MB
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Storage terpakai
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Tabs dengan glowing effect */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1.5 }}
        className="relative rounded-xl border"
      >
        <GlowingEffect
          spread={45}
          glow={true}
          disabled={false}
          proximity={72}
          inactiveZone={0.02}
        />
        <Tabs defaultValue="manage" className="bg-card backdrop-blur-enhanced rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="px-4 lg:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/50 dark:to-gray-600/50">
            <TabsList className="grid w-full grid-cols-2 backdrop-blur-sm">
              <TabsTrigger value="manage" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <HardDrive className="w-4 h-4" />
                <span className="hidden sm:inline">Kelola Firmware</span>
                <span className="sm:hidden">Kelola</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload Firmware</span>
                <span className="sm:hidden">Upload</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Manage Firmware Tab dengan desain yang diperbaiki */}
          <TabsContent value="manage" className="p-4 lg:p-6 space-y-6 m-0">
            {/* Enhanced Search and Filter */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-4 lg:p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filter & Pencarian
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Cari firmware, versi, atau board type..."
                      value={searchTerm}
                      noInfo
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm"
                    />
                  </div>
                </div>
                <Select value={selectedBoardType} onValueChange={setSelectedBoardType}>
                  <SelectTrigger className="h-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-xl shadow-sm">
                    <SelectValue placeholder="Semua Board Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Board Type</SelectItem>
                    {boardTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enhanced Firmware List */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="px-4 lg:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/50 dark:to-gray-600/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-pink-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Daftar Firmware ({filteredFirmwares.length})
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-4 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Memuat data firmware...
                      </span>
                    </div>
                  </div>
                ) : filteredFirmwares.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mb-6">
                      <FileCode className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Tidak ada firmware ditemukan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                      {searchTerm 
                        ? "Coba ubah kata kunci pencarian atau filter yang digunakan" 
                        : "Belum ada firmware yang diupload ke sistem"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredFirmwares.map((firmware, index) => (
                      <motion.div
                        key={firmware.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="group p-4 lg:p-5 border border-gray-200 dark:border-gray-700 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:border-gray-300 dark:hover:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                                <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate text-base lg:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {firmware.firmware_url.split('/').pop()}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="shrink-0 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                    v{firmware.firmware_version}
                                  </Badge>
                                  <Badge variant="secondary" className="shrink-0 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                                    <Cpu className="w-3 h-3 mr-1" />
                                    {firmware.board_type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {convertDate(firmware.updated_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                User ID: {firmware.user_id}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownload(firmware.board_type, firmware.firmware_url.split('/').pop())}
                              title="Download firmware"
                              className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-xl"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditStart(firmware)}
                              title="Edit firmware"
                              className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 rounded-xl"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteStart(firmware)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-xl"
                              title="Hapus firmware"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Upload Firmware Tab dengan styling yang diperbaiki */}
          <TabsContent value="upload" className="p-4 lg:p-6 m-0">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="px-4 lg:px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-700/50 dark:to-gray-600/50">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-pink-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Firmware Baru
                  </h3>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <AddOTAAForm
                  uploadForm={uploadForm}
                  setUploadForm={setUploadForm}
                  handleFileUpload={handleFileUpload}
                  handleUploadFirmware={handleUploadFirmware}
                  uploading={uploading}
                  boardOptions={boardOptions}
                  boardTypes={boardTypes}
                  devices={devices}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Edit OTAA Form Dialog */}
      <EditOTAAForm
        editFormOpen={editFormOpen}
        setEditFormOpen={setEditFormOpen}
        firmwareToEdit={firmwareToEdit}
        setFirmwareToEdit={setFirmwareToEdit}
        handleEditFirmware={handleEditFirmware}
        boardTypes={boardTypes}
        boardOptions={boardOptions}
      />

      {/* Delete OTAA Form Dialog */}
      <DeleteOTAAForm
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        firmwareToDelete={firmwareToDelete}
        handleDeleteConfirm={handleDeleteConfirm}
        handleDeleteCancel={() => {
          setDeleteDialogOpen(false);
          setFirmwareToDelete(null);
        }}
      />
    </div>
  );
}
