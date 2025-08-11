import { t } from "elysia";

export const getOverviewStatsSchema = {
  tags: ["Admin"],
  summary: "Ambil statistik ringkasan admin",
  description: "Mendapatkan statistik ringkasan untuk dashboard admin",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status respons", example: "success" }),
      data: t.Object({
        totalUsers: t.Number({ description: "Total jumlah pengguna", example: 156 }),
        totalDevices: t.Number({ description: "Total jumlah perangkat", example: 42 }),
        totalDashboards: t.Number({ description: "Total jumlah dashboard", example: 28 }),
        activeUsers: t.Number({ description: "Jumlah pengguna aktif (24 jam terakhir)", example: 12 }),
        onlineDevices: t.Number({ description: "Jumlah perangkat online", example: 35 }),
        totalAlarms: t.Number({ description: "Total jumlah alarm", example: 15 }),
        totalPayloads: t.Number({ description: "Total jumlah data payload", example: 1024 })
      })
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Tidak terotorisasi: Akses admin diperlukan" })
    })
  }
};

export const getRecentUsersSchema = {
  tags: ["Admin"],
  summary: "Ambil pengguna terbaru",
  description: "Mendapatkan daftar pengguna yang baru mendaftar",
  security: [{ bearerAuth: [] }],
  query: t.Object({
    limit: t.Optional(t.Number({ description: "Batas jumlah data", example: 10 }))
  }),
  response: {
    200: t.Object({
      status: t.String({ description: "Status respons", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID pengguna", example: 1 }),
        name: t.String({ description: "Nama pengguna", example: "John Doe" }),
        email: t.String({ description: "Email pengguna", example: "john@example.com" }),
        created_at: t.String({ description: "Tanggal pendaftaran", example: "2025-01-20T10:30:00Z" }),
        is_admin: t.Boolean({ description: "Status admin", example: false })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Tidak terotorisasi: Akses admin diperlukan" })
    })
  }
};

export const getDeviceLocationsSchema = {
  tags: ["Admin"],
  summary: "Ambil lokasi perangkat",
  description: "Mendapatkan lokasi semua perangkat untuk ditampilkan di peta",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status respons", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID perangkat", example: 1 }),
        name: t.String({ description: "Nama perangkat", example: "Sensor Suhu Lab A" }),
        description: t.String({ description: "Deskripsi perangkat", example: "Sensor Suhu Lab A" }),
        status: t.String({ description: "Status perangkat", example: "online" }),
        user_id: t.Number({ description: "ID pemilik perangkat", example: 1 }),
        user_name: t.String({ description: "Nama pemilik perangkat", example: "John Doe" }),
        latitude: t.Union([t.Number(), t.Null()], { description: "Koordinat lintang (latitude)", example: -7.2575 }),
        longitude: t.Union([t.Number(), t.Null()], { description: "Koordinat bujur (longitude)", example: 112.7521 }),
        address: t.Union([t.String(), t.Null()], { description: "Alamat lokasi", example: "Lab A, Gedung Utama" }),
        last_seen: t.Union([t.String(), t.Null()], { description: "Terakhir terlihat", example: "2 menit lalu" })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Tidak terotorisasi: Akses admin diperlukan" })
    })
  }
};

export const putDeviceLocationSchema = {
  tags: ["Admin"],
  summary: "Perbarui lokasi perangkat",
  description: "Memperbarui koordinat lokasi perangkat",
  security: [{ bearerAuth: [] }],
  params: t.Object({
    id: t.Number({ description: "ID perangkat yang akan diperbarui" })
  }),
  body: t.Object({
    latitude: t.Number({ description: "Koordinat lintang (latitude)", example: -7.2575 }),
    longitude: t.Number({ description: "Koordinat bujur (longitude)", example: 112.7521 }),
    address: t.Union([t.String(), t.Null()], { description: "Alamat lokasi", example: "Lab A, Gedung Utama" })
  }),
  response: {
    200: t.Object({
      status: t.String({ description: "Status respons", example: "success" }),
      message: t.String({ description: "Pesan sukses", example: "Lokasi perangkat berhasil diperbarui" })
    }),
    400: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Perangkat tidak ditemukan atau gagal diperbarui" })
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Tidak terotorisasi: Akses admin diperlukan" })
    })
  }
};

