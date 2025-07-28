// Timezone utility functions
import { timezoneConfig } from './helper';

/**
 * Format timestamp dengan timezone yang dikonfigurasi
 * @param {string|Date|number} timestamp 
 * @param {object} options - Options untuk formatting
 * @returns {string} Formatted timestamp string
 */
export function formatTimestamp(timestamp, options = {}) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezoneConfig.timezone,
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
 * Format waktu saja (tanpa tanggal) dengan timezone yang dikonfigurasi
 * @param {string|Date|number} timestamp 
 * @returns {string} Formatted time string
 */
export function formatTimeOnly(timestamp) {
  return formatTimestamp(timestamp, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezoneConfig.timezone,
  }).replace(` (${timezoneConfig.display})`, '');
}

/**
 * Format tanggal saja (tanpa waktu) dengan timezone yang dikonfigurasi
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
