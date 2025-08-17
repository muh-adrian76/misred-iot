# Public Assets - Aset Statis Frontend MiSREd IoT

Folder `public` berisi semua aset statis yang digunakan oleh aplikasi frontend seperti gambar, ikon, font, dan file media lainnya. Semua file dalam folder ini dapat diakses langsung melalui URL relatif dari root domain aplikasi.

## 📁 Struktur Folder Public

```
public/
├── web-logo.svg                     # Logo utama aplikasi (SVG)
├── logo-polines.webp                # Logo Politeknik Negeri Semarang
├── misred-blue.png                  # Logo MiSREd versi biru
├── misred-red.png                   # Logo MiSREd versi merah
├── misred-text-red.png              # Logo MiSREd dengan teks merah
├── misred-text.png                  # Logo MiSREd dengan teks default
├── bg-landing.webp                  # Gambar latar halaman arahan
├── bg-landing_compressed.webp       # Latar halaman arahan (terkompresi)
├── logo-font.ttf                    # Font kustom untuk logo
├── 401.svg                          # Ikon halaman tidak diotorisasi (401)
├── 404.svg                          # Ikon halaman tidak ditemukan (404)
├── alarm.svg                        # Ikon representasi alarm
├── datastream.svg                   # Ikon representasi aliran data
├── device.svg                       # Ikon representasi perangkat
└── widget.svg                       # Ikon representasi widget
```

## 🖼️ Deskripsi File Assets

### Logo dan Branding

#### `web-logo.svg`
- **Fungsi**: Logo utama aplikasi dalam format SVG
- **Ukuran**: Vektor (dapat diskalakan)
- **Penggunaan**: Header aplikasi, favicon, layar pemuatan
- **Format**: SVG (Grafik Vektor yang Dapat Diskalakan)
- **Keunggulan**: Responsif di semua ukuran layar, ukuran berkas kecil

#### `logo-polines.webp`
- **Fungsi**: Logo resmi Politeknik Negeri Semarang
- **Ukuran**: Format WebP yang dioptimalkan
- **Penggunaan**: Footer, halaman tentang, dokumentasi resmi
- **Format**: WebP (Kompresi tinggi, kualitas baik)

#### Varian Logo MiSREd
```
misred-blue.png          # Logo dengan aksen warna biru
misred-red.png           # Logo dengan aksen warna merah (utama)
misred-text-red.png      # Logo dengan teks, warna merah
misred-text.png          # Logo dengan teks, warna bawaan
```

- **Fungsi**: Logo brand MiSREd dalam berbagai variasi warna
- **Ukuran**: PNG format dengan transparency
- **Penggunaan**: 
  - Landing page hero section
  - Email templates dan notifications
  - Print materials dan export PDF
  - Social media sharing previews

### Background Images

#### `bg-landing.webp` dan `bg-landing_compressed.webp`
- **Fungsi**: Background image untuk halaman landing
- **Format**: WebP untuk optimal performance
- **Ukuran**: 
  - `bg-landing.webp`: High quality version
  - `bg-landing_compressed.webp`: Compressed untuk mobile/slow connections
- **Penggunaan**: 
  ```css
  /* Responsive background dengan fallback */
  .landing-bg {
    background-image: url('/bg-landing_compressed.webp');
  }
  
  @media (min-width: 768px) {
    .landing-bg {
      background-image: url('/bg-landing.webp');
    }
  }
  ```
- **Optimasi**: Lazy loading dan responsive delivery

### Typography

#### `logo-font.ttf`
- **Fungsi**: Font kustom khusus untuk logo dan headings
- **Format**: TrueType Font (.ttf)
- **Penggunaan**: 
  ```css
  @font-face {
    font-family: 'LogoFont';
    src: url('/logo-font.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
  }
  
  .logo-text {
    font-family: 'LogoFont', sans-serif;
  }
  ```
- **Loading Strategy**: `font-display: swap` untuk performance

### Error Page Icons

#### `401.svg` - Unauthorized Access
- **Fungsi**: Ikon untuk halaman error 401 (Unauthorized)
- **Design**: Ilustrasi yang user-friendly untuk akses ditolak
- **Ukuran**: Vector SVG yang scalable
- **Penggunaan**: 
  ```jsx
  // Error 401 page
  <img src="/401.svg" alt="Akses Tidak Diizinkan" className="w-64 h-64" />
  ```

