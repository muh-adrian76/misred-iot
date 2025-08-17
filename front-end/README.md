# Front-end - Aplikasi Web MiSREd IoT

Folder `front-end` berisi aplikasi web client untuk sistem monitoring dan kontrol IoT yang dibangun menggunakan **Next.js 14** dengan **React 18**. Aplikasi ini menyediakan antarmuka pengguna yang responsif dan interaktif untuk mengelola perangkat IoT, monitoring data sensor, dan konfigurasi sistem.

## 🏗️ Arsitektur Frontend

### Kerangka Kerja dan Teknologi Utama

- **Next.js 15**: Kerangka kerja React dengan Perute Aplikasi
- **React 18**: Pustaka UI dengan komponen server
- **TypeScript/JavaScript**: Bahasa pemrograman utama
- **Tailwind CSS**: Kerangka kerja CSS utilitas-pertama
- **shadcn/ui**: Pustaka komponen modern
- **Bun.js**: Runtime JavaScript dan pengelola paket

## 📁 Struktur Folder

```
front-end/
├── .env                      # Variabel lingkungan (pengembangan)
├── .env.example             # Template variabel lingkungan
├── .gitignore               # Aturan ignore Git untuk frontend
├── package.json             # Dependensi dan skrip NPM/Bun
├── bun.lock                 # Lockfile dependensi Bun
├── next.config.js           # Konfigurasi Next.js
├── next.config.mjs          # Konfigurasi Next.js (modul ES)
├── jsconfig.json            # Konfigurasi alias jalur JavaScript
├── components.json          # Konfigurasi komponen shadcn/ui
├── tailwind.config.js       # Konfigurasi Tailwind CSS
├── postcss.config.mjs       # Konfigurasi PostCSS
├── .next/                   # Keluaran build Next.js (dibuat otomatis)
├── public/                  # Aset statis (gambar, ikon, dll)
└── src/                     # Kode sumber utama aplikasi
    ├── app/                 # Perute Aplikasi Next.js (routing & layouts)
    ├── components/          # Komponen React yang dapat digunakan ulang
    ├── hooks/               # Hook React kustom
    ├── lib/                 # Fungsi utilitas dan pembantu
    └── providers/           # Penyedia konteks (auth, websocket, dll)
```

## 📄 Penjelasan File Konfigurasi

### Berkas Lingkungan (`.env`)

Berisi konfigurasi lingkungan untuk pengembangan:

```properties
# Konfigurasi Server
NEXT_PUBLIC_FRONTEND_URL=http://localhost:7600    # URL frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:7601     # URL API backend
NEXT_PUBLIC_BACKEND_WS=ws://localhost:7601        # WebSocket backend

# Layanan Eksternal
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...                  # ID klien Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=...              # Rahasia Google OAuth
NEXT_PUBLIC_RESEND_API_KEY=...                    # Kunci API layanan email

# Pengaturan Aplikasi
NEXT_PUBLIC_OTP_TIME=10                           # Kedaluwarsa OTP (menit)
NEXT_PUBLIC_LOGO=web-logo.svg                     # Logo aplikasi
NEXT_PUBLIC_GMT_ZONE=+7                           # Offset zona waktu
```

### Berkas Build dan Konfigurasi

- **`package.json`**: Dependensi, skrip, dan metadata proyek
- **`next.config.js/mjs`**: Konfigurasi Next.js (routing, build, optimasi)
- **`tailwind.config.js`**: Konfigurasi Tailwind CSS (tema, warna, spasi)
- **`jsconfig.json`**: Alias jalur untuk impor (`@/components`, `@/lib`)
- **`components.json`**: Konfigurasi shadcn/ui untuk styling komponen
- **`postcss.config.mjs`**: Plugin PostCSS (Tailwind, Autoprefixer)

## 🚀 Skrip yang Tersedia

### Skrip Pengembangan

```bash
# Jalankan server pengembangan dengan Bun
bun run dev-bun              # Port 7600, dengan Turbopack
bun run dev                  # Alternatif dengan NPM

# Build produksi
bun run build-bun            # Build dengan Bun
bun run build                # Build dengan NPM

# Mulai server produksi
bun run start-bun            # Mulai produksi dengan Bun
bun run start                # Mulai produksi dengan NPM

# Linting dan Kualitas
bun run lint-bun             # ESLint dengan Bun
bun run lint                 # ESLint dengan NPM

# Komponen UI
bun run ui-bun <komponen>   # Instalasi komponen shadcn/ui dengan Bun
bun run ui <komponen>       # Instalasi komponen shadcn/ui dengan NPM
```

