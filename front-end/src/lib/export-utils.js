/**
 * Export Utilities
 * Fungsi-fungsi untuk membantu proses ekspor data ke berbagai format
 */

import { pdf } from '@react-pdf/renderer';

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
 * Eksport data ke CSV format
 * @param {Array} headers - Array header untuk CSV
 * @param {Array} data - Array data untuk CSV
 * @param {string} filename - Nama file
 */
export const exportToCSV = (headers, data, filename) => {
  const csvContent = [headers, ...data]
    .map((row) => row.map((field) => `"${field}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
};

/**
 * Generate dan download PDF menggunakan react-pdf
 * @param {React.Component} DocumentComponent - React PDF Document component
 * @param {string} filename - Nama file untuk download
 */
export const generateReactPDF = async (DocumentComponent, filename) => {
  try {
    // Create PDF blob using react-pdf
    const blob = await pdf(DocumentComponent).toBlob();
    
    // Create download link
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
