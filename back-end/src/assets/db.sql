CREATE DATABASE IF NOT EXISTS misred_iot;
USE misred_iot;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password TEXT NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    otp INT,
    refresh_token TEXT
);

CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    board_type VARCHAR(255),
    protocol ENUM('http', 'mqtt', 'lora') NOT NULL,
    mqtt_topic VARCHAR(255),
    mqtt_qos ENUM('0', '1', '2') DEFAULT '0',
    lora_profile TEXT,
    refresh_token TEXT
);

CREATE TABLE IF NOT EXISTS payloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    ph FLOAT(10,3),
    cod FLOAT(10,3),
    tss FLOAT(10,3),
    nh3n FLOAT(10,3),
    flow FLOAT(10,3),
    server_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS widgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    device_id INT NOT NULL,
    sensor_type ENUM('ph', 'cod', 'tss', 'nh3n', 'flow') NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alarms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description TEXT,
    device_id INT NOT NULL,
    operator ENUM('=', '<', '>') NOT NULL,
    threshold FLOAT(10,3),
    last_sended TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sensor_type ENUM('ph', 'cod', 'tss', 'nh3n', 'flow') NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
