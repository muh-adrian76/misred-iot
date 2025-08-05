-- Migration script untuk menambahkan field offline_timeout_minutes
-- Jalankan script ini di database untuk menambahkan kolom baru

-- Tambahkan kolom offline_timeout_minutes ke tabel devices jika belum ada
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS offline_timeout_minutes INT DEFAULT 1 
COMMENT 'Timeout dalam menit sebelum device dianggap offline';

-- Update existing devices dengan default value 1 menit
UPDATE devices 
SET offline_timeout_minutes = 1 
WHERE offline_timeout_minutes IS NULL;

-- Verifikasi hasil migration
SELECT id, description, offline_timeout_minutes, status, last_seen_at 
FROM devices 
LIMIT 5;

-- Informasi hasil migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_devices,
  COUNT(CASE WHEN offline_timeout_minutes IS NOT NULL THEN 1 END) as devices_with_timeout
FROM devices;
