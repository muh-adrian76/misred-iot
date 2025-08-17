# MiSREd IoT - Sistem Monitoring dan Kontrol IoT

MiSREd IoT adalah aplikasi web full-stack untuk monitoring dan kontrol perangkat Internet of Things (IoT) yang dibangun dengan teknologi modern. Sistem ini menyediakan dashboard real-time, manajemen data sensor, sistem alarm, dan kontrol perangkat jarak jauh.

## 🚀 Fitur Utama

- **Dashboard Real-time**: Visualisasi data sensor dengan berbagai jenis grafik (garis, area, batang, pengukur)
- **Manajemen Perangkat**: Operasi tambah, ubah, hapus perangkat IoT dengan konfigurasi aliran data
- **Sistem Alarm**: Notifikasi otomatis berdasarkan kondisi sensor dengan integrasi WhatsApp
- **Widget Interaktif**: Komponen seret-dan-lepas untuk membangun dasbor kustom
- **Autentikasi**: Sistem masuk/daftar dengan manajemen sesi
- **Over-The-Air (OTA)**: Pembaruan firmware perangkat IoT secara jarak jauh
- **Desain Responsif**: Tampilan yang optimal di desktop dan ponsel

## 🏗️ Arsitektur Aplikasi

Aplikasi ini menggunakan arsitektur monorepo dengan 2 komponen utama:

### Struktur Folder

```
misred-iot/
├── .github/                    # Konfigurasi GitHub Actions untuk CI/CD
│   └── workflows/
│       └── deploy.yml         # Workflow otomatis deployment ke VPS
├── back-end/                  # Server API menggunakan Bun.js
│   ├── src/                   # Source code backend
│   ├── wwebjs_auth/          # Autentikasi WhatsApp Web
│   ├── package.json          # Dependencies backend
│   └── db.sql                # Database schema MySQL
├── front-end/                 # Aplikasi web menggunakan Next.js
│   ├── src/                   # Source code frontend
│   ├── public/               # Asset statis
│   ├── package.json          # Dependencies frontend
│   └── next.config.js        # Konfigurasi Next.js
├── package.json              # Scripts PM2 untuk manajemen proses
├── bun.lock                  # Lockfile dependencies
└── README.md                 # Dokumentasi ini
```

### File-file Utama di Root

- **`package.json`**: Berisi script PM2 untuk menjalankan dan mengelola proses backend/frontend secara bersamaan
- **`bun.lock`**: Lockfile yang memastikan konsistensi versi dependencies di seluruh project
- **`.gitignore`**: Daftar file/folder yang tidak akan di-track oleh Git
- **`.github/`**: Konfigurasi GitHub Actions untuk proses CI/CD otomatis

## ⚙️ Persyaratan Sistem

### Perangkat Lunak yang Diperlukan

- **Node.js** versi 18+ atau **Bun** versi 1.0+
- **MySQL** versi 8.0+
- **PM2** untuk manajemen proses (opsional, tapi direkomendasikan)
- **Git** untuk kontrol versi

### Perangkat Keras Minimum

- **RAM**: 2GB (4GB direkomendasikan)
- **Penyimpanan**: 5GB ruang kosong
- **CPU**: 2 inti (untuk menangani permintaan bersamaan)

## 🛠️ Instalasi dan Setup

### 1. Kloning Repositori

```bash
git clone https://github.com/username/misred-iot.git
cd misred-iot
```

### 2. Instalasi Dependensi Global

Pilih salah satu pengelola paket:

#### Menggunakan Bun (Direkomendasikan)
```bash
# Install Bun jika belum ada
curl -fsSL https://bun.sh/install | bash

# Instalasi dependensi
bun install
```

#### Menggunakan NPM
```bash
npm install
```

### 3. Pengaturan Basis Data MySQL

```bash
# Masuk ke MySQL sebagai root
mysql -u root -p

# Buat database baru
CREATE DATABASE misred_iot;

# Buat user baru (opsional tapi direkomendasikan)
CREATE USER 'misred_user'@'localhost' IDENTIFIED BY 'password_anda';
GRANT ALL PRIVILEGES ON misred_iot.* TO 'misred_user'@'localhost';
FLUSH PRIVILEGES;

# Keluar dari MySQL
EXIT;

# Import schema database
mysql -u misred_user -p misred_iot < back-end/db.sql
```

### 4. Konfigurasi Variabel Lingkungan