### Contoh Penggunaan

```bash
# Pengembangan
cd front-end
bun install
bun run dev-bun

# Build Produksi
bun run build-bun
bun run start-bun

# Instalasi Komponen UI
bun run ui-bun button        # Instalasi komponen tombol
bun run ui-bun dialog        # Instalasi komponen dialog
```

## 🎨 Komponen UI dan Styling

### Komponen shadcn/ui

Kerangka kerja UI modern dengan komponen yang dapat dikustomisasi:

- **Layout**: Dialog, Sheet, Popover, Accordion
- **Forms**: Input, Button, Select, Checkbox, Radio
- **Data Display**: Table, Badge, Avatar, Progress
- **Navigation**: Breadcrumb, Tabs, Navigation Menu
- **Feedback**: Toast, Alert, Loading States

### Kelas Tailwind CSS

Menggunakan pendekatan utilitas-pertama dengan tema kustom:

```css
/* Contoh styling konsisten */
.btn-primary     /* Tombol utama dengan warna merek */
.card-shadow     /* Bayangan konsisten untuk kartu */
.text-muted      /* Warna teks sekunder */
.border-accent   /* Border dengan warna aksen */
```

## 📱 Fitur Aplikasi Frontend

### 1. Autentikasi & Otorisasi

- **Masuk/Daftar**: Formulir autentikasi dengan validasi
- **Google OAuth**: Integrasi masuk Google
- **Manajemen JWT**: Penyimpanan dan pembaruan token
- **Akses Berbasis Peran**: Izin Admin vs Pengguna

### 2. Dasbor Waktu Nyata

- **Sistem Widget**: Pembuat dasbor seret-dan-lepas
- **Komponen Grafik**: Grafik garis, area, batang, pai, pengukur
- **Penyaringan Data**: Filter rentang waktu dan jumlah data
- **Tata Letak Responsif**: Sistem grid yang adaptif

### 3. Manajemen Perangkat

- **Operasi CRUD**: Buat, Baca, Perbarui, Hapus perangkat
- **Status Perangkat**: Pemantauan koneksi waktu nyata
- **Pembaruan OTA**: Unggah firmware melalui udara
- **Konfigurasi Aliran Data**: Manajemen konfigurasi sensor

### 4. Sistem Alarm

- **Peringatan Bersyarat**: Pemicu alarm berbasis aturan
- **Notifikasi Multi-channel**: Browser + WhatsApp
- **Riwayat Alarm**: Log dan pelacakan kejadian alarm
- **Ambang Batas Kustom**: Kondisi alarm yang ditentukan pengguna

### 5. Visualisasi Data

- **Grafik Interaktif**: Zoom, geser, tooltip hover
- **Fungsi Ekspor**: Ekspor PDF dan CSV
- **Pembaruan Waktu Nyata**: Streaming data WebSocket
- **Data Historis**: Penelusuran data deret waktu

## 🔧 Dependensi Teknologi

### Dependensi Inti

```json
{
  "next": "^14.x",                    // Kerangka kerja Next.js
  "react": "^18.x",                   // Pustaka React
  "react-dom": "^18.x",               // Renderer React DOM
  "tailwindcss": "^3.x",             // Kerangka kerja CSS
  "typescript": "^5.x"                // Dukungan TypeScript
}
```

### UI dan Styling

```json
{
  "@radix-ui/react-*": "^1.x",       // Primitif UI Radix
  "lucide-react": "^0.x",            // Pustaka ikon
  "framer-motion": "^11.x",          // Pustaka animasi
  "class-variance-authority": "^0.x", // Varian CSS
  "clsx": "^2.x",                    // Nama kelas bersyarat
  "tailwind-merge": "^2.x"           // Penggabungan kelas Tailwind
}
```

### Data dan Manajemen State

```json
{
  "@tanstack/react-query": "^5.x",   // Manajemen state server
  "react-hook-form": "^7.x",         // Manajemen formulir
  "zod": "^3.x",                     // Validasi skema
  "zustand": "^4.x"                  // Manajemen state klien
}
```

### Grafik dan Visualisasi

```json
{
  "recharts": "^2.x",                // Pustaka grafik
  "react-grid-layout": "^1.x",       // Sistem tata letak grid
  "@dnd-kit/core": "^6.x",          // Seret dan lepas
  "canvas-confetti": "^1.x"          // Efek perayaan
}
```

