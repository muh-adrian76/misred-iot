-- 🧪 SQL Testing Queries untuk Device Control

-- ================================
-- 1. SETUP TESTING DATA
-- ================================

-- Pastikan ada device untuk testing
INSERT IGNORE INTO devices (id, description, protocol, status) VALUES 
(1, 'ESP32 Test Device', 'mqtt', 'active');

-- Pastikan ada datastreams aktuator (boolean/string) dan sensor (integer/double)
INSERT IGNORE INTO datastreams (device_id, description, pin, type, unit, min_value, max_value) VALUES
-- Aktuator (dapat dikontrol)
(1, 'LED Control', 'D0', 'boolean', '', 0, 1),
(1, 'Pump Control', 'D1', 'boolean', '', 0, 1),
(1, 'Fan Speed', 'D2', 'string', '%', 0, 100),
(1, 'Valve Position', 'D3', 'string', 'degrees', 0, 180),

-- Sensor (hanya monitoring)
(1, 'Temperature', 'A0', 'double', '°C', -40, 125),
(1, 'Humidity', 'A1', 'integer', '%', 0, 100);

-- ================================
-- 2. TESTING QUERIES
-- ================================

-- Cek struktur tabel device_commands
DESCRIBE device_commands;

-- Lihat semua datastreams dan tipenya
SELECT 
  d.description as device_name,
  ds.id as datastream_id,
  ds.description as datastream_name,
  ds.pin,
  ds.type,
  ds.min_value,
  ds.max_value,
  CASE 
    WHEN ds.type IN ('string', 'boolean') THEN 'AKTUATOR (Dapat dikontrol)'
    ELSE 'SENSOR (Hanya monitoring)'
  END as mode
FROM datastreams ds
JOIN devices d ON ds.device_id = d.id
ORDER BY d.id, ds.pin;

-- Lihat semua commands yang pernah dibuat
SELECT 
  dc.id as command_id,
  dc.device_id,
  d.description as device_name,
  ds.description as datastream_name,
  ds.pin,
  ds.type as datastream_type,
  dc.command_type,
  dc.value,
  dc.status,
  dc.sent_at,
  dc.acknowledged_at,
  u.name as user_name
FROM device_commands dc
JOIN devices d ON dc.device_id = d.id
JOIN datastreams ds ON dc.datastream_id = ds.id
LEFT JOIN users u ON dc.user_id = u.id
ORDER BY dc.sent_at DESC
LIMIT 20;

-- ================================
-- 3. COMMAND STATISTICS
-- ================================

-- Statistik commands berdasarkan status
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM device_commands), 2) as percentage
FROM device_commands
GROUP BY status
ORDER BY count DESC;

-- Commands per device
SELECT 
  d.description as device_name,
  COUNT(dc.id) as total_commands,
  SUM(CASE WHEN dc.status = 'acknowledged' THEN 1 ELSE 0 END) as successful_commands,
  SUM(CASE WHEN dc.status = 'failed' THEN 1 ELSE 0 END) as failed_commands,
  SUM(CASE WHEN dc.status = 'pending' THEN 1 ELSE 0 END) as pending_commands
FROM devices d
LEFT JOIN device_commands dc ON d.id = dc.device_id
GROUP BY d.id, d.description
ORDER BY total_commands DESC;

-- Commands per datastream (aktuator usage)
SELECT 
  ds.description as datastream_name,
  ds.pin,
  ds.type,
  COUNT(dc.id) as command_count,
  AVG(dc.value) as avg_value,
  MIN(dc.value) as min_value,
  MAX(dc.value) as max_value
FROM datastreams ds
LEFT JOIN device_commands dc ON ds.id = dc.datastream_id
WHERE ds.type IN ('string', 'boolean')
GROUP BY ds.id, ds.description, ds.pin, ds.type
ORDER BY command_count DESC;

-- ================================
-- 4. PERFORMANCE QUERIES
-- ================================

-- Command response time (jika ada acknowledged_at)
SELECT 
  dc.id,
  ds.description as datastream_name,
  dc.sent_at,
  dc.acknowledged_at,
  TIMESTAMPDIFF(SECOND, dc.sent_at, dc.acknowledged_at) as response_time_seconds
FROM device_commands dc
JOIN datastreams ds ON dc.datastream_id = ds.id
WHERE dc.acknowledged_at IS NOT NULL
ORDER BY dc.sent_at DESC
LIMIT 10;

-- Commands yang timeout (lebih dari 10 detik tanpa acknowledgment)
SELECT 
  dc.id,
  d.description as device_name,
  ds.description as datastream_name,
  dc.sent_at,
  dc.status,
  TIMESTAMPDIFF(SECOND, dc.sent_at, NOW()) as seconds_ago
FROM device_commands dc
JOIN devices d ON dc.device_id = d.id
JOIN datastreams ds ON dc.datastream_id = ds.id
WHERE dc.status = 'pending' 
AND TIMESTAMPDIFF(SECOND, dc.sent_at, NOW()) > 10
ORDER BY dc.sent_at DESC;

-- ================================
-- 5. CLEANUP QUERIES
-- ================================

-- Manual cleanup - mark old pending commands as failed
UPDATE device_commands 
SET status = 'failed'
WHERE status = 'pending' 
AND sent_at < DATE_SUB(NOW(), INTERVAL 10 SECOND);

-- Delete very old commands (older than 30 days)
-- DELETE FROM device_commands WHERE sent_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ================================
-- 6. TESTING DATA INSERTION
-- ================================

-- Insert sample commands for testing (replace user_id with valid user)
INSERT INTO device_commands (device_id, datastream_id, command_type, value, user_id, status) VALUES
(1, 1, 'toggle', 1, 1, 'pending'),
(1, 2, 'toggle', 0, 1, 'acknowledged'),
(1, 3, 'set_value', 75, 1, 'acknowledged'),
(1, 4, 'set_value', 90, 1, 'failed');

-- ================================
-- 7. VALIDATION QUERIES
-- ================================

-- Pastikan tidak ada commands ke sensor (hanya ke aktuator)
SELECT 
  dc.id,
  ds.description,
  ds.type,
  'ERROR: Command to sensor!' as warning
FROM device_commands dc
JOIN datastreams ds ON dc.datastream_id = ds.id
WHERE ds.type NOT IN ('string', 'boolean');

-- Pastikan nilai boolean commands hanya 0 atau 1
SELECT 
  dc.id,
  ds.description,
  ds.type,
  dc.value,
  'ERROR: Boolean value not 0 or 1!' as warning
FROM device_commands dc
JOIN datastreams ds ON dc.datastream_id = ds.id
WHERE ds.type = 'boolean' 
AND dc.value NOT IN (0, 1);

-- Pastikan nilai dalam range min/max
SELECT 
  dc.id,
  ds.description,
  ds.min_value,
  ds.max_value,
  dc.value,
  'ERROR: Value out of range!' as warning
FROM device_commands dc
JOIN datastreams ds ON dc.datastream_id = ds.id
WHERE dc.value < ds.min_value OR dc.value > ds.max_value;
