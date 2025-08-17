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

## 🔄 Workflow Alternatives

### Multi-Environment Deployment:
```yaml
on:
  push:
    branches:
      - main        # Production
      - develop     # Staging
      - test        # Testing
```

### Conditional Deployment:
```yaml
jobs:
  deploy:
    if: contains(github.event.head_commit.message, '[deploy]')
```

### Slack/Discord Notifications:
```yaml
- name: Notify Deployment
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

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

**File ini dibuat untuk memastikan proses deployment yang aman dan otomatis**