#### `404.svg` - Page Not Found
- **Fungsi**: Ikon untuk halaman error 404 (Not Found)
- **Design**: Ilustrasi yang membantu user memahami halaman tidak ditemukan
- **Penggunaan**: 
  ```jsx
  // Error 404 page
  <img src="/404.svg" alt="Halaman Tidak Ditemukan" className="w-64 h-64" />
  ```

### Feature Icons

#### `alarm.svg` - Sistem Alarm
- **Fungsi**: Representasi visual sistem alarm dan notifikasi
- **Design**: Ikon bell/alarm yang mudah dikenali
- **Penggunaan**:
  - Navigation menu untuk halaman alarm
  - Dashboard widget headers
  - Notification indicators
  ```jsx
  <img src="/alarm.svg" alt="Sistem Alarm" className="w-6 h-6" />
  ```

#### `datastream.svg` - Aliran Data
- **Fungsi**: Representasi konfigurasi sensor dan aliran data
- **Design**: Ikon yang menggambarkan flow data/stream
- **Penggunaan**:
  - Menu navigasi untuk datastream management
  - Feature cards pada landing page
  - Tutorial dan documentation

#### `device.svg` - Perangkat IoT
- **Fungsi**: Representasi perangkat IoT/sensor
- **Design**: Ikon device/hardware yang generic
- **Penggunaan**:
  - Device management interface
  - Dashboard device list
  - Device status indicators
  ```jsx
  <img src="/device.svg" alt="Perangkat IoT" className="w-8 h-8" />
  ```

#### `widget.svg` - Dashboard Widgets
- **Fungsi**: Representasi widget dashboard dan visualisasi data
- **Design**: Ikon chart/graph untuk dashboard elements
- **Penggunaan**:
  - Widget selection interface
  - Dashboard configuration
  - Data visualization sections

## 🔧 Implementasi dan Penggunaan

### Next.js Static Assets

Semua file dalam folder `public` dapat diakses dengan path relatif:

```jsx
// Penggunaan dalam React components
import Image from 'next/image'

// Logo utama dengan optimasi Next.js
<Image 
  src="/web-logo.svg" 
  alt="MiSREd IoT Logo" 
  width={120} 
  height={40}
  priority={true}  // Untuk logo yang critical
/>

// Background image dengan CSS
<div className="bg-[url('/bg-landing.webp')] bg-cover bg-center">
  Content here
</div>

// Feature icons
<img src="/device.svg" alt="Perangkat" className="w-6 h-6" />
```

### Font Loading Optimization

```css
/* CSS untuk loading font kustom */
@font-face {
  font-family: 'LogoFont';
  src: url('/logo-font.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;  /* Optimal loading strategy */
}

/* Usage in components */
.brand-heading {
  font-family: 'LogoFont', 'Arial', sans-serif;
  letter-spacing: -0.02em;
}
```

### Responsive Image Strategy

```jsx
// Responsive background dengan multiple formats
const BackgroundImage = () => {
  return (
    <div className="relative w-full h-screen">
      <picture>
        {/* High quality untuk desktop */}
        <source 
          media="(min-width: 768px)" 
          srcSet="/bg-landing.webp" 
          type="image/webp" 
        />
        {/* Compressed untuk mobile */}
        <source 
          media="(max-width: 767px)" 
          srcSet="/bg-landing_compressed.webp" 
          type="image/webp" 
        />
        {/* Fallback */}
        <img 
          src="/bg-landing.webp" 
          alt="Landing Background"
          className="w-full h-full object-cover"
        />
      </picture>
    </div>
  )
}
```

## 📊 Optimasi Performance

### Image Optimization

1. **Format Selection**:
   - **SVG**: Untuk icons dan logos (vector, scalable)
   - **WebP**: Untuk photos dan complex images (better compression)
   - **PNG**: Untuk images dengan transparency requirements
   - **TTF**: Untuk custom fonts dengan good browser support

2. **Size Optimization**:
   ```bash
   # Contoh optimasi manual
   # Compress WebP images
   cwebp -q 80 bg-landing.jpg -o bg-landing.webp
   cwebp -q 60 bg-landing.jpg -o bg-landing_compressed.webp
   
   # Optimize SVG files
   svgo alarm.svg device.svg datastream.svg widget.svg
   ```

3. **Lazy Loading Strategy**:
   ```jsx
   // Lazy loading untuk images non-critical
   <Image 
     src="/bg-landing.webp"
     alt="Background"
     loading="lazy"  // Lazy load untuk non-critical images
     placeholder="blur"  // Show blur while loading
   />
   ```

