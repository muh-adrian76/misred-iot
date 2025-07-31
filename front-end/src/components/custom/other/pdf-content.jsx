/**
 * Komponen React PDF yang Disempurnakan untuk Sistem MiSREd IoT
 * Menghasilkan dokumen PDF yang indah menggunakan @react-pdf/renderer
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatDateTime } from "../../../lib/export-utils";

// Gaya yang disempurnakan untuk PDF dengan desain modern
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 0,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  // Header dengan efek gradient simulasi
  header: {
    backgroundColor: "#dc3545",
    background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
    color: "white",
    padding: 15,
    marginBottom: 0,
    alignItems: "center",
    position: "relative",
  },

  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: "#ffffff",
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },

  logoSubtext: {
    fontSize: 8,
    opacity: 0.8,
    marginLeft: 8,
    fontStyle: "italic",
  },

  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
  },

  subtitle: {
    fontSize: 11,
    opacity: 0.9,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Kontainer konten dengan padding
  content: {
    padding: 20,
    flex: 1,
  },

  // Bagian metadata yang disempurnakan
  metadata: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    borderLeft: "4 solid #dc3545",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },

  metadataTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 8,
    textAlign: "center",
  },

  metadataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  metadataItem: {
    flexDirection: "column",
    minWidth: "45%",
    backgroundColor: "#ffffff",
    padding: 6,
    borderRadius: 4,
    border: "1 solid #e9ecef",
  },

  metadataLabel: {
    fontSize: 7,
    color: "#6c757d",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  metadataValue: {
    fontSize: 9,
    color: "#dc3545",
    fontWeight: "bold",
  },

  // Bagian statistik
  statisticsContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 8,
  },

  statisticsCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    border: "1 solid #e9ecef",
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
  },

  statisticsNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 2,
  },

  statisticsLabel: {
    fontSize: 7,
    color: "#6c757d",
    textAlign: "center",
  },

  // Tabel yang disempurnakan
  tableContainer: {
    marginBottom: 15,
  },

  tableTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1 solid #dc3545",
  },

  table: {
    display: "table",
    width: "auto",
    borderRadius: 4,
    overflow: "hidden",
    border: "1 solid #dee2e6",
  },

  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },

  tableRowEven: {
    backgroundColor: "#f8f9fa",
  },

  tableRowOdd: {
    backgroundColor: "#ffffff",
  },

  tableColHeader: {
    width: "20%",
    backgroundColor: "#dc3545",
    padding: 6,
    borderRight: "1 solid #c82333",
  },

  tableCol: {
    width: "20%",
    padding: 4,
    borderRight: "1 solid #dee2e6",
    minHeight: 20,
    justifyContent: "center",
  },

  tableCellHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  tableCell: {
    fontSize: 8,
    color: "#495057",
    textAlign: "center",
  },

  tableCellValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#dc3545",
    textAlign: "center",
  },

  // Footer yang disempurnakan
  footer: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    textAlign: "center",
    borderTop: "2 solid #dee2e6",
    marginTop: "auto",
  },

  footerLogo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc3545",
    marginBottom: 8,
  },

  footerText: {
    fontSize: 8,
    color: "#6c757d",
    marginBottom: 3,
  },

  footerCopyright: {
    fontSize: 7,
    color: "#adb5bd",
    marginTop: 5,
  },

  // Elemen dekoratif
  divider: {
    height: 3,
    backgroundColor: "#dc3545",
    marginVertical: 20,
    borderRadius: 2,
    background: "linear-gradient(90deg, #dc3545 0%, #c82333 50%, #dc3545 100%)",
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "#dee2e6",
    marginVertical: 15,
    opacity: 0.5,
  },

  // Gaya Peringatan/Pesan
  alertBox: {
    backgroundColor: "#fff3cd",
    border: "1 solid #ffeeba",
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
  },

  alertText: {
    fontSize: 9,
    color: "#856404",
  },

  // Indikator status
  statusHigh: {
    backgroundColor: "#dc3545",
    color: "white",
    padding: "3 8",
    borderRadius: 12,
    fontSize: 8,
    fontWeight: "bold",
  },

  statusMedium: {
    backgroundColor: "#ffc107",
    color: "#212529",
    padding: "3 8",
    borderRadius: 12,
    fontSize: 8,
    fontWeight: "bold",
  },

  statusLow: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "3 8",
    borderRadius: 12,
    fontSize: 8,
    fontWeight: "bold",
  },
});

/**
 * Dokumen PDF Ekspor Datastream yang Disempurnakan
 */
