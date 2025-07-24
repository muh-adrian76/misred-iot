// Test API endpoint langsung
// Buat file ini di back-end/test-admin-users.js

import { AdminService } from "./src/services/AdminService.js";
import mysql from 'mysql2/promise';

async function testAdminUsers() {
  console.log("🧪 Testing Admin Users functionality...");
  
  try {
    // Create database connection
    const db = mysql.createConnection({
      host: 'localhost',
      user: 'root', // adjust sesuai config DB Anda
      password: '', // adjust sesuai config DB Anda
      database: 'misred_iot' // adjust sesuai nama database Anda
    });

    console.log("🔗 Database connection created");
    
    // Test simple query first
    const [users] = await db.query("SELECT * FROM users");
    console.log("👥 All users from database:", users);
    console.log("📊 User count:", users.length);
    
    // Test AdminService
    const adminService = new AdminService(db);
    const usersWithStats = await adminService.getAllUsersWithStats();
    console.log("📈 Users with stats:", usersWithStats);
    console.log("📊 Users with stats count:", usersWithStats.length);
    
    await db.end();
    console.log("✅ Test completed successfully");
    
  } catch (error) {
    console.error("💥 Test failed:", error);
  }
}

testAdminUsers();
