"use client";

import { useEffect, useRef } from 'react';

/**
 * Hook untuk mengelola Service Worker registration
 * Khusus untuk mendukung notifikasi browser di perangkat mobile
 * 
 * @param {boolean} enabled - Apakah service worker diaktifkan
 * @returns {object} - Status registrasi dan fungsi utility
 */
export function useServiceWorker(enabled = true) {
  const registrationRef = useRef(null);
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('🚫 Service Worker tidak didukung atau dinonaktifkan');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        console.log('🔧 Mendaftarkan Service Worker...');
        
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        registrationRef.current = registration;
        isRegisteredRef.current = true;

        console.log('✅ Service Worker terdaftar dengan scope:', registration.scope);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('✨ Service Worker baru tersedia - akan aktif setelah refresh');
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          // console.log('📨 Pesan dari Service Worker:', event.data);
          
          // Handle notification click messages
          if (event.data && event.data.type === 'notification-click') {
            // Dispatch custom event for notification clicks
            window.dispatchEvent(new CustomEvent('sw-notification-click', {
              detail: {
                notificationId: event.data.notificationId,
                data: event.data.data
              }
            }));
          }
        });

      } catch (error) {
        console.error('❌ Gagal mendaftarkan Service Worker:', error);
        isRegisteredRef.current = false;
      }
    };

    // Check if service worker is already registered
    navigator.serviceWorker.getRegistration('/sw.js')
      .then((existingRegistration) => {
        if (existingRegistration) {
          registrationRef.current = existingRegistration;
          isRegisteredRef.current = true;
        } else {
          registerServiceWorker();
        }
      })
      .catch((error) => {
        console.error('❌ Error checking Service Worker registration:', error);
        registerServiceWorker();
      });

    // Cleanup function
    return () => {
      // Service worker akan tetap aktif bahkan setelah component unmount
      // Ini adalah behavior yang diinginkan untuk notifications
    };
  }, [enabled]);

  // Function to get current registration
  const getRegistration = () => {
    return registrationRef.current;
  };

  // Function to show notification via service worker
  const showNotification = async (title, options = {}) => {
    if (!isRegisteredRef.current || !registrationRef.current) {
      throw new Error('Service Worker belum terdaftar');
    }

    const registration = registrationRef.current;
    if (!registration.showNotification) {
      throw new Error('Service Worker tidak mendukung showNotification');
    }

    const notificationOptions = {
      icon: '/web-logo.svg',
      badge: '/web-logo.svg',
      ...options
    };

    return await registration.showNotification(title, notificationOptions);
  };

  // Function to check if notifications are supported
  const isNotificationSupported = () => {
    return isRegisteredRef.current && 
           registrationRef.current && 
           typeof registrationRef.current.showNotification === 'function';
  };

  return {
    isRegistered: isRegisteredRef.current,
    registration: registrationRef.current,
    getRegistration,
    showNotification,
    isNotificationSupported
  };
}