#### Konfigurasi Backend
Buat file `.env` di folder `back-end/`:

```bash
cd back-end
cp .env.example .env
```

Edit file `.env` dengan konfigurasi Anda:

```env
# Konfigurasi Basis Data
DB_HOST=localhost
DB_PORT=3306
DB_USER=misred_user
DB_PASSWORD=password_anda
DB_NAME=misred_iot

# Konfigurasi Server
PORT=3001
NODE_ENV=development

# Kunci Rahasia JWT (buat string acak)
JWT_SECRET=your_jwt_secret_key_here

# Konfigurasi CORS
CORS_ORIGIN=http://localhost:3000

# Konfigurasi WhatsApp (opsional)
WHATSAPP_ENABLED=false
```

#### Konfigurasi Frontend
Buat file `.env.local` di folder `front-end/`:

```bash
cd ../front-end
cp .env.example .env.local
```

Edit file `.env.local`:

```env
# URL API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Konfigurasi Aplikasi
NEXT_PUBLIC_APP_NAME=MiSREd IoT
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 5. Instalasi Dependensi untuk setiap Komponen

#### Dependensi Backend
```bash
cd back-end

# Menggunakan Bun
bun install

# Atau menggunakan NPM
npm install
```

#### Dependensi Frontend
```bash
cd ../front-end

# Menggunakan Bun
bun install

# Atau menggunakan NPM
npm install
```

### 6. Menjalankan Aplikasi

#### Opsi 1: Menggunakan PM2 (Direkomendasikan untuk Produksi)

Kembali ke folder root:
```bash
cd ..

# Install PM2 global jika belum ada
npm install -g pm2

# Jalankan backend dan frontend bersamaan
bun run pm2:backend
bun run pm2:frontend-dev-bun

# Atau untuk build produksi
bun run build-bun
bun run pm2:frontend-bun

# Pemantauan proses
bun run pm2:logs

# Hentikan semua proses
bun run pm2:stop
```

#### Opsi 2: Menjalankan Manual (Pengembangan)

Terminal 1 - Backend:
```bash
cd back-end
bun run dev-bun
# Atau: npm run dev
```

Terminal 2 - Frontend:
```bash
cd front-end
bun run dev-bun
# Atau: npm run dev
```

### 7. Mengakses Aplikasi

- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **Dokumentasi API**: http://localhost:3001/api-docs (jika tersedia)

## 🔧 Skrip yang Tersedia

### Skrip PM2 (dari package.json root)

```bash
# Manajemen Frontend
bun run pm2:frontend        # Mulai frontend produksi
bun run pm2:frontend-dev    # Mulai frontend pengembangan
bun run pm2:frontend-bun    # Mulai frontend dengan Bun
bun run pm2:frontend-dev-bun # Mulai frontend dev dengan Bun

# Manajemen Backend
bun run pm2:backend         # Mulai backend dengan Bun

# Manajemen Proses
bun run pm2:restart         # Restart semua proses
bun run pm2:stop           # Hentikan semua proses
bun run pm2:start          # Mulai semua proses
bun run pm2:logs           # Lihat log semua proses

