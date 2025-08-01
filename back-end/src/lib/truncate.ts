// ===== IMPORTS =====
// Import database middleware untuk koneksi MySQL
import { MySQLDatabase } from "./middleware";

// ===== DATABASE INITIALIZATION =====
// Inisialisasi koneksi database untuk operasi truncate
const db = await MySQLDatabase.getInstance();

// ===== TABLE ORDER CONFIGURATION =====
// Daftar tabel dalam urutan yang aman untuk truncate (menghindari foreign key conflicts)
// Urutan: hapus tabel dengan foreign key dependencies terlebih dahulu, kemudian tabel utama
const TABLE_ORDER = [
  // ===== DEPENDENT TABLES (HARUS DIHAPUS TERLEBIH DAHULU) =====
  'alarm_notifications', // Notifikasi alarm (tergantung pada alarms)
  'device_commands',     // Command device (tergantung pada devices dan datastreams)
  'alarm_conditions',    // Kondisi alarm (tergantung pada alarms)
  'alarms',             // Alarm (tergantung pada devices dan datastreams)
  'payloads',           // Data payload sensor (tergantung pada devices dan datastreams)
  'raw_payloads',       // Raw payload data (tergantung pada devices)
  'widgets',            // Widget dashboard (tergantung pada dashboards dan datastreams)
  'datastreams',        // Datastream sensor (tergantung pada devices)
  'otaa_updates',       // OTAA updates (tergantung pada devices)
  'dashboards',         // Dashboard (tergantung pada users)
  'devices',            // Device IoT (tergantung pada users)
  
  // ===== MAIN TABLES (DIHAPUS TERAKHIR) =====
  'users'               // Tabel user utama (tidak memiliki foreign key dependencies)
];

// ===== UTILITY FUNCTIONS =====

// ===== TRUNCATE SINGLE TABLE =====
// Fungsi untuk mereset tabel tertentu pada database secara manual
async function truncateTable(tableName: string) {
  try {
    // Disable foreign key checks sementara untuk menghindari constraint error
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    // Truncate tabel (menghapus semua data dan reset auto increment)
    await db.query(`TRUNCATE TABLE ${tableName};`);
    // Re-enable foreign key checks
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log(`✅ Tabel ${tableName} berhasil di-truncate.`);
  } catch (error: any) {
    console.error(`❌ Gagal menghapus data di tabel ${tableName}:`, error.message);
  }
}

