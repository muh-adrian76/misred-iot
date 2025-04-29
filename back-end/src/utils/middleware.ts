import { connect } from "mqtt";
import mysql from "mysql2/promise";

// MySQL
export const db = await mysql.createConnection({
  host: Bun.env.DB_HOST,
  user: Bun.env.DB_USER,
  password: Bun.env.DB_PASSWORD,
  database: Bun.env.DB_NAME,
  port: Number(Bun.env.DB_PORT),
});

// MQTT
export const mqttClient = connect(Bun.env.RABBITMQ_URL_MQTT!); // Contoh: 'mqtt://localhost:1883'

// CHIRPSTACK
const CHIRPSTACK_URL = Bun.env.CHIRPSTACK_URL;
const SERVER_URL = Bun.env.SERVER_URL;

interface ApplicationResponse {
  id: string;
}

interface DeviceResponse {
  device: {
    dev_eui: string;
  }
}

interface IntegrationResponse {
  success: boolean;
}

// Fungsi untuk membuat aplikasi baru
async function createApplication(jwt_token: string): Promise<string> {
  const response = await fetch(`${CHIRPSTACK_URL}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt_token}`
    },
    body: JSON.stringify({
      application: {
        name: 'IoT-Monitoring-System',
        description: 'Monitoring sensor IoT',
        organization_id: '1',
        service_profile_id: 'YOUR_SERVICE_PROFILE_ID'
      }
    })
  });

  const data: ApplicationResponse = await response.json();
  console.log('Application created:', data);
  return data.id;
}

// Fungsi untuk menambahkan integrasi HTTP
async function addHttpIntegration(applicationId: string, jwt_token: string): Promise<void> {
  const response = await fetch(`${CHIRPSTACK_URL}/api/applications/${applicationId}/integrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt_token}`
    },
    body: JSON.stringify({
      http: {
        headers: {},
        json: true,
        uplink_data_url: `${SERVER_URL}/device`,
        join_notification_url: `${SERVER_URL}/payload`
      }
    })
  });

  const data: IntegrationResponse = await response.json();
  console.log('HTTP Integration added:', data);
}

// Fungsi untuk menambahkan perangkat baru
async function addDevice(applicationId: string, devEUI: string, deviceProfileId: string, deviceName: string, jwt_token: string): Promise<string> {
  const response = await fetch(`${CHIRPSTACK_URL}/api/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt_token}`
    },
    body: JSON.stringify({
      device: {
        application_id: applicationId,
        description: 'Sensor IoT',
        dev_eui: devEUI,
        device_profile_id: deviceProfileId,
        name: deviceName,
        skip_fcnt_check: true
      }
    })
  });

  const data: DeviceResponse = await response.json();
  console.log('Device added:', data);
  return data.device.dev_eui;
}

// Fungsi untuk menambahkan device keys (jika menggunakan OTAA)
async function addDeviceKeys(devEUI: string, appKey: string, jwt_token: string): Promise<void> {
  const response = await fetch(`${CHIRPSTACK_URL}/api/devices/${devEUI}/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt_token}`
    },
    body: JSON.stringify({
      deviceKeys: {
        app_key: appKey
      }
    })
  });

  const data = await response.json();
  console.log('Device keys added:', data);
}

// Fungsi utama untuk menjalankan semua proses otomatisasi
export const Chirpstack = async function main(token: string) {
  try {
    const applicationId = await createApplication(token);
    await addHttpIntegration(applicationId, token);

    const devEUI = 'AABBCCDDEEFF0011'; // Ganti dengan DevEUI perangkat
    const deviceProfileId = 'YOUR_DEVICE_PROFILE_ID';
    const appKey = 'YOUR_APP_KEY'; // Ganti dengan AppKey (untuk OTAA)

    const deviceId = await addDevice(applicationId, devEUI, deviceProfileId, 'my-new-device', token);
    await addDeviceKeys(deviceId, appKey, token);

    console.log('Berhasil menambah perangkat LoRa.');
    return deviceId;
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}