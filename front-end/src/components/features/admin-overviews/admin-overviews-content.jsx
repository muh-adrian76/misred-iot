// Import utility untuk konversi tanggal
import { convertDate } from "@/lib/helper";
// Import ikon-ikon dari Lucide React untuk statistik dan UI
import {
  Users, // Ikon users
  Activity, // Ikon aktivitas
  Database, // Ikon database
  Shield, // Ikon keamanan
  TrendingUp, // Ikon trend naik
  TrendingDown, // Ikon trend turun 
  Eye, // Ikon mata/view
  UserPlus, // Ikon tambah user
  Settings, // Ikon pengaturan
  BarChart3, // Ikon chart
  MapPin, // Ikon lokasi
  RefreshCw, // Ikon refresh
  Bell, // Ikon notifikasi
  AlertTriangle, // Ikon peringatan
  Wifi, // Ikon koneksi
} from "lucide-react";
// Import Link dengan view transitions
import { Link } from "next-view-transitions";
// Import Framer Motion untuk animasi
import { motion } from "framer-motion";
// Import efek glow untuk UI
import { GlowingEffect } from "@/components/ui/glowing-effect";

// Komponen konten utama untuk halaman admin overview/statistik
export default function AdminOverviewsContent({
  stats, // Data statistik sistem
  isLoading, // Status loading
  refreshing, // Status refresh
  user, // Data user admin
  handleRefresh, // Handler untuk refresh data
}) {
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
        {/* Grid skeleton untuk kartu statistik */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Generate 4 skeleton card */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse"
            >
              {/* Skeleton untuk label dan value */}
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            </div>
          ))}
        </div>
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
            Dashboard Admin
          </h1>
          {/* <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Monitor lokasi dan status semua perangkat IoT secara real-time
          </p> */}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isLoading ? "Memuat..." : "Muat Ulang"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div className="bg-card p-6 rounded-xl shadow-sm border-0 h-full flex flex-col">
            <div className="flex items-center justify-between flex-1">
              <div className="flex flex-col justify-between h-full">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Pengguna
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
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
          <div className="bg-card p-6 rounded-xl shadow-sm border-0 h-full flex flex-col">
            <div className="flex items-center justify-between flex-1">
              <div className="flex flex-col justify-between h-full">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Perangkat
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDevices}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
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
          <div className="bg-card p-6 rounded-xl shadow-sm border-0 h-full flex flex-col">
            <div className="flex items-center justify-between flex-1">
              <div className="flex flex-col justify-between h-full">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Dasbor
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDashboards}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
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
          <div className="bg-card p-6 rounded-xl shadow-sm border-0 h-full flex flex-col">
            <div className="flex items-center justify-between flex-1">
              <div className="flex flex-col justify-between h-full">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Pengguna Aktif (Online)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeUsers}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <Wifi className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.5 }}
        >
          <div className="bg-card p-6 rounded-xl shadow-sm border relative ">
            
          <GlowingEffect
            spread={35}
            glow={true}
            disabled={false}
            proximity={56}
            inactiveZone={0.08}
          /><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Menu
            </h3>
            <div className="space-y-3">
              <Link
                href="/users"
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Kelola Data Pengguna
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tambah, edit, atau hapus akun pengguna
                  </p>
                </div>
              </Link>
              <Link
                href="/maps"
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MapPin className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Lihat Peta Perangkat
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Monitor lokasi semua perangkat
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.6 }}
          className="relative rounded-xl border"
        >
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.05}
          />
          <div className="bg-card text-center p-6 rounded-xl shadow-sm border-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Pengguna Aktif Terbaru
            </h3>
            <div className="space-y-3">
              {stats.recentUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex sm:flex-row flex-col items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 sm:mr-2 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 sm:text-start">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {convertDate(user.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
