// Timezone utility functions untuk formatting waktu dengan zona waktu Indonesia
import { timezoneConfig } from './helper';

/**
 * Format timestamp dengan timezone yang dikonfigurasi (default: Asia/Jakarta)
 * Mengkonversi UTC timestamp ke local time Indonesia dengan format lengkap
 * @param {string|Date|number} timestamp - Input timestamp dalam format apapun
 * @param {object} options - Options untuk custom formatting
 * @returns {string} Formatted timestamp string dengan timezone info
 */
export function formatTimestamp(timestamp, options = {}) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  // Default options untuk format Indonesia (DD/MM/YYYY HH:mm:ss)
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
    console.error('Error formatting timestamp:', error);
    return 'Format Error';
  }
}

/**
 * Format waktu saja (HH:mm) tanpa tanggal dan timezone display
 * Berguna untuk display jam pada widget atau komponen kecil
 * @param {string|Date|number} timestamp 
 * @returns {string} Formatted time string (HH:mm)
 */
export function formatTimeOnly(timestamp) {
  return formatTimestamp(timestamp, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezoneConfig.timezone,
  }).replace(` (${timezoneConfig.display})`, '');
}

/**
 * Format tanggal saja (DD/MM/YYYY) tanpa waktu dan timezone display
 * @param {string|Date|number} timestamp 
 * @returns {string} Formatted date string
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
 * Get timezone display string
 * @returns {string} Timezone display (e.g., "GMT +7")
 */
export function getTimezoneDisplay() {
  return timezoneConfig.display;
}

/**
 * Get configured timezone name
 * @returns {string} Timezone name (e.g., "Asia/Jakarta")
 */
export function getTimezoneName() {
  return timezoneConfig.timezone;
}

/**
 * Get timezone offset in hours
 * @returns {number} Offset in hours (e.g., 7 for GMT+7)
 */
export function getTimezoneOffset() {
  return timezoneConfig.offset;
}
