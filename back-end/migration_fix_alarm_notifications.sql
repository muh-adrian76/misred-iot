-- Migration untuk memperbaiki tabel alarm_notifications
-- Menambahkan kolom yang mungkin missing dan memastikan semua kolom ada

-- Tambahkan kolom is_read dan read_at jika belum ada (untuk kompatibilitas)
ALTER TABLE `alarm_notifications` 
ADD COLUMN IF NOT EXISTS `is_read` BOOLEAN DEFAULT FALSE AFTER `is_saved`,
ADD COLUMN IF NOT EXISTS `read_at` TIMESTAMP NULL DEFAULT NULL AFTER `is_read`;

-- Pastikan kolom is_saved ada dan dengan default yang benar
ALTER TABLE `alarm_notifications` 
MODIFY COLUMN `is_saved` BOOLEAN DEFAULT FALSE;

-- Pastikan kolom notification_type menggunakan enum yang benar
ALTER TABLE `alarm_notifications` 
MODIFY COLUMN `notification_type` ENUM('browser', 'all') NOT NULL DEFAULT 'browser';

-- Tambahkan index untuk performance
CREATE INDEX IF NOT EXISTS `idx_alarm_notifications_user_saved` ON `alarm_notifications` (`user_id`, `is_saved`);
CREATE INDEX IF NOT EXISTS `idx_alarm_notifications_user_triggered` ON `alarm_notifications` (`user_id`, `triggered_at`);
CREATE INDEX IF NOT EXISTS `idx_alarm_notifications_triggered_desc` ON `alarm_notifications` (`triggered_at` DESC);

-- Verify schema
DESCRIBE `alarm_notifications`;