// ===== TRUNCATE ALL TABLES =====
// Fungsi untuk membersihkan semua tabel dalam database secara menyeluruh
async function truncateAllTables() {
  console.log("🚀 Memulai pembersihan database secara menyeluruh...\n");
  
  try {
    // Disable foreign key checks untuk keamanan operasi batch
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    
    // Inisialisasi counter untuk tracking hasil
    let successCount = 0;
    let errorCount = 0;
    
    // Loop melalui semua tabel dalam urutan yang aman
    for (const tableName of TABLE_ORDER) {
      try {
        await db.query(`TRUNCATE TABLE ${tableName};`);
        console.log(`✅ ${tableName}`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ ${tableName}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Re-enable foreign key checks setelah operasi selesai
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    
    // ===== HASIL PEMBERSIHAN =====
    // Tampilkan summary hasil operasi
    console.log(`\n📊 Hasil pembersihan:`);
    console.log(`   ✅ Berhasil: ${successCount} tabel`);
    console.log(`   ❌ Gagal: ${errorCount} tabel`);
    
    // Status akhir berdasarkan hasil
    if (errorCount === 0) {
      console.log(`\n🎉 Database berhasil dibersihkan secara menyeluruh!`);
    } else {
      console.log(`\n⚠️  Pembersihan selesai dengan beberapa error.`);
    }
    
  } catch (error: any) {
    console.error(`❌ Error saat pembersihan database:`, error.message);
  }
}

// ===== SHOW TABLE STATUS =====
// Fungsi untuk menampilkan status dan jumlah record di semua tabel
async function showTableStatus() {
  console.log("📋 Status tabel database:\n");
  
  try {
    // Loop melalui semua tabel untuk mendapatkan jumlah record
    for (const tableName of TABLE_ORDER) {
      try {
        // Query untuk mendapatkan jumlah record dalam tabel
        const [rows]: any = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = rows[0].count;
        // Format tampilan berdasarkan jumlah record
        const status = count > 0 ? `📊 ${count} records` : `🗂️  kosong`;
        console.log(`   ${tableName.padEnd(20)} - ${status}`);
      } catch (error: any) {
        console.log(`   ${tableName.padEnd(20)} - ❌ error: ${error.message}`);
      }
    }
  } catch (error: any) {
    console.error(`❌ Error saat mengecek status tabel:`, error.message);
  }
}

// ===== RESET TO TEST DATA =====
// Fungsi untuk reset database ke kondisi testing dengan sample data
async function resetToTestData() {
  console.log("🔄 Reset database ke kondisi testing...\n");
  
  try {
    // ===== STEP 1: TRUNCATE ALL TABLES =====
    // Bersihkan semua tabel terlebih dahulu
    await truncateAllTables();
    
    console.log("\n🏗️  Mengisi ulang data testing...");
    
    // ===== STEP 2: INSERT TEST USERS =====
    // Insert data user testing (admin dan user biasa)
    await db.query(`
      INSERT INTO users (id, password, name, email, created_at, last_login, phone, refresh_token, whatsapp_notif, onboarding_completed, onboarding_progress, is_admin, otp, otp_expires_at, is_verified) VALUES
      (1, '$2b$10$y4hjgM6llmrWg1D/kBjnb.7Mg0nDj05rJLVJj3UqOPJY2zIPolXVq', 'Admin MiSREd', 'admin@misred.com', '2025-06-09 13:18:32', '2025-06-11 14:25:10', '6283119720725', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYmFmN2M2YyIsImlhdCI6MTc0OTY1MTkxMCwidHlwZSI6InJlZnJlc2gifQ.ZxNZ1zKgPgCwYusAIp8Bwew5VN1XfbKB6tefLCIjTgw', FALSE, TRUE, NULL, TRUE, NULL, NULL, TRUE),
      (2, '$2b$10$y4hjgM6llmrWg1D/kBjnb.7Mg0nDj05rJLVJj3UqOPJY2zIPolXVq', 'Contoh User', 'contoh@gmail.com', '2025-06-09 13:18:32', '2025-06-11 14:25:10', '6283119720725', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYmFmN2M2YyIsImlhdCI6MTc0OTY1MTkxMCwidHlwZSI6InJlZnJlc2gifQ.ZxNZ1zKgPgCwYusAIp8Bwew5VN1XfbKB6tefLCIjTgw', FALSE, FALSE, NULL, FALSE, NULL, NULL, TRUE)
    `);
    
    // ===== STEP 3: INSERT TEST DEVICES =====
    // Insert data device testing (ESP32 HTTP dan MQTT)
    await db.query(`
      INSERT INTO devices (id, description, board_type, protocol, mqtt_topic, new_secret, user_id, status, latitude, longitude, address) VALUES
      (1, 'Test ESP32 Device 1', 'ESP32', 'HTTP', NULL, '0df2b4a05b798a451dd2c0a9ee791c3ed6add2bd2e8f42f5a798ed518a870605', 1, 'online', -6.2146, 106.8451, 'Jakarta Pusat, DKI Jakarta'),
      (2, 'Test ESP32 Device 2', 'ESP32', 'MQTT', 'device/data', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 1, 'online', -7.2575, 112.7521, 'Surabaya, Jawa Timur')
    `);
    
    // ===== STEP 4: INSERT TEST DATASTREAMS =====
    // Insert data datastream testing (sensor pH, flow, COD, temperature, LED, pump)
    await db.query(`
      INSERT INTO datastreams (id, description, pin, type, unit, min_value, max_value, decimal_value, device_id, user_id) VALUES
      (1, 'pH Sensor', 'V0', 'double', 'pH', 0.0, 14.0, '0.00', 1, 1),
      (2, 'Flow Sensor', 'V1', 'double', 'L/min', 0.0, 100.0, '0.00', 1, 1),
      (3, 'COD Sensor', 'V2', 'double', 'mg/L', 0.0, 200.0, '0.00', 1, 1),
      (4, 'Temperature Sensor', 'V3', 'double', '°C', -10.0, 60.0, '0.00', 1, 1),
      (7, 'pH Sensor MQTT', 'V0', 'double', 'pH', 0.0, 14.0, '0.00', 2, 1),
      (8, 'Flow Sensor MQTT', 'V1', 'double', 'L/min', 0.0, 100.0, '0.00', 2, 1),
      (13, 'LED Control', 'V6', 'boolean', 'state', 0.0, 1.0, '0.00', 1, 1),
      (14, 'Pump Control', 'V7', 'boolean', 'state', 0.0, 1.0, '0.00', 1, 1)
    `);
    
    // ===== STEP 5: INSERT TEST ALARMS =====
    // Insert data alarm testing (pH tinggi dan flow rendah)
    await db.query(`
      INSERT INTO alarms (id, description, user_id, device_id, datastream_id, is_active, cooldown_minutes) VALUES
      (1, 'pH Level Too High Alert', 1, 1, 1, TRUE, 1),
      (2, 'Low Flow Rate Alert', 1, 1, 2, TRUE, 1)
    `);
    
    // ===== STEP 6: INSERT TEST ALARM CONDITIONS =====
    // Insert kondisi alarm testing (pH > 8.0 dan flow < 15.0)
    await db.query(`
      INSERT INTO alarm_conditions (id, alarm_id, operator, threshold) VALUES
      (1, 1, '>', 8.0),
      (2, 2, '<', 15.0)
    `);
    
    console.log("✅ Data testing berhasil diisi ulang!");
    
  } catch (error: any) {
    console.error(`❌ Error saat reset ke data testing:`, error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("🗂️  Database Cleanup Tool - MiSREd IoT Platform\n");
    console.log("📋 Penggunaan:");
    console.log("   bun src/lib/truncate.ts [command] [tables...]");
    console.log("");
    console.log("🔧 Commands:");
    console.log("   status          - Tampilkan status semua tabel");
    console.log("   all             - Truncate semua tabel");
    console.log("   reset           - Reset database ke kondisi testing");
    console.log("   [table_names]   - Truncate tabel tertentu");
    console.log("");
    console.log("📂 Contoh penggunaan:");
    console.log("   bun src/lib/truncate.ts status");
    console.log("   bun src/lib/truncate.ts all");
    console.log("   bun src/lib/truncate.ts reset");
    console.log("   bun src/lib/truncate.ts payloads raw_payloads");
    console.log("");
    console.log("📝 Tabel yang tersedia:");
    console.log("  ", TABLE_ORDER.join(", "));
    process.exit(0);
  }

  const command = args[0].toLowerCase();

  switch (command) {
    case 'status':
      await showTableStatus();
      break;
      
    case 'all':
      const confirm = process.env.NODE_ENV === 'development' || 
                     process.argv.includes('--force');
      
      if (!confirm) {
        console.log("⚠️  PERINGATAN: Anda akan menghapus SEMUA data dari database!");
        console.log("   Tambahkan --force untuk konfirmasi, atau jalankan dalam development mode.");
        process.exit(1);
      }
      
      await truncateAllTables();
      break;
      
    case 'reset':
      await resetToTestData();
      break;
      
    default:
      // Truncate tabel tertentu
      console.log(`🧹 Membersihkan tabel: ${args.join(', ')}\n`);
      
      for (const tableName of args) {
        if (!TABLE_ORDER.includes(tableName)) {
          console.log(`⚠️  Tabel '${tableName}' tidak dikenali. Melanjutkan...`);
        }
        await truncateTable(tableName);
      }
      break;
  }

  // Tutup koneksi database
  try {
    await db.end();
  } catch (error) {
    // Ignore connection close errors
  }
  
  process.exit(0);
}

main();
