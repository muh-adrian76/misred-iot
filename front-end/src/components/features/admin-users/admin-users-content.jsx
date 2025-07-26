import { 
  Users, 
  Plus, 
  Crown,
  UserCheck,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "@/components/custom/tables/data-table";
import { createUserColumns, createUserRowActions, userBulkActions } from "./admin-users-columns";
import { useBreakpoint } from "@/hooks/use-mobile";
import { motion } from "framer-motion";

export default function AdminUsersContent({ 
  users, 
  isLoading, 
  search, 
  setSearch, 
  selectedRows,
  setSelectedRows,
  setAddUserOpen,
  openEditDialog,
  openDeleteDialog,
  handleRefresh
}) {
  const { isMobile } = useBreakpoint();

  // Create columns and row actions
  const userColumns = createUserColumns(openEditDialog, openDeleteDialog);
  const userRowActions = createUserRowActions(openEditDialog, openDeleteDialog);

  // Handle bulk delete
  const handleBulkAction = (action, selectedIds) => {
    if (action === "delete") {
      const selectedUsers = users.filter(user => selectedIds.includes(user.id));
      openDeleteDialog(selectedUsers);
    }
  };
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
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

  // Empty state component
  if (!isLoading && users.length === 0) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kelola Users
            </h1>
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
      <div className="flex flex-row items-center justify-between gap-4 backdrop-blur-enhanced rounded-2xl">
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
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Total pengguna terdaftar
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {users.filter(user => user.is_admin).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Administrator aktif
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menyelesaikan Panduan</CardTitle>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {users.filter(user => user.onboarding_completed).length}
              </div>
              <p className="text-xs text-muted-foreground">
                User yang sudah melakukan
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp Aktif</CardTitle>
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-xs">WA</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {users.filter(user => user.whatsapp_notif).length}
              </div>
              <p className="text-xs text-muted-foreground">
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
        transition={{ duration: 0.3, delay: 0.5 }}
      >
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
            />
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
