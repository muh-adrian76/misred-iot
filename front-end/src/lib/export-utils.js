/**
 * Utilitas Ekspor - Fungsi untuk mengekspor data ke berbagai format
 * Mendukung: ekspor CSV, pembuatan PDF dengan react-pdf, dan format timestamp Indonesia
 */

import { pdf } from '@react-pdf/renderer';

// Utilitas untuk memformat timestamp ke format Indonesia (DD/MM/YYYY HH:mm:ss)
export const formatDateTime = (dateString) => {
  // Tangani nilai null, undefined, atau string kosong
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return 'N/A';
  }
  
  // Coba buat objek Date yang valid
  const date = new Date(dateString);
  
  // Cek apakah date valid
  if (isNaN(date.getTime())) {
    console.warn('String tanggal tidak valid:', dateString);
    return 'N/A';
  }
  
  try {
    return date.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    console.error('Kesalahan saat memformat tanggal:', error, 'untuk dateString:', dateString);
    return 'N/A';
  }
};

/**
 * Ekspor data ke format CSV dengan unduhan otomatis
 * Memformat data menjadi CSV yang bisa dibuka di Excel/spreadsheet
 * @param {Array} headers - Array string untuk header kolom CSV
 * @param {Array} data - Array of arrays berisi data untuk setiap baris
 * @param {string} filename - Nama file tanpa ekstensi (.csv akan ditambahkan otomatis)
 */
export const exportToCSV = (headers, data, filename) => {
  // Gabungkan headers dan data, bungkus setiap field dengan tanda kutip untuk keamanan CSV
  const csvContent = [headers, ...data]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  // Buat blob dan jalankan unduhan
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};

/**
 * Generate dan unduh otomatis PDF menggunakan library react-pdf
 * Untuk membuat laporan IoT dalam format PDF yang profesional
 * @param {React.Component} DocumentComponent - Komponen React PDF Document yang sudah dibuat
 * @param {string} filename - Nama file PDF tanpa ekstensi
 */
export const generateReactPDF = async (DocumentComponent, filename) => {
  try {
    // Hasilkan blob PDF dari komponen React PDF
    const blob = await pdf(DocumentComponent).toBlob();
    
    // Buat tautan unduhan dan jalankan unduhan otomatis
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    
    // Jalankan unduhan
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Bersihkan object URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Kesalahan saat membuat React PDF:", error);
    throw error;
  }
};

/**
 * Cetak konten HTML sebagai PDF (metode cadangan/fallback)
 * @param {string} htmlContent - Konten HTML yang akan dicetak
 */
export const printHTMLContent = (htmlContent) => {
  try {
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      console.error("Gagal membuka jendela cetak. Popup mungkin diblokir.");
      return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Tunggu konten dimuat sebelum mencetak
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Tutup jendela setelah jeda untuk memastikan dialog cetak diproses
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 250);
    };
    
    // Fallback jika onload tidak terpanggil
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }
    }, 500);
    
  } catch (error) {
    console.error("Kesalahan saat mencetak konten HTML:", error);
  }
};
