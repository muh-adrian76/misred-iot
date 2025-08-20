# 📱 PWA Manifest Documentation - MiSREd IoT

## Tentang File Manifest

File `manifest.json` adalah konfigurasi untuk Progressive Web App (PWA) yang memungkinkan aplikasi web berjalan seperti aplikasi native di perangkat mobile dan desktop.

## 🚀 Fitur yang Diaktifkan

1. **Instalasi Aplikasi** - User dapat menginstall aplikasi ke home screen
2. **Tampilan Fullscreen** - Aplikasi berjalan tanpa browser UI (standalone mode)
3. **Icon Aplikasi** - Icon muncul di home screen dan app drawer
4. **Splash Screen** - Loading screen dengan brand aplikasi
5. **Pengalaman Native** - Feel dan look seperti aplikasi mobile asli

## 📋 Penjelasan Konfigurasi

### Informasi Aplikasi
- **name**: "MiSREd IoT" - Nama lengkap (muncul saat instalasi)
- **short_name**: "MiSREd-IoT" - Nama pendek (home screen)
- **description**: "IoT Monitoring App" - Deskripsi aplikasi
- **start_url**: "/auth" - Halaman pertama yang dibuka (halaman login)

### Tampilan & Tema
- **display**: "standalone" - Mode fullscreen tanpa browser UI
- **background_color**: "#ffffff" - Warna splash screen
- **theme_color**: "#000000" - Warna status bar dan browser chrome

### Icon Aplikasi
- **192x192**: Icon untuk home screen dan notifikasi
- **512x512**: Icon beresolusi tinggi untuk splash screen
- **Format SVG**: Vector graphics yang scalable di semua ukuran

## ⚠️ Hal Penting untuk Developer

### Setelah Mengubah Manifest:
1. **Clear browser cache** dan reload aplikasi
2. **Test instalasi PWA** di berbagai perangkat (Android, iOS, Desktop)
3. **Verifikasi icon** tampil dengan benar di semua ukuran
4. **Test offline functionality** jika ada service worker

### Browser Support:
- ✅ Chrome/Edge (Android & Desktop)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ⚠️ iOS Safari memiliki beberapa limitasi PWA

### Testing PWA:
1. Buka Chrome DevTools > Application > Manifest
2. Cek semua properti terbaca dengan benar
3. Test "Add to Home Screen" atau "Tambahkan ke layar utama" di mobile browser
4. Verifikasi aplikasi berjalan dalam mode standalone

## 🔧 Cara Menambah Icon Size Baru

```json
{
  "src": "/web-logo.svg",
  "sizes": "72x72",
  "type": "image/svg+xml",
  "purpose": "any maskable"
}
```

## 📚 Referensi
- [MDN Web App Manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse PWA Audit](https://web.dev/lighthouse-pwa/)
