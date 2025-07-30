/**
 * Export Utilities
 * Fungsi-fungsi untuk membantu proses ekspor data ke berbagai format
 */

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
 * Generate HTML content untuk PDF export dengan styling yang konsisten
 * @param {Object} config - Konfigurasi untuk generate HTML
 * @param {string} config.title - Judul dokumen
 * @param {string} config.subtitle - Subtitle dokumen
 * @param {Array} config.headers - Array header untuk tabel
 * @param {Array} config.data - Array data untuk tabel
 * @param {Object} config.metadata - Metadata dokumen
 * @param {string} config.filename - Nama file untuk judul
 * @returns {string} HTML content yang siap untuk di-print
 */
export const generatePDFHtmlContent = ({
  title = "MiSREd IoT - Export Data",
  subtitle = "Monitoring System Report",
  headers = [],
  data = [],
  metadata = {},
  filename = "export"
}) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MiSREd IoT - ${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            margin: 0;
            padding: 20px;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
            border-top: 4px solid #dc3545;
          }
          
          .header {
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          
          .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.1;
          }
          
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
          }
          
          .logo-icon {
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          
          .logo-text {
            font-size: 2.2em;
            font-weight: 700;
            letter-spacing: 1px;
          }
          
          .logo-iot {
            color: #ffebee;
            font-weight: 300;
          }
          
          h1 { 
            font-size: 1.8em;
            font-weight: 400;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
            position: relative;
            z-index: 1;
            color: #ffebee;
          }
          
          .content {
            padding: 30px;
          }
          
          .metadata { 
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border-left: 4px solid #dc3545;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
          }
          
          .metadata-item {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .metadata-label {
            font-weight: 600;
            color: #495057;
            min-width: 80px;
          }
          
          .metadata-value {
            color: #dc3545;
            font-weight: 500;
          }
          
          .table-container {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse;
            background: white;
          }
          
          th { 
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            font-weight: 600;
            padding: 15px 12px;
            text-align: left;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
          }
          
          th::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: rgba(255,255,255,0.2);
          }
          
          td { 
            padding: 12px;
            font-size: 12px;
            border-bottom: 1px solid #e9ecef;
            transition: background-color 0.2s ease;
          }
          
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          tr:hover {
            background-color: #fff5f5;
          }
          
          .status-active {
            color: #28a745;
            font-weight: 600;
          }
          
          .status-warning {
            color: #ffc107;
            font-weight: 600;
          }
          
          .status-danger {
            color: #dc3545;
            font-weight: 600;
          }
          
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #6c757d;
            font-size: 12px;
            border-top: 1px solid #e9ecef;
          }
          
          .company-info {
            margin-bottom: 10px;
            color: #dc3545;
            font-weight: 600;
          }
          
          .divider {
            height: 2px;
            background: linear-gradient(90deg, transparent, #dc3545, transparent);
            margin: 20px 0;
          }
          
          /* Print styles */
          @media print {
            body { 
              background: white;
              margin: 0;
              padding: 0;
            }
            
            .container {
              box-shadow: none;
              border-radius: 0;
            }
            
            .header {
              background: #dc3545 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            th {
              background: #dc3545 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            tr:nth-child(even) {
              background-color: #f8f9fa !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            .table-container {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-container">
              <div class="logo-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#dc3545">
                  <path d="M12 2L2 7L12 12L22 7L12 2M2 17L12 22L22 17M2 12L12 17L22 12"/>
                </svg>
              </div>
              <div>
                <div class="logo-text">MiSREd <span class="logo-iot">IoT</span></div>
              </div>
            </div>
            <h1>${title}</h1>
            <div class="subtitle">${subtitle}</div>
          </div>
          
          <div class="content">
            <div class="metadata">
              ${Object.entries(metadata).map(([label, value]) => `
                <div class="metadata-item">
                  <span class="metadata-label">${label}:</span>
                  <span class="metadata-value">${value}</span>
                </div>
              `).join('')}
              <div class="metadata-item">
                <span class="metadata-label">Dicetak:</span>
                <span class="metadata-value">${formatDateTime(new Date().toISOString())}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr>
                      ${row.map(cell => `<td>${cell}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="footer">
            <div class="company-info">MiSREd IoT - Monitoring System</div>
            <p>Dokumen ini digenerate secara otomatis oleh sistem monitoring</p>
            <p>© ${new Date().getFullYear()} MiSREd IoT. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
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
 * Print HTML content sebagai PDF
 * @param {string} htmlContent - HTML content yang akan di-print
 */
export const printHTMLContent = (htmlContent) => {
  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};