# Build & Basis Data
bun run build-bun          # Build frontend dengan Bun
bun run truncate-bun       # Kosongkan tabel basis data
bun run reset-db-bun       # Reset basis data
bun run publisher-bun      # Mulai penerbit MQTT (pengujian)
```

## 🌐 Deployment ke Produksi

### Pengaturan VPS/Server

1. **Persiapkan Server** dengan Ubuntu 20.04+ atau CentOS 8+
2. **Instalasi Dependensi**:
   ```bash
   # Perbarui sistem
   sudo apt update && sudo apt upgrade -y
   
   # Instalasi Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Instalasi Bun
   curl -fsSL https://bun.sh/install | bash
   
   # Instalasi MySQL
   sudo apt install -y mysql-server
   
   # Instalasi PM2
   sudo npm install -g pm2
   ```

3. **Kloning dan Pengaturan**:
   ```bash
   git clone https://github.com/username/misred-iot.git
   cd misred-iot
   bun install
   ```

4. **Konfigurasi Basis Data dan Lingkungan** seperti langkah instalasi di atas

5. **Pengaturan Sertifikat SSL** (untuk HTTPS):
   ```bash
   # Menggunakan Let's Encrypt
   sudo apt install certbot
   sudo certbot certonly --standalone -d your-domain.com
   
   # Salin sertifikat ke folder aplikasi
   sudo cp /etc/letsencrypt/live/your-domain.com/*.pem back-end/certificates/
   ```

6. **Deploy menggunakan GitHub Actions**:
   - Pengaturan rahasia di repositori GitHub:
     - `REMOTE_HOST`: Alamat IP server
     - `REMOTE_USER`: nama pengguna SSH
     - `REMOTE_PASS`: kata sandi SSH
   - Push ke branch `main` untuk memicu auto-deployment

## 📊 Pemantauan dan Pemeliharaan

### Pemantauan dengan PM2

```bash
# Status semua proses
pm2 status

# Pemantauan waktu nyata
pm2 monit

# Log aplikasi
pm2 logs
pm2 logs misred-backend
pm2 logs misred-frontend

# Restart aplikasi
pm2 restart misred-backend
pm2 restart misred-frontend
```

### Pemeliharaan Basis Data

```bash
# Cadangan basis data
mysqldump -u misred_user -p misred_iot > backup_$(date +%Y%m%d).sql

# Pemulihan basis data
mysql -u misred_user -p misred_iot < backup_file.sql

# Reset basis data (hati-hati, akan menghapus semua data)
bun run reset-db-bun
```

## 🛡️ Keamanan

### Rekomendasi Keamanan

1. **Variabel Lingkungan**: Jangan commit file `.env` ke repositori
2. **Basis Data**: Gunakan pengguna basis data terpisah dengan hak istimewa minimal
3. **SSL/TLS**: Gunakan HTTPS di produksi
4. **Firewall**: Buka hanya port yang diperlukan (80, 443, 3000, 3001)
5. **Pembaruan**: Perbarui dependensi secara berkala

### Konfigurasi Firewall (Ubuntu)

```bash
# Instalasi UFW
sudo apt install ufw

# Konfigurasi aturan dasar
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Izinkan SSH
sudo ufw allow ssh

# Izinkan HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Izinkan port aplikasi (pengembangan)
sudo ufw allow 3000
sudo ufw allow 3001

# Aktifkan firewall
sudo ufw enable
```

## 🐛 Pemecahan Masalah

### Masalah Umum

1. **Port sudah digunakan**:
   ```bash
   # Cek proses yang menggunakan port
   sudo netstat -tulpn | grep :3000
   
   # Matikan proses
   sudo kill -9 <PID>
   ```

2. **Kesalahan koneksi basis data**:
   - Pastikan layanan MySQL berjalan: `sudo systemctl status mysql`
   - Cek kredensial di file `.env`
   - Tes koneksi: `mysql -u misred_user -p`

3. **Frontend tidak bisa akses backend**:
   - Pastikan konfigurasi CORS benar di backend
   - Cek `NEXT_PUBLIC_API_URL` di frontend `.env.local`
   - Pastikan backend berjalan di port yang benar

4. **Kesalahan build**:
   ```bash
   # Bersihkan cache
   rm -rf node_modules package-lock.json
   npm install
   
   # Bersihkan cache Next.js
   rm -rf front-end/.next
   ```

### Log dan Debugging

```bash
# Log backend
pm2 logs misred-backend

# Log frontend
pm2 logs misred-frontend

# Log basis data
sudo tail -f /var/log/mysql/error.log

# Log sistem
sudo journalctl -u mysql
```

## 📝 Kontribusi

Untuk berkontribusi pada proyek ini:

1. Fork repositori
2. Buat cabang fitur: `git checkout -b fitur-baru`
3. Commit perubahan: `git commit -am 'Tambah fitur baru'`
4. Push ke cabang: `git push origin fitur-baru`
5. Buat Pull Request

## 📄 Lisensi

Proyek ini menggunakan lisensi MIT. Lihat file `LICENSE` untuk detail lengkap.

## 🤝 Dukungan

Jika mengalami masalah atau butuh bantuan:

1. Buka issue di repositori GitHub
2. Periksa dokumentasi di folder masing-masing komponen
3. Hubungi tim pengembangan

## 🔄 Catatan Perubahan

### Versi 1.0.0
- ✅ Implementasi dasbor waktu nyata
- ✅ Sistem autentikasi pengguna
- ✅ Operasi tambah, ubah, hapus perangkat dan aliran data
- ✅ Widget seret-dan-lepas
- ✅ Integrasi notifikasi WhatsApp
- ✅ Pembaruan firmware OTA
- ✅ Desain responsif
- ✅ GitHub Actions CI/CD

---
