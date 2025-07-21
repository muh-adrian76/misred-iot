-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 12, 2025 at 07:58 AM
-- Server version: 8.0.41-0ubuntu0.22.04.1
-- PHP Version: 8.1.2-1ubuntu2.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(15) DEFAULT NULL,
  -- `otp` int DEFAULT NULL,
  `refresh_token` varchar(255),
  `whatsapp_notif` BOOLEAN DEFAULT FALSE,
  `onboarding_completed` BOOLEAN DEFAULT FALSE,
  `onboarding_progress` JSON DEFAULT NULL,
  `is_admin` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `password`, `name`, `email`, `created_at`, `last_login`, `phone`, `refresh_token`, `whatsapp_notif`, `onboarding_completed`, `onboarding_progress`, `is_admin`) VALUES
('1', '$2b$10$y4hjgM6llmrWg1D/kBjnb.7Mg0nDj05rJLVJj3UqOPJY2zIPolXVq', 'Admin MiSREd', 'admin@misred.com', '2025-06-09 13:18:32', '2025-06-11 14:25:10', '6283119720725', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYmFmN2M2YyIsImlhdCI6MTc0OTY1MTkxMCwidHlwZSI6InJlZnJlc2gifQ.ZxNZ1zKgPgCwYusAIp8Bwew5VN1XfbKB6tefLCIjTgw', FALSE, TRUE, NULL, TRUE),
('2', '$2b$10$y4hjgM6llmrWg1D/kBjnb.7Mg0nDj05rJLVJj3UqOPJY2zIPolXVq', 'Contoh User', 'contoh@gmail.com', '2025-06-09 13:18:32', '2025-06-11 14:25:10', '6283119720725', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYmFmN2M2YyIsImlhdCI6MTc0OTY1MTkxMCwidHlwZSI6InJlZnJlc2gifQ.ZxNZ1zKgPgCwYusAIp8Bwew5VN1XfbKB6tefLCIjTgw', FALSE, FALSE, NULL, FALSE),
('3', '$2b$10$drXOCl6FOru0dryqjSPWiur5uKnJ9zfhmZuqqe4NIg3Gjm7fXAwHS', 'muh.adriano76', 'muh.adriano76@gmail.com', '2025-06-08 20:43:10', '2025-06-08 21:09:36', NULL, 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NjI3MzNmNyIsImlhdCI6MTc0OTQxNjk3NiwidHlwZSI6InJlZnJlc2gifQ.bAhAFne2K9j9QW1VmUDe7f9Fa-EvteAMVuE5IoelfqQ', FALSE, FALSE, NULL, FALSE),
('4', 'GOOGLE_OAUTH_USER', 'Muh. Adriano', 'wedoung87@gmail.com', '2025-06-08 20:20:39', '2025-06-08 20:20:39', NULL, '', FALSE, FALSE, NULL, FALSE);

CREATE TABLE IF NOT EXISTS `dashboards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `user_id` INT NOT NULL,
  `widget_count` INT NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `layout` JSON NULL,
  `time_range` ENUM('1m', '1h', '12h', '1d', '1w', '1M', '1y', 'all') DEFAULT '1m',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `devices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `board_type` varchar(255) DEFAULT NULL,
  `protocol` varchar(10) NOT NULL,
  `mqtt_topic` varchar(255) DEFAULT NULL,
  -- `mqtt_qos` enum('0','1','2') DEFAULT '0',
  `dev_eui` varchar(255) DEFAULT NULL,
  `app_eui` varchar(255) DEFAULT NULL,
  `app_key` varchar(255) DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `old_secret` varchar(255) DEFAULT NULL,
  `new_secret` varchar(255) NOT NULL,
  `firmware_version` varchar(50) DEFAULT NULL,
  `status` enum('offline','online') DEFAULT 'offline',
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `datastreams` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `pin` VARCHAR(10) NOT NULL,
  `type` VARCHAR(10) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `default_value` VARCHAR(255) NOT NULL,
  `min_value` DOUBLE NOT NULL,
  `max_value` DOUBLE NOT NULL,
  `decimal_value` VARCHAR(10) NOT NULL,
  `device_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payloads` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `device_id` INT NOT NULL,
  `datastream_id` INT NOT NULL,
  `value` DECIMAL(10,3) NOT NULL,
  `raw_data` JSON NULL, 
  `server_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`datastream_id`) REFERENCES `datastreams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `widgets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `dashboard_id` INT NOT NULL,
  `inputs` JSON NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `alarms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  `user_id` INT NOT NULL,
  `device_id` INT NOT NULL,
  `datastream_id` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `cooldown_minutes` INT DEFAULT 5,
  `last_triggered` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`datastream_id`) REFERENCES `datastreams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `alarm_conditions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `alarm_id` INT NOT NULL,
  `operator` ENUM('=', '<', '>', '<=', '>=') NOT NULL,
  `threshold` DECIMAL(10,3) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`alarm_id`) REFERENCES `alarms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `otaa_updates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `board_type` varchar(255) NOT NULL,
  `firmware_version` varchar(50) NOT NULL,
  `firmware_url` varchar(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `alarm_notifications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `alarm_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `device_id` INT NOT NULL,
  `datastream_id` INT NOT NULL,
  `sensor_value` DECIMAL(10,3) NOT NULL,
  `conditions_text` VARCHAR(255) NOT NULL,
  `notification_type` ENUM('browser', 'all') NOT NULL,
  `whatsapp_message_id` VARCHAR(255) NULL,
  `error_message` TEXT NULL,
  `triggered_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `is_saved` BOOLEAN DEFAULT FALSE,
  `saved_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`alarm_id`) REFERENCES `alarms` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`datastream_id`) REFERENCES `datastreams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `device_commands` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
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

-- Tabel untuk menyimpan raw payload dari device (backup dan debugging)
CREATE TABLE IF NOT EXISTS `raw_payloads` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `device_id` INT NOT NULL,
  `raw_data` JSON NOT NULL,
  `parsed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- TESTING
