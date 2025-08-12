/**
 * Komponen React PDF yang Disempurnakan untuk Sistem MiSREd IoT
 * 
 * Menghasilkan dokumen PDF yang indah dan profesional menggunakan @react-pdf/renderer
 * untuk ekspor data IoT dengan styling yang konsisten dengan branding perusahaan.
 * 
 * Fitur utama:
 * - Layout responsive dengan styling modern
 * - Support untuk multiple device dan datastream
 * - Metadata lengkap dan statistik
 * - Tabel data terstruktur dengan alternating colors
 * - Header dengan branding MiSREd-IoT
 * - Export notification history dan datastream data
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

/**
 * Gaya yang disempurnakan untuk PDF dengan desain modern
 * Menggunakan color scheme yang konsisten dengan branding MiSREd-IoT
 */
const styles = StyleSheet.create({
  // Halaman PDF dengan layout yang bersih dan profesional
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 0,
    paddingTop: 20,
    paddingBottom: 20,
    fontSize: 10,
    fontFamily: "Helvetica",
  },

  // Header dengan desain yang menarik dan branding MiSREd-IoT
  header: {
    padding: 15,
    marginBottom: 0,
    alignItems: "center",
    position: "relative",
  },

  // Pattern dekoratif untuk header (simulasi gradient)
  headerPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: "#ffffff",
  },

  // Container logo dengan alignment yang rapi
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  // Logo perusahaan dengan ukuran yang proporsional
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },

  // Teks logo dengan styling yang bold dan branded
  logoText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },

  // Subtext logo dengan style yang subtle
  logoSubtext: {
    fontSize: 8,
    opacity: 0.8,
    marginLeft: 8,
    fontStyle: "italic",
  },

  // Judul dokumen dengan emphasis yang kuat
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
  },

  // Subtitle dengan informasi waktu pembuatan
  subtitle: {
    fontSize: 11,
    opacity: 0.9,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Kontainer konten utama dengan padding yang nyaman
  content: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 10,
    flex: 1,
  },

  // Bagian metadata dengan background dan border yang menarik
  metadata: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 8,
    borderLeft: "4 solid #dc3545", // Accent border dengan warna merah MiSREd
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },

  metadataTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
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

  // Tabel yang disempurnakan
  tableContainer: {
    marginBottom: 20,
    marginTop: 10,
    breakInside: "avoid",
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
  // Elemen dekoratif
  divider: {
    height: 3,
    backgroundColor: "#dc3545",
    marginVertical: 25,
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

  // Gaya pengelompokan perangkat
  deviceGroup: {
    marginBottom: 8,
  },

  deviceTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 3,
  },
});

/**
 * Dokumen PDF Ekspor Datastream yang Disempurnakan
 * 
 * Komponen utama untuk menghasilkan laporan PDF data IoT dengan:
 * - Support untuk multiple datastream dan device
 * - Grouping data berdasarkan perangkat
 * - Metadata lengkap dan statistik
 * - Tabel data yang terstruktur dan mudah dibaca
 * - Compatibility dengan format data legacy dan baru
 * 
 * @param {Array} datastreams - Array datastream yang akan diekspor
 * @param {Array} allData - Array data dengan struktur { datastream, data }
 */
