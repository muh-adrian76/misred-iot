import { api } from "./config";

export const alarmAPI = {
  // Get all alarms
  getAlarms: async (deviceId = null) => {
    const params = deviceId ? `?device_id=${deviceId}` : '';
    const response = await api.get(`/notifications/alarms${params}`);
    return response.data;
  },

  // Get alarm by ID
  getAlarmById: async (alarmId) => {
    const response = await api.get(`/notifications/alarms/${alarmId}`);
    return response.data;
  },

  // Create alarm
  createAlarm: async (alarmData) => {
    const response = await api.post('/notifications/alarms', alarmData);
    return response.data;
  },

  // Update alarm
  updateAlarm: async (alarmId, alarmData) => {
    const response = await api.put(`/notifications/alarms/${alarmId}`, alarmData);
    return response.data;
  },

  // Delete alarm
  deleteAlarm: async (alarmId) => {
    const response = await api.delete(`/notifications/alarms/${alarmId}`);
    return response.data;
  },

  // Toggle alarm status
  toggleAlarmStatus: async (alarmId) => {
    const response = await api.patch(`/notifications/alarms/${alarmId}/toggle`);
    return response.data;
  },

  // Get notification history
  getNotificationHistory: async (limit = 50) => {
    const response = await api.get(`/notifications/history?limit=${limit}`);
    return response.data;
  },

  // Test WAHA connection
  testWahaConnection: async () => {
    const response = await api.get('/notifications/test/waha');
    return response.data;
  },

  // Send test notification
  sendTestNotification: async (phone, message) => {
    const response = await api.post('/notifications/test/send', { phone, message });
    return response.data;
  }
};

export default alarmAPI;
