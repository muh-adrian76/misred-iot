-- Perbaikan struktur database untuk dashboard yang lebih baik

-- 1. Perbaiki tabel payloads untuk mendukung datastream mapping
ALTER TABLE `payloads` ADD COLUMN `datastream_id` INT NULL;
ALTER TABLE `payloads` ADD FOREIGN KEY (`datastream_id`) REFERENCES `datastreams` (`id`) ON DELETE CASCADE;

-- 2. Tambah kolom time_range ke tabel dashboards untuk filter waktu
ALTER TABLE `dashboards` ADD COLUMN `time_range` ENUM('1h', '6h', '12h', '24h', '7d', '30d') DEFAULT '24h';

-- 3. Tambah tabel untuk command history (controlling devices via datastream)
CREATE TABLE IF NOT EXISTS `device_commands` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `device_id` INT NOT NULL,
  `datastream_id` INT NOT NULL,
  `command_type` ENUM('set_value', 'toggle', 'reset') NOT NULL,
  `value` DECIMAL(10,3) NOT NULL,
  `status` ENUM('pending', 'sent', 'acknowledged', 'failed') DEFAULT 'pending',
  `sent_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `acknowledged_at` TIMESTAMP NULL DEFAULT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`datastream_id`) REFERENCES `datastreams` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Tambah index untuk performa query dashboard
CREATE INDEX idx_payloads_device_time ON payloads(device_id, server_time);
CREATE INDEX idx_payloads_datastream_time ON payloads(datastream_id, server_time);
CREATE INDEX idx_device_commands_status ON device_commands(status, sent_at);

-- 5. View untuk data analytics dashboard
CREATE VIEW dashboard_sensor_data AS
SELECT 
    p.id,
    p.device_id,
    d.description as device_name,
    ds.description as sensor_name,
    ds.unit,
    ds.type as data_type,
    p.value,
    p.server_time,
    u.name as user_name
FROM payloads p
LEFT JOIN devices d ON p.device_id = d.id
LEFT JOIN datastreams ds ON p.datastream_id = ds.id
LEFT JOIN users u ON d.user_id = u.id;
