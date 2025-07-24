import { t } from "elysia";

export const getOverviewStatsSchema = {
  tags: ["Admin"],
  summary: "Get admin overview statistics",
  description: "Mendapatkan statistik overview untuk admin dashboard",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status response", example: "success" }),
      data: t.Object({
        totalUsers: t.Number({ description: "Total jumlah users", example: 156 }),
        totalDevices: t.Number({ description: "Total jumlah devices", example: 42 }),
        totalDashboards: t.Number({ description: "Total jumlah dashboards", example: 28 }),
        activeUsers: t.Number({ description: "Jumlah users aktif (24 jam terakhir)", example: 12 }),
        onlineDevices: t.Number({ description: "Jumlah devices online", example: 35 }),
        totalAlarms: t.Number({ description: "Total jumlah alarms", example: 15 }),
        totalPayloads: t.Number({ description: "Total jumlah data payloads", example: 1024 })
      })
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Unauthorized: Admin access required" })
    })
  }
};

export const getRecentUsersSchema = {
  tags: ["Admin"],
  summary: "Get recent users",
  description: "Mendapatkan daftar users yang baru saja mendaftar",
  security: [{ bearerAuth: [] }],
  query: t.Object({
    limit: t.Optional(t.Number({ description: "Jumlah limit data", example: 10 }))
  }),
  response: {
    200: t.Object({
      status: t.String({ description: "Status response", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID user", example: 1 }),
        name: t.String({ description: "Nama user", example: "John Doe" }),
        email: t.String({ description: "Email user", example: "john@example.com" }),
        created_at: t.String({ description: "Tanggal pendaftaran", example: "2025-01-20T10:30:00Z" }),
        is_admin: t.Boolean({ description: "Status admin", example: false })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Unauthorized: Admin access required" })
    })
  }
};

export const getDeviceLocationsSchema = {
  tags: ["Admin"],
  summary: "Get device locations",
  description: "Mendapatkan lokasi semua devices untuk ditampilkan di peta",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status response", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID device", example: 1 }),
        name: t.String({ description: "Nama device", example: "Sensor Suhu Lab A" }),
        description: t.String({ description: "Deskripsi device", example: "Sensor Suhu Lab A" }),
        status: t.String({ description: "Status device", example: "online" }),
        user_id: t.Number({ description: "ID pemilik device", example: 1 }),
        user_name: t.String({ description: "Nama pemilik device", example: "John Doe" }),
        latitude: t.Union([t.Number(), t.Null()], { description: "Koordinat latitude", example: -7.2575 }),
        longitude: t.Union([t.Number(), t.Null()], { description: "Koordinat longitude", example: 112.7521 }),
        address: t.Union([t.String(), t.Null()], { description: "Alamat lokasi", example: "Lab A, Gedung Utama" }),
        last_seen: t.Union([t.String(), t.Null()], { description: "Terakhir terlihat", example: "2 menit lalu" })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Unauthorized: Admin access required" })
    })
  }
};

export const putDeviceLocationSchema = {
  tags: ["Admin"],
  summary: "Update device location",
  description: "Update lokasi koordinat device",
  security: [{ bearerAuth: [] }],
  params: t.Object({
    id: t.Number({ description: "ID device yang akan diupdate" })
  }),
  body: t.Object({
    latitude: t.Number({ description: "Koordinat latitude", example: -7.2575 }),
    longitude: t.Number({ description: "Koordinat longitude", example: 112.7521 }),
    address: t.Union([t.String(), t.Null()], { description: "Alamat lokasi", example: "Lab A, Gedung Utama" })
  }),
  response: {
    200: t.Object({
      status: t.String({ description: "Status response", example: "success" }),
      message: t.String({ description: "Pesan sukses", example: "Lokasi device berhasil diperbarui" })
    }),
    400: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Device tidak ditemukan atau gagal diperbarui" })
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Unauthorized: Admin access required" })
    })
  }
};

export const getSystemHealthSchema = {
  tags: ["Admin"],
  summary: "Get system health status",
  description: "Mendapatkan status kesehatan sistem",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status response", example: "success" }),
      data: t.Object({
        status: t.String({ description: "Status keseluruhan sistem", example: "good" }),
        database: t.Boolean({ description: "Status koneksi database", example: true }),
        mqtt: t.Boolean({ description: "Status MQTT service", example: true }),
        websocket: t.Boolean({ description: "Status WebSocket service", example: true }),
        uptime: t.Number({ description: "Uptime server dalam detik", example: 86400 })
      })
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Unauthorized: Admin access required" })
    })
  }
};

export const getAllUsersWithStatsSchema = {
  tags: ["Admin"],
  summary: "Get all users with statistics",
  description: "Mendapatkan semua users beserta statistik mereka",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status response", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID user", example: 1 }),
        name: t.String({ description: "Nama user", example: "John Doe" }),
        email: t.String({ description: "Email user", example: "john@example.com" }),
        is_admin: t.Boolean({ description: "Status admin", example: false }),
        created_at: t.String({ description: "Tanggal pendaftaran", example: "2025-01-20T10:30:00Z" }),
        last_login: t.Union([t.String(), t.Null()], { description: "Login terakhir", example: "2025-01-23T15:45:00Z" }),
        phone: t.Union([t.String(), t.Null()], { description: "Nomor telepon", example: "083117228331" }),
        whatsapp_notif: t.Boolean({ description: "Status notifikasi WhatsApp", example: true }),
        onboarding_completed: t.Boolean({ description: "Status onboarding", example: true }),
        device_count: t.Number({ description: "Jumlah devices", example: 3 }),
        dashboard_count: t.Number({ description: "Jumlah dashboards", example: 2 }),
        alarm_count: t.Number({ description: "Jumlah alarms", example: 5 })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Unauthorized: Admin access required" })
    })
  }
};

export const getAllDevicesWithStatsSchema = {
  tags: ["Admin"],
  summary: "Get all devices with statistics",
  description: "Mendapatkan semua devices beserta statistik mereka",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status response", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID device", example: 1 }),
        description: t.String({ description: "Deskripsi device", example: "Sensor Suhu Lab A" }),
        board_type: t.Union([t.String(), t.Null()], { description: "Tipe board", example: "ESP32" }),
        protocol: t.String({ description: "Protokol komunikasi", example: "HTTP" }),
        status: t.String({ description: "Status device", example: "online" }),
        created_at: t.String({ description: "Tanggal dibuat", example: "2025-01-20T10:30:00Z" }),
        latitude: t.Union([t.Number(), t.Null()], { description: "Koordinat latitude", example: -7.2575 }),
        longitude: t.Union([t.Number(), t.Null()], { description: "Koordinat longitude", example: 112.7521 }),
        address: t.Union([t.String(), t.Null()], { description: "Alamat lokasi", example: "Lab A, Gedung Utama" }),
        user_name: t.String({ description: "Nama pemilik", example: "John Doe" }),
        user_email: t.String({ description: "Email pemilik", example: "john@example.com" }),
        datastream_count: t.Number({ description: "Jumlah datastreams", example: 5 }),
        payload_count: t.Number({ description: "Jumlah data payloads", example: 1024 }),
        last_data_time: t.Union([t.String(), t.Null()], { description: "Waktu data terakhir", example: "2025-01-23T15:45:00Z" })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Unauthorized: Admin access required" })
    })
  }
};