INSERT IGNORE INTO devices (id, description, board_type, protocol, mqtt_topic, new_secret, user_id, status) VALUES
(1, 'Test ESP32 Device 1', 'ESP32', 'HTTP', NULL, '0df2b4a05b798a451dd2c0a9ee791c3ed6add2bd2e8f42f5a798ed518a870605', 1, 'online'),
(2, 'Test ESP32 Device 2', 'ESP32', 'MQTT', 'device/data', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 1, 'online');

INSERT IGNORE INTO datastreams (id, description, pin, type, unit, default_value, min_value, max_value, decimal_value, device_id, user_id) VALUES
-- Device 1 (HTTP) - Sensors
(1, 'pH Sensor', 'V0', 'double', 'pH', '7.0', 0.0, 14.0, '2', 1, 1),
(2, 'Flow Sensor', 'V1', 'double', 'L/min', '25.0', 0.0, 100.0, '2', 1, 1),
(3, 'COD Sensor', 'V2', 'double', 'mg/L', '50.0', 0.0, 200.0, '1', 1, 1),
(4, 'Temperature Sensor', 'V3', 'double', '°C', '25.0', -10.0, 60.0, '1', 1, 1),
(5, 'NH3N Sensor', 'V4', 'double', 'mg/L', '2.0', 0.0, 20.0, '2', 1, 1),
(6, 'Turbidity Sensor', 'V5', 'double', 'NTU', '10.0', 0.0, 100.0, '1', 1, 1),
-- Device 1 (HTTP) - Actuators
(13, 'LED Control', 'D0', 'boolean', 'state', '0', 0.0, 1.0, '0', 1, 1),
(14, 'Pump Control', 'D1', 'boolean', 'state', '0', 0.0, 1.0, '0', 1, 1),
(15, 'Fan Speed', 'D2', 'string', '%', '50', 0.0, 100.0, '0', 1, 1),
(16, 'Valve Position', 'D3', 'string', 'degrees', '90', 0.0, 180.0, '0', 1, 1),
-- Device 2 (MQTT) - Sensors
(7, 'pH Sensor MQTT', 'V0', 'double', 'pH', '7.0', 0.0, 14.0, '2', 2, 1),
(8, 'Flow Sensor MQTT', 'V1', 'double', 'L/min', '25.0', 0.0, 100.0, '2', 2, 1),
(9, 'COD Sensor MQTT', 'V2', 'double', 'mg/L', '50.0', 0.0, 200.0, '1', 2, 1),
(10, 'Temperature Sensor MQTT', 'V3', 'double', '°C', '25.0', -10.0, 60.0, '1', 2, 1),
(11, 'NH3N Sensor MQTT', 'V4', 'double', 'mg/L', '2.0', 0.0, 20.0, '2', 2, 1),
(12, 'Turbidity Sensor MQTT', 'V5', 'double', 'NTU', '10.0', 0.0, 100.0, '1', 2, 1),
-- Device 2 (MQTT) - Actuators
(17, 'LED Control MQTT', 'D0', 'boolean', 'state', '0', 0.0, 1.0, '0', 2, 1),
(18, 'Pump Control MQTT', 'D1', 'boolean', 'state', '0', 0.0, 1.0, '0', 2, 1),
(19, 'Fan Speed MQTT', 'D2', 'string', '%', '50', 0.0, 100.0, '0', 2, 1),
(20, 'Valve Position MQTT', 'D3', 'string', 'degrees', '90', 0.0, 180.0, '0', 2, 1);

