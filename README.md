# MiSREd IoT - Sistem Monitoring IoT

MiSREd IoT adalah aplikasi web full-stack untuk monitoring dan kontrol perangkat Internet of Things (IoT) yang dibangun dengan teknologi modern. Sistem ini menyediakan dashboard real-time, manajemen data sensor, dan sistem alarm.

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

## 🐛 Troubleshooting

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

### Versi 1.0.0
- ✅ Implementasi dasbor waktu nyata
- ✅ Sistem autentikasi pengguna
- ✅ Operasi tambah, ubah, hapus perangkat dan aliran data
- ✅ Widget seret-dan-lepas
- ✅ Integrasi notifikasi WhatsApp
- ✅ Pembaruan firmware OTA
- ✅ Desain responsif
- ✅ GitHub Actions CI/CD

# .github - Konfigurasi GitHub Actions

Folder `.github` berisi konfigurasi untuk GitHub Actions yang mengatur proses Continuous Integration dan Continuous Deployment (CI/CD) untuk aplikasi MiSREd IoT.

## 📁 Struktur Folder

```
.github/
└── workflows/
    └── deploy.yml      # Workflow deployment otomatis ke VPS
```

## 📄 Penjelasan File

### `workflows/deploy.yml`

File ini berisi konfigurasi GitHub Actions untuk deployment otomatis aplikasi ke server VPS setiap kali ada push ke branch `main`.

#### Fungsi Utama:
- **Trigger Deployment**: Otomatis menjalankan deployment ketika ada perubahan di branch `main`
- **SSH Connection**: Menggunakan SSH untuk terhubung ke server VPS
- **Automated Build**: Menjalankan proses build dan restart aplikasi secara otomatis
- **Process Management**: Menggunakan PM2 untuk mengelola proses aplikasi

#### Tahapan Deployment:

1. **Setup Environment**:
   - Runs on Ubuntu latest
   - Menggunakan action `appleboy/ssh-action@v1.2.0` untuk koneksi SSH

2. **Server Connection**:
   - Host: Menggunakan secret `REMOTE_HOST`
   - Username: Menggunakan secret `REMOTE_USER` 
   - Password: Menggunakan secret `REMOTE_PASS`
   - Port: 8288 (custom SSH port)

3. **Deployment Steps**:
   ```bash
   # Navigasi ke directory aplikasi
   cd ./misred-iot
   
   # Stop semua proses PM2
   bun run pm2:stop
   
   # Pull update terbaru dari Git
   git pull origin main
   
   # Install Bun jika belum ada
   if [ ! -f "$HOME/.bun/bin/bun" ]; then
     curl -fsSL https://bun.sh/install | bash
   fi
   
   # Setup Bun environment
   export BUN_INSTALL="$HOME/.bun"
   export PATH="$BUN_INSTALL/bin:$PATH"
   
   # Install dependencies root
   bun install
   
   # Install dependencies backend
   cd ./back-end
   bun install
   
   # Install dependencies dan build frontend
   cd ../front-end
   rm -rf .next/          # Clear Next.js cache
   bun install
   bun run build-bun      # Build production
   
   # Restart semua proses
   cd ../
   bun run pm2:restart
   ```

## ⚙️ Konfigurasi GitHub Secrets

Untuk menggunakan workflow ini, Anda perlu mengatur GitHub Secrets berikut di repository:

### Secrets yang Diperlukan:

1. **`REMOTE_HOST`**
   - **Deskripsi**: IP address atau domain server VPS
   - **Contoh**: `192.168.1.100` atau `myserver.com`

2. **`REMOTE_USER`**
   - **Deskripsi**: Username SSH untuk koneksi ke server
   - **Contoh**: `ubuntu`, `root`, atau `deploy`

3. **`REMOTE_PASS`**
   - **Deskripsi**: Password SSH untuk autentikasi
   - **Catatan**: Untuk keamanan lebih baik, gunakan SSH key alih-alih password

### Cara Mengatur Secrets:

1. Buka repository GitHub
2. Navigasi ke **Settings** → **Secrets and variables** → **Actions**
3. Klik **New repository secret**
4. Tambahkan masing-masing secret dengan nama dan value yang sesuai

## 🔒 Keamanan SSH

### Rekomendasi Keamanan:

1. **Gunakan SSH Key** alih-alih password:
   ```yaml
   # Alternatif menggunakan SSH key
   - name: Deploy via SSH
     uses: appleboy/ssh-action@v1.2.0
     with:
       host: ${{ secrets.REMOTE_HOST }}
       username: ${{ secrets.REMOTE_USER }}
       key: ${{ secrets.SSH_PRIVATE_KEY }}
       port: 8288
   ```

2. **Gunakan Port Non-Standard**:
   - Default SSH port 22 diganti ke 8288 untuk mengurangi risiko serangan

3. **Batasi Akses SSH**:
   ```bash
   # Konfigurasi SSH server untuk membatasi akses
   sudo nano /etc/ssh/sshd_config
   
   # Tambahkan/edit konfigurasi:
   PermitRootLogin no
   PasswordAuthentication no  # Jika menggunakan SSH key
   AllowUsers deploy-user     # Hanya user tertentu
   ```

## 🚀 Penggunaan Workflow

### Automatic Deployment:
1. Lakukan perubahan pada kode
2. Commit dan push ke branch `main`:
   ```bash
   git add .
   git commit -m "Update: feature baru"
   git push origin main
   ```
3. GitHub Actions akan otomatis menjalankan deployment
4. Monitor proses di tab **Actions** repository GitHub

### Manual Trigger:
Jika perlu menjalankan deployment manual, tambahkan trigger `workflow_dispatch`:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # Allow manual trigger
```

## 📊 Monitoring Deployment

### Status Deployment:
- ✅ **Success**: Deployment berhasil, aplikasi sudah running
- ❌ **Failed**: Ada error, cek logs untuk troubleshooting
- 🟡 **In Progress**: Deployment sedang berjalan

### Melihat Logs:
1. Buka tab **Actions** di repository GitHub
2. Klik pada workflow run yang ingin dilihat
3. Expand step **Deploy via SSH** untuk melihat detail logs

### Troubleshooting Common Issues:

1. **SSH Connection Failed**:
   - Cek kredensial SSH di secrets
   - Pastikan server dapat diakses dari internet
   - Verifikasi port SSH (8288)

2. **Build Failed**:
   - Cek dependency issues di package.json
   - Pastikan Node.js/Bun versi kompatibel di server
   - Clear cache: `rm -rf node_modules .next`

3. **PM2 Process Issues**:
   - Cek status PM2: `pm2 status`
   - Restart manual: `pm2 restart all`
   - Reset PM2: `pm2 delete all && pm2 save`

## 📝 Best Practices

1. **Branch Protection**: Aktifkan branch protection untuk `main`
2. **Required Reviews**: Wajibkan code review sebelum merge
3. **Status Checks**: Tambahkan tests sebelum deployment
4. **Rollback Strategy**: Siapkan mekanisme rollback jika deployment gagal
5. **Environment Variables**: Gunakan secrets untuk data sensitif
6. **Backup**: Selalu backup database sebelum deployment besar

## 🔗 Resources Tambahan

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Bun Documentation](https://bun.sh/docs)

---

---