export const DatastreamPDFDocument = ({ datastream, data }) => {
  // Urutkan data dari yang terlama ke yang terbaru
  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a.device_time || a.created_at);
    const dateB = new Date(b.device_time || b.created_at);
    return dateA.getTime() - dateB.getTime();
  });

  // Hitung statistik
  const values = sortedData
    .map((item) => parseFloat(item.value))
    .filter((v) => !isNaN(v));
  const statistics = {
    total: sortedData.length,
    average:
      values.length > 0
        ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
        : "T/A",
    max: values.length > 0 ? Math.max(...values).toFixed(2) : "T/A",
    min: values.length > 0 ? Math.min(...values).toFixed(2) : "T/A",
  };

  const metadata = {
    "ID Perangkat": datastream.device_id,
    "Nama Perangkat":
      datastream.device_description || `Perangkat ${datastream.device_id}`,
    Datastream: datastream.description,
    "Total Rekaman": `${sortedData.length} titik data`,
    "Rentang Tanggal":
      sortedData.length > 0
        ? `${formatDateTime(sortedData[0].device_time || sortedData[0].created_at)} - ${formatDateTime(sortedData[sortedData.length - 1].device_time || sortedData[sortedData.length - 1].created_at)}`
        : "Tidak ada data",
    Dibuat: formatDateTime(new Date().toISOString()),
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header yang Disempurnakan */}
        {/* <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image src={"./web-logo.svg"} />
            <Text style={styles.logoText}>MiSREd IoT</Text>
          </View>
          <Text style={styles.title}>Laporan Ekspor Data</Text>
          <Text style={styles.subtitle}>
            {datastream.description} • Sistem Pemantauan
          </Text>
        </View> */}

        <View style={styles.content}>
          {/* Metadata yang Disempurnakan */}
          <View style={styles.metadata}>
            <Text style={styles.metadataTitle}>Informasi Laporan</Text>
            <View style={styles.metadataGrid}>
              {Object.entries(metadata).map(([label, value], index) => (
                <View key={index} style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>{label}</Text>
                  <Text style={styles.metadataValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Kartu Statistik */}
          {values.length > 0 && (
            <View style={styles.statisticsContainer}>
              <View style={styles.statisticsCard}>
                <Text style={styles.statisticsNumber}>{statistics.total}</Text>
                <Text style={styles.statisticsLabel}>Total Rekaman</Text>
              </View>
              <View style={styles.statisticsCard}>
                <Text style={styles.statisticsNumber}>
                  {statistics.average}
                </Text>
                <Text style={styles.statisticsLabel}>Nilai Rata-rata</Text>
              </View>
              <View style={styles.statisticsCard}>
                <Text style={styles.statisticsNumber}>{statistics.max}</Text>
                <Text style={styles.statisticsLabel}>Nilai Maksimum</Text>
              </View>
              <View style={styles.statisticsCard}>
                <Text style={styles.statisticsNumber}>{statistics.min}</Text>
                <Text style={styles.statisticsLabel}>Nilai Minimum</Text>
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Tabel yang Disempurnakan */}
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Rekaman Data Sensor</Text>

            <View style={styles.table}>
              {/* Header Tabel */}
              <View style={styles.tableRow}>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Tanggal dan Waktu</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>UID Perangkat</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Deskripsi</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Datastream</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Nilai</Text>
                </View>
              </View>

              {/* Baris Tabel dengan warna bergantian */}
              {sortedData.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                >
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {formatDateTime(item.device_time || item.created_at)}
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{datastream.device_id}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {datastream.device_description ||
                        `Perangkat ${datastream.device_id}`}
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {datastream.description}
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCellValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer yang Disempurnakan */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>MiSREd IoT</Text>
          <Text style={styles.footerText}>
            Sistem Pemantauan & Analitik Lanjutan
          </Text>
          <Text style={styles.footerText}>
            Dokumen ini dibuat secara otomatis pada {formatDateTime(new Date().toISOString())}
          </Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} MiSREd IoT. Semua hak dilindungi.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Dokumen PDF Riwayat Notifikasi yang Disempurnakan
 */
export const NotificationHistoryPDFDocument = ({
  notifications,
  timeRange,
}) => {
  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = new Date(a.triggered_at);
    const dateB = new Date(b.triggered_at);
    return dateB.getTime() - dateA.getTime(); // Terbaru dulu untuk notifikasi
  });

  // Hitung statistik notifikasi
  const severityCount = {
    high: sortedNotifications.filter(
      (n) =>
        n.severity === "high" ||
        n.alarm_description?.toLowerCase().includes("critical")
    ).length,
    medium: sortedNotifications.filter(
      (n) =>
        n.severity === "medium" ||
        n.alarm_description?.toLowerCase().includes("warning")
    ).length,
    low:
      sortedNotifications.length -
      sortedNotifications.filter(
        (n) =>
          n.severity === "high" ||
          n.alarm_description?.toLowerCase().includes("critical")
      ).length -
      sortedNotifications.filter(
        (n) =>
          n.severity === "medium" ||
          n.alarm_description?.toLowerCase().includes("warning")
      ).length,
  };

  const timeRangeText =
    {
      today: "Hari Ini",
      week: "Minggu Ini",
      month: "Bulan Ini",
      all: "Semua Waktu",
    }[timeRange] || "Rentang Khusus";

  const metadata = {
    "Periode Waktu": timeRangeText,
    "Total Notifikasi": `${sortedNotifications.length} peringatan`,
    "Prioritas Tinggi": `${severityCount.high} peringatan`,
    "Prioritas Sedang": `${severityCount.medium} peringatan`,
    "Prioritas Rendah": `${severityCount.low} peringatan`,
    Dibuat: formatDateTime(new Date().toISOString()),
  };

  // Fungsi untuk mendapatkan gaya tingkat keparahan
  const getSeverityStyle = (notification) => {
    const desc = notification.alarm_description?.toLowerCase() || "";
    if (desc.includes("critical") || desc.includes("emergency"))
      return styles.statusHigh;
    if (desc.includes("warning") || desc.includes("caution"))
      return styles.statusMedium;
    return styles.statusLow;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header yang Disempurnakan */}
        {/* <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MiSREd IoT</Text>
            <Text style={styles.logoSubtext}>Manajemen Peringatan</Text>
          </View>
          <Text style={styles.title}>Laporan Riwayat Notifikasi</Text>
          <Text style={styles.subtitle}>
            Sistem Pemantauan Peringatan & Alarm
          </Text>
        </View> */}

        <View style={styles.content}>
          {/* Metadata yang Disempurnakan */}
          <View style={styles.metadata}>
            <Text style={styles.metadataTitle}>Ringkasan Laporan</Text>
            <View style={styles.metadataGrid}>
              {Object.entries(metadata).map(([label, value], index) => (
                <View key={index} style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>{label}</Text>
                  <Text style={styles.metadataValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Statistik Tingkat Keparahan */}
          {/* <View style={styles.statisticsContainer}>
            <View style={styles.statisticsCard}>
              <Text style={[styles.statisticsNumber, { color: "#dc3545" }]}>
                {severityCount.high}
              </Text>
              <Text style={styles.statisticsLabel}>Prioritas Tinggi</Text>
            </View>
            <View style={styles.statisticsCard}>
              <Text style={[styles.statisticsNumber, { color: "#ffc107" }]}>
                {severityCount.medium}
              </Text>
              <Text style={styles.statisticsLabel}>Prioritas Sedang</Text>
            </View>
            <View style={styles.statisticsCard}>
              <Text style={[styles.statisticsNumber, { color: "#28a745" }]}>
                {severityCount.low}
              </Text>
              <Text style={styles.statisticsLabel}>Prioritas Rendah</Text>
            </View>
            <View style={styles.statisticsCard}>
              <Text style={styles.statisticsNumber}>
                {sortedNotifications.length}
              </Text>
              <Text style={styles.statisticsLabel}>📊 Total Peringatan</Text>
            </View>
          </View> */}

          <View style={styles.divider} />

          {/* Tabel Notifikasi yang Disempurnakan */}
          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Riwayat Notifikasi</Text>

            {sortedNotifications.length === 0 ? (
              <View style={styles.alertBox}>
                <Text style={styles.alertText}>
                  ✅ Tidak ada notifikasi yang ditemukan untuk periode waktu yang dipilih.
                </Text>
              </View>
            ) : (
              <View style={styles.table}>
                {/* Header Tabel */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableColHeader, { width: "25%" }]}>
                    <Text style={styles.tableCellHeader}>Tanggal & Waktu</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "20%" }]}>
                    <Text style={styles.tableCellHeader}>Jenis Alarm</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "15%" }]}>
                    <Text style={styles.tableCellHeader}>Perangkat</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "15%" }]}>
                    <Text style={styles.tableCellHeader}>Sensor</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "10%" }]}>
                    <Text style={styles.tableCellHeader}>Nilai</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "15%" }]}>
                    <Text style={styles.tableCellHeader}>Kondisi</Text>
                  </View>
                </View>

                {/* Baris Tabel */}
                {sortedNotifications.map((notif, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0
                        ? styles.tableRowEven
                        : styles.tableRowOdd,
                    ]}
                  >
                    <View style={[styles.tableCol, { width: "25%" }]}>
                      <Text style={styles.tableCell}>
                        {formatDateTime(notif.triggered_at)}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>
                        {notif.alarm_description}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "15%" }]}>
                      <Text style={styles.tableCell}>
                        {notif.device_description}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "15%" }]}>
                      <Text style={styles.tableCell}>
                        {notif.datastream_description}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "10%" }]}>
                      <Text style={styles.tableCellValue}>
                        {notif.sensor_value}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "15%" }]}>
                      <Text style={styles.tableCell}>
                        {notif.conditions_text}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Footer yang Disempurnakan */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>MiSREd IoT</Text>
          <Text style={styles.footerText}>
            Sistem Peringatan & Pemantauan Lanjutan
          </Text>
          <Text style={styles.footerText}>
            Laporan notifikasi ini dibuat secara otomatis
          </Text>
          <Text style={styles.footerText}>
            Dibuat pada {formatDateTime(new Date().toISOString())}
          </Text>
          <Text style={styles.footerCopyright}>
            © {new Date().getFullYear()} MiSREd IoT. Semua hak dilindungi.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