INSERT IGNORE INTO alarms (id, description, user_id, device_id, datastream_id, is_active, cooldown_minutes) VALUES
(1, 'pH Level Too High Alert', 1, 1, 1, TRUE, 1),
(2, 'Low Flow Rate Alert', 1, 1, 2, TRUE, 1),
-- Device 2 (MQTT) alarms
(3, 'MQTT pH Level Too High Alert', 1, 2, 7, TRUE, 1),
(4, 'MQTT Low Flow Rate Alert', 1, 2, 8, TRUE, 1);

INSERT IGNORE INTO alarm_conditions (id, alarm_id, operator, threshold) VALUES
(1, 1, '>', 8.0),
(2, 2, '<', 15.0),
-- Device 2 (MQTT) alarm conditions
(3, 3, '>', 8.0),
(4, 4, '<', 15.0);

CREATE INDEX idx_payloads_device_time ON payloads(device_id, server_time);
CREATE INDEX idx_payloads_datastream_time ON payloads(datastream_id, server_time);
CREATE INDEX idx_payloads_device_datastream_time ON payloads(device_id, datastream_id, server_time);
CREATE INDEX idx_device_commands_status ON device_commands(status, sent_at);

-- View untuk dashboard sensor data yang sudah dinormalisasi
CREATE OR REPLACE VIEW dashboard_sensor_data AS
SELECT 
    p.id,
    p.device_id,
    p.datastream_id,
    p.value,
    p.server_time,
    d.description as device_name,
    d.status as device_status,
    ds.description as sensor_name,
    ds.pin as sensor_pin,
    ds.unit as sensor_unit,
    ds.type as data_type,
    ds.min_value,
    ds.max_value,
    ds.decimal_value,
    u.name as user_name,
    u.email as user_email,
    u.id as user_id
FROM payloads p
LEFT JOIN devices d ON p.device_id = d.id
LEFT JOIN datastreams ds ON p.datastream_id = ds.id
LEFT JOIN users u ON d.user_id = u.id;

-- View untuk data widget yang menggabungkan widget config dengan data terbaru
CREATE VIEW widget_data AS
SELECT 
    w.id as widget_id,
    w.description as widget_description,
    w.type as widget_type,
    w.dashboard_id,
    JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.device_id')) AS device_id,
    JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.datastream_id')) AS datastream_id,
    d.description as device_name,
    d.status as device_status,
    ds.description as sensor_name,
    ds.pin as sensor_pin,
    ds.unit as sensor_unit,
    ds.type as data_type,
    ds.min_value,
    ds.max_value,
    ds.decimal_value,
    (SELECT p.value FROM payloads p 
     WHERE p.device_id = JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.device_id'))
     AND p.datastream_id = JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.datastream_id'))
     ORDER BY p.server_time DESC LIMIT 1) as latest_value,
    (SELECT p.server_time FROM payloads p 
     WHERE p.device_id = JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.device_id'))
     AND p.datastream_id = JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.datastream_id'))
     ORDER BY p.server_time DESC LIMIT 1) as latest_time
FROM widgets w
LEFT JOIN devices d ON d.id = JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.device_id'))
LEFT JOIN datastreams ds ON ds.id = JSON_UNQUOTE(JSON_EXTRACT(w.inputs, '$.datastream_id'));

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