### Caching Strategy

```javascript
// next.config.js - Cache headers untuk static assets
module.exports = {
  async headers() {
    return [
      {
        source: '/public/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'  // 1 year cache
          }
        ]
      },
      {
        source: '/public/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control', 
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}
```

## 🎨 Design Guidelines

### Logo Usage

1. **Primary Logo** (`web-logo.svg`):
   - Minimum size: 24px height
   - Clear space: 50% of logo height on all sides
   - Tidak boleh di-stretch atau distort

2. **Brand Colors**:
   ```css
   :root {
     --primary-red: #DC2626;     /* MiSREd red */
     --primary-blue: #2563EB;    /* MiSREd blue */
     --neutral-gray: #6B7280;    /* Secondary text */
     --background: #F9FAFB;      /* Light background */
   }
   ```

3. **Typography Hierarchy**:
   ```css
   .logo-primary {
     font-family: 'LogoFont', sans-serif;
     font-size: 2rem;
     font-weight: 600;
   }
   
   .heading-primary {
     font-family: 'Inter', sans-serif;
     font-size: 1.875rem;
     font-weight: 700;
   }
   ```

### Icon Usage

1. **Consistency**: Semua icons menggunakan style yang konsisten
2. **Sizing**: Default sizes: 16px, 20px, 24px, 32px
3. **Color**: Adaptable dengan CSS `currentColor`
4. **Accessibility**: Selalu include `alt` text yang descriptive

```jsx
// Icon usage examples
<img src="/device.svg" alt="Ikon Perangkat IoT" className="w-5 h-5 text-gray-600" />
<img src="/alarm.svg" alt="Ikon Sistem Alarm" className="w-6 h-6 text-red-500" />
```

## 🔒 Security Considerations

### Asset Security

1. **No Sensitive Data**: Folder public dapat diakses siapa saja
2. **File Permissions**: Pastikan read-only permissions
3. **Content Validation**: Validate semua uploaded assets

```bash
# Set proper permissions
chmod 644 public/*.svg
chmod 644 public/*.png
chmod 644 public/*.webp
chmod 644 public/*.ttf
```

### MIME Type Configuration

```javascript
// next.config.js - Secure MIME types
module.exports = {
  async headers() {
    return [
      {
        source: '/public/:path*.svg',
        headers: [
          { key: 'Content-Type', value: 'image/svg+xml' }
        ]
      },
      {
        source: '/public/:path*.webp',
        headers: [
          { key: 'Content-Type', value: 'image/webp' }
        ]
      }
    ]
  }
}
```

## 📱 Mobile Optimization

### Responsive Assets

```jsx
// Responsive image loading
const ResponsiveLogo = () => {
  return (
    <picture>
      {/* Desktop: Full logo dengan text */}
      <source 
        media="(min-width: 768px)" 
        srcSet="/misred-text.png" 
      />
      {/* Mobile: Icon only */}
      <img 
        src="/misred-blue.png" 
        alt="MiSREd Logo"
        className="h-8 w-auto"
      />
    </picture>
  )
}
```

### Touch-Friendly Icons

```css
/* Touch target sizes untuk mobile */
.mobile-icon {
  min-width: 44px;   /* Apple's recommended touch target */
  min-height: 44px;
  padding: 8px;
}
```

## 🚀 Best Practices

### Asset Management

1. **Naming Convention**:
   - Lowercase dengan hyphens: `bg-landing.webp`
   - Descriptive names: `alarm.svg` bukan `icon1.svg`
   - Version suffixes: `logo-v2.svg`

2. **File Organization**:
   ```
   public/
   ├── icons/           # Untuk icons yang banyak (optional)
   ├── images/          # Untuk images yang banyak (optional)
   ├── fonts/           # Untuk fonts yang banyak (optional)
   └── favicon.ico      # Browser favicon
   ```

3. **Version Control**:
   - Commit original source files jika ada
   - Document optimization steps
   - Keep backup dari assets yang sudah optimized

### Performance Monitoring

```javascript
// Monitor asset loading performance
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const perfEntries = performance.getEntriesByType('resource')
    const assetPerf = perfEntries.filter(entry => 
      entry.name.includes('/public/') || 
      entry.name.match(/\.(svg|png|webp|ttf)$/)
    )
    
    console.log('Asset loading performance:', assetPerf)
  })
}
```

---

