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
  `id` varchar(255) NOT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(15) DEFAULT NULL,
  `otp` int DEFAULT NULL,
  `refresh_token` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `password`, `name`, `email`, `created_at`, `last_login`, `phone`, `otp`, `refresh_token`) VALUES
('1baf7c6c', '$2b$10$y4hjgM6llmrWg1D/kBjnb.7Mg0nDj05rJLVJj3UqOPJY2zIPolXVq', 'Contoh', 'contoh@gmail.com', '2025-06-09 13:18:32', '2025-06-11 14:25:10', '', NULL, 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxYmFmN2M2YyIsImlhdCI6MTc0OTY1MTkxMCwidHlwZSI6InJlZnJlc2gifQ.ZxNZ1zKgPgCwYusAIp8Bwew5VN1XfbKB6tefLCIjTgw'),
('462733f7', '$2b$10$drXOCl6FOru0dryqjSPWiur5uKnJ9zfhmZuqqe4NIg3Gjm7fXAwHS', 'muh.adriano76', 'muh.adriano76@gmail.com', '2025-06-08 20:43:10', '2025-06-08 21:09:36', NULL, NULL, 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0NjI3MzNmNyIsImlhdCI6MTc0OTQxNjk3NiwidHlwZSI6InJlZnJlc2gifQ.bAhAFne2K9j9QW1VmUDe7f9Fa-EvteAMVuE5IoelfqQ'),
('c53039c5', 'GOOGLE_OAUTH_USER', 'Muh. Adriano', 'wedoung87@gmail.com', '2025-06-08 20:20:39', '2025-06-08 20:20:39', NULL, NULL, '');

CREATE TABLE IF NOT EXISTS `dashboards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `devices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` text,
  `board_type` varchar(255) DEFAULT NULL,
  `protocol` varchar(10) NOT NULL,
  `mqtt_topic` varchar(255) DEFAULT NULL,
  `mqtt_qos` enum('0','1','2') DEFAULT '0',
  `lora_profile` text,
  `key` text NOT NULL,
  `status` enum('offline','online') DEFAULT 'offline',
  `user_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payloads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `device_id` INT NOT NULL,
  `server_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `datastreams` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` TEXT NOT NULL,
  `pin` VARCHAR(10) NOT NULL,
  `type` VARCHAR(10) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `default_value` VARCHAR(255) NOT NULL,
  `min_value` DOUBLE NOT NULL,
  `max_value` DOUBLE NOT NULL,
  `decimal_value` VARCHAR(10) NOT NULL,
  `device_id` INT NOT NULL,
  `user_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payload_values` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `payload_id` INT NOT NULL,
  `datastream_id` INT NOT NULL,
  `value` FLOAT(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`payload_id`) REFERENCES `payloads` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`datastream_id`) REFERENCES `datastreams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `widgets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` TEXT,
  `dashboard_id` INT NOT NULL,
  `device_id` INT NOT NULL,
  `datastream_id` INT NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `layout` JSON NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`dashboard_id`) REFERENCES `dashboards` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`datastream_id`) REFERENCES `datastreams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `alarms` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `description` TEXT,
  `user_id` varchar(255) NOT NULL,
  `widget_id` INT NOT NULL,
  `operator` ENUM('=', '<', '>') NOT NULL,
  `threshold` FLOAT(10,3) DEFAULT NULL,
  `last_sended` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`widget_id`) REFERENCES `widgets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
