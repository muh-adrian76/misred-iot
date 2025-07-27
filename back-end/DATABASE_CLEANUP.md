# Database Cleanup Tool

Tool untuk melakukan pembersihan database MiSREd IoT Platform secara menyeluruh dan terstruktur.

## 🚀 Fitur

### 1. **Status Check** 
Menampilkan jumlah records di semua tabel database
```bash
bun src/lib/truncate.ts status
```

### 2. **Complete Cleanup**
Membersihkan semua tabel dengan urutan yang aman (menghindari foreign key conflicts)
```bash
bun src/lib/truncate.ts all --force
```

### 3. **Reset to Test Data**
Membersihkan database dan mengisi ulang dengan data testing
```bash
bun src/lib/truncate.ts reset
```

### 4. **Selective Cleanup**
Membersihkan tabel tertentu saja
```bash
bun src/lib/truncate.ts payloads raw_payloads
bun src/lib/truncate.ts users devices datastreams
```

## 📋 Table Order

Tool menggunakan urutan yang aman untuk menghindari foreign key constraint errors:

```
1. alarm_notifications    (paling dependent)
2. device_commands
3. alarm_conditions
4. alarms
5. payloads
6. raw_payloads
7. widgets
8. datastreams
9. otaa_updates
10. dashboards
11. devices
12. users                 (paling independent)
```

## 🔧 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `status` | Show table status | `bun src/lib/truncate.ts status` |
| `all` | Truncate all tables | `bun src/lib/truncate.ts all --force` |
| `reset` | Reset to test data | `bun src/lib/truncate.ts reset` |
| `[tables]` | Truncate specific tables | `bun src/lib/truncate.ts payloads widgets` |

## 🛡️ Safety Features

### Foreign Key Handling
- Automatically disables foreign key checks during operations
- Re-enables foreign key checks after completion
- Uses safe table order to prevent constraint violations

### Environment Protection
- Requires `--force` flag for complete cleanup in production
- Automatic confirmation bypass in development mode
- Clear warnings before destructive operations

### Error Handling
- Continues operation even if individual table fails
- Reports success/failure count
- Detailed error messages for troubleshooting

## 📊 Output Examples

### Status Command
```
📋 Status tabel database:

   alarm_notifications  - 🗂️  kosong
   device_commands      - 🗂️  kosong
   alarm_conditions     - 📊 4 records
   alarms               - 📊 4 records
   payloads             - 📊 1,234 records
   raw_payloads         - 📊 1,234 records
   widgets              - 📊 12 records
   datastreams          - 📊 20 records
   otaa_updates         - 🗂️  kosong
   dashboards           - 📊 5 records
   devices              - 📊 8 records
   users                - 📊 15 records
```

### Complete Cleanup
```
🚀 Memulai pembersihan database secara menyeluruh...

✅ alarm_notifications
✅ device_commands
✅ alarm_conditions
✅ alarms
✅ payloads
✅ raw_payloads
✅ widgets
✅ datastreams
✅ otaa_updates
✅ dashboards
✅ devices
✅ users

📊 Hasil pembersihan:
   ✅ Berhasil: 12 tabel
   ❌ Gagal: 0 tabel

🎉 Database berhasil dibersihkan secara menyeluruh!
```

### Reset to Test Data
```
🔄 Reset database ke kondisi testing...

🚀 Memulai pembersihan database secara menyeluruh...
[cleanup process...]

🏗️  Mengisi ulang data testing...
✅ Data testing berhasil diisi ulang!
```

## ⚠️ Important Notes

### Production Safety
- Always backup database before running cleanup operations
- Use `--force` flag carefully in production environments
- Test data reset should only be used in development

### Data Recovery
- No built-in data recovery mechanism
- Ensure proper backups before destructive operations
- Consider using database snapshots for quick recovery

### Performance
- Large tables may take time to truncate
- Foreign key operations add slight overhead
- Progress is shown for long-running operations

## 🔄 Common Use Cases

### Development Reset
```bash
# Quick reset for development
bun src/lib/truncate.ts reset
```

### Payload Data Cleanup
```bash
# Clean only sensor data
bun src/lib/truncate.ts payloads raw_payloads
```

### User Data Reset
```bash
# Clean user-related data
bun src/lib/truncate.ts alarm_notifications device_commands widgets dashboards
```

### Complete Fresh Start
```bash
# Nuclear option - clean everything
bun src/lib/truncate.ts all --force
```

## 🚧 Troubleshooting

### Foreign Key Errors
If you encounter foreign key constraint errors:
1. Check table order in `TABLE_ORDER` array
2. Ensure proper dependency mapping
3. Manually disable foreign key checks if needed

### Connection Issues
If database connection fails:
1. Verify database credentials in environment
2. Check database server status
3. Ensure proper network connectivity

### Permission Errors
If you get permission denied errors:
1. Check database user privileges
2. Ensure TRUNCATE permissions are granted
3. Verify table existence and accessibility