### Integrasi Eksternal

```json
{
  "@react-pdf/renderer": "^3.x",     // Pembuatan PDF
  "sonner": "^1.x",                  // Notifikasi toast
  "next-view-transitions": "^0.x",   // Transisi halaman
  "@capacitor/core": "^6.x"          // Dukungan aplikasi mobile
}
```

## 🔌 API Integration

### Backend Communication

```javascript
// Konfigurasi API client
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS;

// REST API calls
fetchFromBackend('/devices')          // GET devices
fetchFromBackend('/alarms', { method: 'POST' })  // POST alarm

// WebSocket real-time
useWebSocket(WS_URL)                  // Real-time data updates
```

### Authentication Flow

```javascript
// Login process
1. User credentials → Backend Auth API
2. JWT token received → localStorage
3. Protected routes check token
4. Auto refresh on expiry
```

## 📊 Performance Optimizations

### Next.js Optimizations

- **App Router**: Server components untuk loading cepat
- **Image Optimization**: Automatic WebP conversion
- **Bundle Splitting**: Code splitting otomatis
- **Turbopack**: Fast refresh development

### React Optimizations

- **Memoization**: `useMemo`, `useCallback`, `React.memo`
- **Lazy Loading**: Dynamic imports untuk components
- **Virtual Scrolling**: Untuk list data besar
- **Debouncing**: Search dan input optimizations

### CSS Optimizations

- **Tailwind JIT**: Just-in-time CSS compilation
- **CSS Purging**: Unused styles removal
- **Critical CSS**: Above-the-fold styling
- **Dark Mode**: CSS variables untuk theming

## 🌐 Responsive Design

### Breakpoint System

```css
/* Tailwind CSS breakpoints */
sm: '640px'     /* Tablet portrait */
md: '768px'     /* Tablet landscape */
lg: '1024px'    /* Desktop */
xl: '1280px'    /* Large desktop */
2xl: '1536px'   /* Extra large */
```

### Mobile-First Components

- **Navigation**: Hamburger menu untuk mobile
- **Tables**: Horizontal scroll pada mobile
- **Forms**: Touch-friendly input sizing
- **Dashboard**: Stack layout untuk mobile

## 🔒 Security Best Practices

### Environment Variables

```bash
# Hanya gunakan NEXT_PUBLIC_ untuk data yang aman dilihat client
NEXT_PUBLIC_API_URL=...              # ✅ Safe untuk client
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...     # ✅ Safe untuk client

# Jangan gunakan NEXT_PUBLIC_ untuk data sensitif
API_SECRET_KEY=...                   # ❌ Server-only
DATABASE_PASSWORD=...                # ❌ Server-only
```

### Content Security Policy

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]
```

## 🚀 Deployment

### Build Process

```bash
# Production build
bun run build-bun

# Build output
.next/static/                        # Static assets
.next/server/                        # Server-side code
.next/standalone/                    # Standalone server (optional)
```

### Environment Configuration

```bash
# Production environment variables
NEXT_PUBLIC_FRONTEND_URL=https://app.misred-iot.com
NEXT_PUBLIC_BACKEND_URL=https://api.misred-iot.com
NEXT_PUBLIC_BACKEND_WS=wss://api.misred-iot.com
```

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   # Clear cache
   rm -rf .next node_modules
   bun install
   ```

2. **Port Conflicts**:
   ```bash
   # Check port usage
   netstat -tulpn | grep :7600
   
   # Kill process
   kill -9 <PID>
   ```

3. **Environment Variables Not Loading**:
   - Pastikan prefix `NEXT_PUBLIC_` untuk client-side
   - Restart development server setelah perubahan `.env`

4. **WebSocket Connection Issues**:
   - Cek firewall settings
   - Verify WebSocket URL di browser console

## 📝 Development Guidelines

### Code Style

- **ESLint**: Gunakan konfigurasi yang disediakan
- **Prettier**: Format code otomatis
- **TypeScript**: Gunakan type safety
- **Component Naming**: PascalCase untuk components

### Component Structure

```jsx
// Template component structure
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ComponentName({ prop1, prop2 }) {
  // 1. Hooks
  const [state, setState] = useState(initial)
  
  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies])
  
  // 3. Event handlers
  const handleEvent = () => {
    // Handler logic
  }
  
  // 4. Render
  return (
    <div className="component-container">
      {/* JSX content */}
    </div>
  )
}
```

---