export const DatastreamPDFDocument = ({ datastreams = [], allData = [] }) => {
  // Konversi format legacy ke format baru untuk backward compatibility
  if (!Array.isArray(datastreams) && allData.datastream) {
    datastreams = [allData.datastream];
    allData = [{ datastream: allData.datastream, data: allData.data || allData }];
  }
  
  // Fallback jika tidak ada data
  if (!allData.length) {
    allData = [{ datastream: datastreams[0], data: [] }];
  }

  // Debug: Log data (contoh beberapa item) untuk memeriksa format tanggal
  console.log('📊 Debug PDF - Contoh data:', allData.slice(0, 2));

  // Kelompokkan data berdasarkan perangkat untuk organisasi yang lebih baik
  const deviceGroups = {};
  allData.forEach(({ datastream, data }) => {
    const deviceId = datastream.device_id;
    if (!deviceGroups[deviceId]) {
      deviceGroups[deviceId] = {
        device: {
          id: deviceId,
          description: datastream.device_description
        },
        datastreams: [],
        combinedData: []
      };
    }
    
    deviceGroups[deviceId].datastreams.push(datastream);
    
    // Tambahkan informasi datastream ke setiap data point untuk referensi
    if (data && data.length > 0) {
      data.forEach(item => {
        // Debug: Log contoh field tanggal
        if (Math.random() < 0.1) { // 10% sampling untuk debugging
          console.log('📊 Debug PDF - Field tanggal:', {
            device_time: item.device_time,
            created_at: item.created_at,
            triggered_at: item.triggered_at
          });
        }
        
        deviceGroups[deviceId].combinedData.push({
          ...item,
          datastream_id: datastream.id,
          datastream_description: datastream.description,
          datastream_pin: datastream.pin,
          device_id: datastream.device_id,
          device_description: datastream.device_description
        });
      });
    }
  });

  // Urutkan data dalam setiap group berdasarkan waktu (ascending)
  Object.values(deviceGroups).forEach(group => {
    group.combinedData.sort((a, b) => {
      const dateA = new Date(a.timestamp || a.device_time || a.created_at || a.triggered_at);
      const dateB = new Date(b.timestamp || b.device_time || b.created_at || b.triggered_at);
      
      // Handle invalid dates
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      
      return dateA.getTime() - dateB.getTime();
    });
  });

  // Kalkulasi statistik keseluruhan untuk metadata
  const allCombinedData = Object.values(deviceGroups).flatMap(group => group.combinedData);
  const validDataWithDates = allCombinedData.filter(item => {
    const dateStr = item.timestamp || item.device_time || item.created_at || item.triggered_at;
    return dateStr && !isNaN(new Date(dateStr).getTime());
  });
  
  const metadata = {
    "Jumlah Perangkat": `${Object.keys(deviceGroups).length} perangkat`,
    "Jumlah Datastream": `${datastreams.length} sensor`,
    "Jumlah Data": `${allCombinedData.length} titik data`,
    "Rentang Tanggal":
      validDataWithDates.length > 0
        ? `${formatDateTime(validDataWithDates[0].timestamp || validDataWithDates[0].device_time || validDataWithDates[0].created_at || validDataWithDates[0].triggered_at)} - ${formatDateTime(validDataWithDates[validDataWithDates.length - 1].timestamp || validDataWithDates[validDataWithDates.length - 1].device_time || validDataWithDates[validDataWithDates.length - 1].created_at || validDataWithDates[validDataWithDates.length - 1].triggered_at)}`
        : "Tidak ada data dengan tanggal valid",
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header yang Disempurnakan */}
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Data Perangkat</Text>
          <Text style={styles.subtitle}>
            Laporan ini dibuat secara otomatis pada {formatDateTime(new Date().toISOString())}
          </Text>
        </View>

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

          <View style={styles.divider} />

          {/* Informasi Datastream yang Dipilih */}
          {datastreams.length > 0 && (
            <View style={styles.metadata}>
              <Text style={styles.metadataTitle}>Datastream yang Dipilih</Text>
              <View style={styles.metadataGrid}>
                {Object.entries(deviceGroups).map(([deviceId, group]) => (
                  <View key={deviceId} style={styles.deviceGroup}>
                    <Text style={styles.deviceTitle}>{group.device.description}:</Text>
                    {group.datastreams.map((ds, index) => (
                      <View key={index} style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>{ds.pin}</Text>
                        <Text style={styles.metadataValue}>{ds.description}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tabel Data per Perangkat */}
          {Object.entries(deviceGroups).map(([deviceId, group]) => (
            <View key={deviceId} style={styles.tableContainer}>
              <Text style={styles.tableTitle}>
                Data {group.device.description} (UID: {deviceId})
              </Text>

              <View style={styles.table}>
                {/* Header Tabel */}
                <View style={styles.tableRow}>
                  <View style={[styles.tableColHeader, { width: "30%" }]}>
                    <Text style={styles.tableCellHeader}>Tanggal dan Waktu</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "25%" }]}>
                    <Text style={styles.tableCellHeader}>Datastream</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "20%" }]}>
                    <Text style={styles.tableCellHeader}>Virtual Pin</Text>
                  </View>
                  <View style={[styles.tableColHeader, { width: "25%" }]}>
                    <Text style={styles.tableCellHeader}>Nilai</Text>
                  </View>
                </View>

                {/* Baris Tabel dengan warna bergantian */}
                {group.combinedData.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                    ]}
                  >
                    <View style={[styles.tableCol, { width: "30%" }]}>
                      <Text style={styles.tableCell}>
                        {formatDateTime(item.timestamp || item.device_time || item.created_at || item.triggered_at)}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "25%" }]}>
                      <Text style={styles.tableCell}>
                        {item.datastream_description ?? '-'}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: "20%" }]}>
                      <Text style={styles.tableCell}>{item.datastream_pin ?? '-'}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: "25%" }]}>
                      <Text style={styles.tableCellValue}>{item.value ?? '-'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
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
    
    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB.getTime() - dateA.getTime(); // Terbaru dulu untuk notifikasi
  });

  // Kelompokkan notifikasi berdasarkan perangkat
  const deviceGroups = {};
  sortedNotifications.forEach(notification => {
    const deviceId = notification.device_id || 'unknown';
  const deviceName = notification.device_description || `Perangkat ${deviceId}`;
    
    if (!deviceGroups[deviceId]) {
      deviceGroups[deviceId] = {
        device: {
          id: deviceId,
          description: deviceName
        },
        notifications: []
      };
    }
    
    deviceGroups[deviceId].notifications.push(notification);
  });
  
  const metadata = {
    "Jumlah Perangkat": `${Object.keys(deviceGroups).length} perangkat`,
    "Total Notifikasi": `${sortedNotifications.length} peringatan`,
    Dibuat: formatDateTime(new Date().toISOString()),
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header yang Disempurnakan */}
        <View style={styles.header}>
          <Text style={styles.title}>Laporan Riwayat Notifikasi</Text>
          
          <Text style={styles.subtitle}>
            Laporan ini dibuat secara otomatis pada {formatDateTime(new Date().toISOString())}
          </Text>
        </View>

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

          <View style={styles.divider} />

          {/* Tabel Notifikasi per Perangkat */}
          {Object.entries(deviceGroups).map(([deviceId, group]) => (
            <View key={deviceId} style={styles.tableContainer}>
              <Text style={styles.tableTitle}>
                Notifikasi {group.device.description} (UID: {deviceId === 'unknown' ? 'Tidak Diketahui' : deviceId})
              </Text>

              {group.notifications.length === 0 ? (
                <View style={styles.alertBox}>
                  <Text style={styles.alertText}>
                    ✅ Tidak ada notifikasi untuk perangkat ini.
                  </Text>
                </View>
              ) : (
                <View style={styles.table}>
                  {/* Header Tabel */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableColHeader, { width: "20%" }]}>
                      <Text style={styles.tableCellHeader}>Tanggal & Waktu</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: "15%" }]}>
                      <Text style={styles.tableCellHeader}>Tipe</Text>
                    </View>
                    <View style={[styles.tableColHeader, { width: "25%" }]}>
                      <Text style={styles.tableCellHeader}>Judul/Alarm</Text>
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
                  {group.notifications.map((notif, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tableRow,
                        index % 2 === 0
                          ? styles.tableRowEven
                          : styles.tableRowOdd,
                      ]}
                    >
                      <View style={[styles.tableCol, { width: "20%" }]}>
                        <Text style={styles.tableCell}>
                          {formatDateTime(notif.triggered_at)}
                        </Text>
                      </View>
                      <View style={[styles.tableCol, { width: "15%" }]}>
                        <Text style={styles.tableCell}>
                          {notif.type === 'alarm' ? 'Alarm' : notif.type === 'device_status' ? 'Status' : 'Notif'}
                        </Text>
                      </View>
                      <View style={[styles.tableCol, { width: "25%" }]}>
                        <Text style={styles.tableCell}>
                          {notif.title || notif.alarm_description || '-'}
                        </Text>
                      </View>
                      <View style={[styles.tableCol, { width: "15%" }]}>
                        <Text style={styles.tableCell}>
                          {notif.datastream_description ?? '-'}
                        </Text>
                      </View>
                      <View style={[styles.tableCol, { width: "10%" }]}>
                        <Text style={styles.tableCellValue}>
                          {notif.sensor_value !== null && notif.sensor_value !== undefined ? notif.sensor_value : '-'}
                        </Text>
                      </View>
                      <View style={[styles.tableCol, { width: "15%" }]}>
                        <Text style={styles.tableCell}>
                          {notif.conditions_text || '-'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};
