// Menggunakan "use client" untuk komponen React sisi klien
"use client";
// Import ikon-ikon dari Lucide React untuk UI
import {
  Users,
  Plus,
  Crown,
  UserCheck,
  RefreshCw,
  UserPlus,
  phone,
} from "lucide-react";
// Import komponen UI dasar
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Import komponen DataTable kustom untuk menampilkan data dalam bentuk tabel
import DataTable from "@/components/custom/tables/data-table";
// Import konfigurasi kolom dan aksi untuk tabel user
import {
  createUserColumns,
  createUserRowActions,
  userBulkActions,
} from "./admin-users-columns";
// Import hook untuk deteksi breakpoint layar
import { useBreakpoint } from "@/hooks/use-mobile";
// Import Framer Motion untuk animasi
import { motion } from "framer-motion";
// Import efek glow untuk kartu
import { GlowingEffect } from "@/components/ui/glowing-effect";

// Komponen konten utama untuk halaman admin users
export default function AdminUsersContent({
  users, // Data array users
  isLoading, // Status loading
  search, // State pencarian
  setSearch, // Setter untuk pencarian
  selectedRows, // Baris yang dipilih
  setSelectedRows, // Setter untuk baris yang dipilih
  setAddUserOpen, // Setter untuk dialog tambah user
  openEditDialog, // Fungsi untuk membuka dialog edit
  openDeleteDialog, // Fungsi untuk membuka dialog hapus
  handleRefresh, // Fungsi untuk refresh data
}) {
  // Hook untuk mendeteksi apakah dalam mode mobile
  const { isMobile } = useBreakpoint();

  // Buat konfigurasi kolom dan aksi baris dengan handler
  const userColumns = createUserColumns(openEditDialog, openDeleteDialog);
  const userRowActions = createUserRowActions(openEditDialog, openDeleteDialog);

  // Handler untuk aksi bulk (operasi pada multiple users)
  const handleBulkAction = (action, selectedIds) => {
    if (action === "delete") {
      // Filter users yang dipilih berdasarkan ID
      const selectedUsers = users.filter((user) =>
        selectedIds.includes(user.id)
      );
      // Buka dialog hapus untuk users yang dipilih
      openDeleteDialog(selectedUsers);
    }
  };
  
  // Tampilkan loading state jika sedang loading
  // Tampilkan loading state jika sedang loading
  if (isLoading) {
    return (
      // Container dengan padding dan spacing untuk loading state
      <div className="p-6 space-y-6">
        {/* Animasi pulse untuk header */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        {/* Card dengan skeleton untuk data loading */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {/* Generate 5 skeleton item untuk user list */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center space-x-4 animate-pulse"
              >
                {/* Skeleton avatar */}
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                {/* Skeleton konten */}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Komponen empty state - ditampilkan jika tidak ada data user
  if (!isLoading && users.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kelola Users</h1>
            <p className="text-muted-foreground mt-1">
              Tambah, edit, dan hapus akun user yang terdaftar
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button onClick={() => setAddUserOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah User
            </Button>
          </div>
        </div>

        {/* Empty State */}
        <motion.div
          className="flex items-center justify-center h-[400px]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
        >
          <div className="flex flex-col items-center text-sm text-center gap-4 w-xl max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-2"
            >
              <Users className="w-12 h-12 text-primary" />
            </motion.div>
            <h2 className="text-xl font-semibold">Belum ada users</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Users digunakan untuk mengelola akun pengguna sistem IoT.
              Tambahkan user pertama untuk memulai.
            </p>
            <Button
              onClick={() => setAddUserOpen(true)}
              className="gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Tambah User Pertama
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 1 }}
        className="flex flex-row items-center justify-between gap-4 backdrop-blur-enhanced rounded-2xl"
      >
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Kelola Users
          </h1>
          {/* <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Monitor lokasi dan status semua perangkat IoT secara real-time
          </p> */}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Loading..." : "Refresh"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Statistics Cards */}
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {users.length}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Total pengguna terdaftar
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
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {users.filter((user) => user.is_admin).length}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Administrator aktif
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
              <CardTitle className="text-sm font-medium">
                Menyelesaikan Panduan
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {users.filter((user) => user.onboarding_completed).length}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                User yang sudah melakukan
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
              <CardTitle className="text-sm font-medium">
                WhatsApp Aktif
              </CardTitle>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-xs">
                  WA
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {users.filter((user) => user.whatsapp_notif).length}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Notifikasi WhatsApp aktif
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Data Table */}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar Users ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              content="User"
              columns={userColumns}
              data={users}
              loading={isLoading}
              isMobile={isMobile}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              onAdd={() => setAddUserOpen(true)}
              rowActions={userRowActions}
              onDelete={(selected) => {
                if (Array.isArray(selected)) {
                  openDeleteDialog(
                    selected.map((id) => users.find((u) => u.id === id))
                  );
                } else {
                  openDeleteDialog(selected);
                }
              }}
              noDataText="Belum ada user yang terdaftar"
              searchPlaceholder="Cari berdasarkan nama atau email..."
              limit={10}
            glowingTable={true}
            glowingHeaders={true}
            glowingCells={true}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
