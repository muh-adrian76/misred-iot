/**
 * Export Utilities - Fungsi-fungsi untuk ekspor data ke berbagai format
 * Mendukung: CSV export, PDF generation dengan react-pdf, dan format timestamp Indonesia
 */

import { pdf } from '@react-pdf/renderer';

// Utility untuk format timestamp ke format Indonesia (DD/MM/YYYY HH:mm:ss)
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Export data ke format CSV dengan auto-download
 * Memformat data menjadi CSV yang bisa dibuka di Excel/spreadsheet
 * @param {Array} headers - Array string untuk header kolom CSV
 * @param {Array} data - Array of arrays berisi data untuk setiap row
 * @param {string} filename - Nama file tanpa extension (.csv akan ditambah otomatis)
 */
export const exportToCSV = (headers, data, filename) => {
  // Gabungkan headers dan data, wrap setiap field dengan quotes untuk CSV safety
  const csvContent = [headers, ...data]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  // Create blob dan trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};

/**
 * Generate dan auto-download PDF menggunakan react-pdf library
 * Untuk membuat laporan IoT dalam format PDF yang professional
 * @param {React.Component} DocumentComponent - React PDF Document component yang sudah dibuat
 * @param {string} filename - Nama file PDF tanpa extension
 */
export const generateReactPDF = async (DocumentComponent, filename) => {
  try {
    // Generate PDF blob dari React PDF component
    const blob = await pdf(DocumentComponent).toBlob();
    
    // Create download link dan trigger download otomatis
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating React PDF:", error);
    throw error;
  }
};

/**
 * Print HTML content sebagai PDF (fallback method)
 * @param {string} htmlContent - HTML content yang akan di-print
 */
export const printHTMLContent = (htmlContent) => {
  try {
    const printWindow = window.open("", "_blank");
    
    if (!printWindow) {
      console.error("Failed to open print window. Popup might be blocked.");
      return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close window after a delay to ensure print dialog is handled
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 250);
    };
    
    // Fallback if onload doesn't fire
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        printWindow.print();
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }
    }, 500);
    
  } catch (error) {
    console.error("Error printing HTML content:", error);
  }
};
