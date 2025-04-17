import { db } from "./middleware";

async function truncateTable(tableName: string) {
  try {
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query(`TRUNCATE TABLE ${tableName};`);
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log(`Tabel ${tableName} berhasil di-truncate.`);
  } catch (error: any) {
    console.error(`Gagal menghapus data di tabel ${tableName}:`, error.message);
  }
}

async function main() {
  const tablesToTruncate = process.argv.slice(2); // Ambil argumen dari command line
  if (tablesToTruncate.length === 0) {
    console.error("Harap masukkan nama tabel yang ingin di-truncate.");
    process.exit(1);
  }
  for (const table of tablesToTruncate) {
    await truncateTable(table);
  }
  process.exit(0);
}

main();
