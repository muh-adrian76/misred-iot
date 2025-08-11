// Fungsi utilitas timezone untuk memformat waktu dengan zona waktu Indonesia
import { timezoneConfig } from './helper';

/**
 * Format timestamp dengan timezone terkonfigurasi (default: Asia/Jakarta)
 * Mengonversi timestamp UTC ke waktu lokal Indonesia dengan format lengkap
 * @param {string|Date|number} timestamp - Input timestamp dalam format apa pun
 * @param {object} options - Opsi untuk kustomisasi format
 * @returns {string} String timestamp terformat dengan info timezone
 */
export function formatTimestamp(timestamp, options = {}) {
  if (!timestamp) return 'Tidak diketahui';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Tanggal tidak valid';
  
  // Opsi default untuk format Indonesia (DD/MM/YYYY HH:mm:ss)
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezoneConfig.timezone, // Asia/Jakarta
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  try {
    return date.toLocaleString('id-ID', formatOptions) + ` (${timezoneConfig.display})`;
  } catch (error) {
    console.error('Kesalahan saat memformat timestamp:', error);
    return 'Kesalahan Format';
  }
}

/**
 * Format hanya jam (HH:mm) tanpa tanggal dan tampilan timezone
 * Berguna untuk menampilkan jam pada widget atau komponen kecil
 * @param {string|Date|number} timestamp 
 * @returns {string} String waktu terformat (HH:mm)
 */
export function formatTimeOnly(timestamp) {
  return formatTimestamp(timestamp, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezoneConfig.timezone,
  }).replace(` (${timezoneConfig.display})`, '');
}

/**
 * Format hanya tanggal (DD/MM/YYYY) tanpa waktu dan tampilan timezone
 * @param {string|Date|number} timestamp 
 * @returns {string} String tanggal terformat
 */
export function formatDateOnly(timestamp) {
  return formatTimestamp(timestamp, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezoneConfig.timezone,
  }).replace(` (${timezoneConfig.display})`, '');
}

/**
 * Ambil string tampilan timezone
 * @returns {string} Tampilan timezone (contoh, "GMT +7")
 */
export function getTimezoneDisplay() {
  return timezoneConfig.display;
}

/**
 * Ambil nama timezone terkonfigurasi
 * @returns {string} Nama timezone (contoh, "Asia/Jakarta")
 */
export function getTimezoneName() {
  return timezoneConfig.timezone;
}

/**
 * Ambil offset timezone dalam jam
 * @returns {number} Offset dalam jam (contoh, 7 untuk GMT+7)
 */
export function getTimezoneOffset() {
  return timezoneConfig.offset;
}