export const getSystemHealthSchema = {
  tags: ["Admin"],
  summary: "Ambil status kesehatan sistem",
  description: "Mendapatkan status kesehatan sistem",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status respons", example: "success" }),
      data: t.Object({
        status: t.String({ description: "Status keseluruhan sistem", example: "good" }),
        database: t.Boolean({ description: "Status koneksi database", example: true }),
        mqtt: t.Boolean({ description: "Status layanan MQTT", example: true }),
        websocket: t.Boolean({ description: "Status layanan WebSocket", example: true }),
        uptime: t.Number({ description: "Uptime server dalam detik", example: 86400 })
      })
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Tidak terotorisasi: Akses admin diperlukan" })
    })
  }
};

export const getAllUsersWithStatsSchema = {
  tags: ["Admin"],
  summary: "Ambil semua pengguna beserta statistik",
  description: "Mendapatkan semua pengguna beserta statistik mereka",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status respons", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID pengguna", example: 1 }),
        name: t.String({ description: "Nama pengguna", example: "John Doe" }),
        email: t.String({ description: "Email pengguna", example: "john@example.com" }),
        is_admin: t.Boolean({ description: "Status admin", example: false }),
        created_at: t.String({ description: "Tanggal pendaftaran", example: "2025-01-20T10:30:00Z" }),
        last_login: t.Union([t.String(), t.Null()], { description: "Login terakhir", example: "2025-01-23T15:45:00Z" }),
        phone: t.Union([t.String(), t.Null()], { description: "Nomor telepon", example: "083117228331" }),
        whatsapp_notif: t.Boolean({ description: "Status notifikasi WhatsApp", example: true }),
        onboarding_completed: t.Boolean({ description: "Status onboarding", example: true }),
        device_count: t.Number({ description: "Jumlah perangkat", example: 3 }),
        dashboard_count: t.Number({ description: "Jumlah dashboard", example: 2 }),
        alarm_count: t.Number({ description: "Jumlah alarm", example: 5 })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Tidak terotorisasi: Akses admin diperlukan" })
    })
  }
};

export const getAllDevicesWithStatsSchema = {
  tags: ["Admin"],
  summary: "Ambil semua perangkat beserta statistik",
  description: "Mendapatkan semua perangkat beserta statistik mereka",
  security: [{ bearerAuth: [] }],
  response: {
    200: t.Object({
      status: t.String({ description: "Status respons", example: "success" }),
      data: t.Array(t.Object({
        id: t.Number({ description: "ID perangkat", example: 1 }),
        description: t.String({ description: "Deskripsi perangkat", example: "Sensor Suhu Lab A" }),
        board_type: t.Union([t.String(), t.Null()], { description: "Tipe board", example: "ESP32" }),
        protocol: t.String({ description: "Protokol komunikasi", example: "HTTP" }),
        status: t.String({ description: "Status perangkat", example: "online" }),
        created_at: t.String({ description: "Tanggal dibuat", example: "2025-01-20T10:30:00Z" }),
        latitude: t.Union([t.Number(), t.Null()], { description: "Koordinat lintang (latitude)", example: -7.2575 }),
        longitude: t.Union([t.Number(), t.Null()], { description: "Koordinat bujur (longitude)", example: 112.7521 }),
        address: t.Union([t.String(), t.Null()], { description: "Alamat lokasi", example: "Lab A, Gedung Utama" }),
        user_name: t.String({ description: "Nama pemilik", example: "John Doe" }),
        user_email: t.String({ description: "Email pemilik", example: "john@example.com" }),
        datastream_count: t.Number({ description: "Jumlah datastream", example: 5 }),
        payload_count: t.Number({ description: "Jumlah payload", example: 1024 }),
        last_data_time: t.Union([t.String(), t.Null()], { description: "Waktu data terakhir", example: "2025-01-23T15:45:00Z" })
      }))
    }),
    403: t.Object({
      status: t.String({ example: "error" }),
      message: t.String({ example: "Tidak terotorisasi: Akses admin diperlukan" })
    })
  }
};
