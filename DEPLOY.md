# 🎯 PANDUAN DEPLOY SAHABAT UTARA KE RENDER.COM

## Prerequisites / Persiapan

1. Akun GitHub (https://github.com)
2. Akun Render.com (https://render.com) - bisa login dengan GitHub
3. Project sudah siap di komputer lokal

---

## 📋 LANGKAH 1: Bikin Repository di GitHub

### 1.1 Buat Repository Baru
1. Buka https://github.com
2. Klik **"New repository"** (tombol hijau)
3. Isi formulir:
   - **Repository name:** `sahabat-utara`
   - **Description:** "Sistem Antisipasi Hadapi Banjir Terpadu - Kecamatan Bekasi Utara"
   - **Visibility:** Public (atau Private sesuai kebutuhan)
   - ❌ Jangan centang "Add a README file"
   - ❌ Jangan centang "Add .gitignore"
4. Klik **"Create repository"**

### 1.2 Upload Project ke GitHub
Buka Terminal/Command Prompt di komputer Anda:

```bash
# Masuk ke folder project
cd C:\xampp\htdocs\SAHABAT-UTARA-FINAL

# Inisialisasi Git (jika belum ada)
git init

# Tambahkan semua file
git add .

# Commit
git commit -m "Initial commit - SAHABAT UTARA"

# Rename branch ke main
git branch -M main

# Tambahkan remote (ganti USERNAME dengan username GitHub Anda)
git remote add origin https://github.com/USERNAME/sahabat-utara.git

# Push ke GitHub
git push -u origin main
```

⚠️ **PENTING:** Jangan upload folder berikut ke GitHub:
- `node_modules/` (terlalu besar)
- `.git/` folder
- File database SQLite (`.db`) - kecuali Anda mau data awal

### 1.3 Buat .gitignore
Buat file `.gitignore` di root project:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/

# Database
*.db
*.db-journal
*.db-wal
*.db-shm

# Environment
.env
.env.local
.env.development
.env.production

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
server/uploads/*
!server/uploads/.gitkeep
```

---

## 📋 LANGKAH 2: Setup Deploy di Render.com

### 2.1 Login ke Render.com
1. Buka https://dashboard.render.com
2. Klik **"Sign Up"** atau **"Login"**
3. Pilih **"Continue with GitHub"**
4. Izinkan akses ke repository GitHub Anda

### 2.2 Connect Repository
1. Di Dashboard Render.com, klik **"New +"**
2. Pilih **"Blueprint"** (ini akan membaca file `render.yaml`)

### 2.3 Configure Blueprint
1. Klik **"New Blueprint Instance"**
2. Pilih organization Anda
3. Klik **"Connect"** pada repository `sahabat-utara`
4. Render.com akan mendeteksi file `render.yaml`
5. Konfirmasi settings:
   - **Name:** sahabat-utara
   - **Region:** Singapore (terdekat dengan Indonesia)
   - **Branch:** main
   - **Root Directory:** server

### 2.4 Environment Variables
Render.com akan auto-generate `JWT_SECRET`. Pastikan:
- `NODE_ENV` = `production`
- `PORT` = `3001`

### 2.5 Deploy!
1. Klik **"Apply Blueprint"**
2. Tunggu proses build (~3-5 menit)
3. Jika berhasil, Anda akan melihat URL seperti:
   ```
   https://sahabat-utara.onrender.com
   ```

---

## 📋 LANGKAH 3: Verifikasi Deploy

### 3.1 Test API Health Check
Buka di browser:
```
https://sahabat-utara.onrender.com/api/health
```

Harus muncul:
```json
{"status":"ok","message":"SAHABAT UTARA API is running","env":"production"}
```

### 3.2 Test Frontend
Buka:
```
https://sahabat-utara.onrender.com
```

Harus muncul halaman login SAHABAT UTARA.

### 3.3 Login dengan Default Account
| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |

---

## 📋 LANGKAH 4: Custom Domain (Optional)

### 4.1 Beli Domain
Beli domain di:
- Niagahoster (Rp 10.000/tahun)
- Namecheap
- Google Domains

### 4.2 Setup di Render.com
1. Buka dashboard Render.com → Web Service
2. Klik **"Settings"**
3. Scroll ke **"Custom Domains"**
4. Klik **"Add Custom Domain"**
5. Masukkan domain Anda (misal: `sahabatutara.co.id`)
6. Ikuti instruksi untuk setup DNS

### 4.3 Update DNS
Di provider domain Anda, tambahkan CNAME record:
```
Name: sahabatutara (atau @)
Type: CNAME
Value: sahabat-utara.onrender.com
TTL: 3600
```

### 4.4 Enable HTTPS
Setelah domain terhubung, Render.com akan otomatis install SSL certificate.

---

## 🔧 TROUBLESHOOTING

### Problem: Build Gagal
**Ceklist:**
- [ ] Node.js version >= 18
- [ ] `npm install` berjalan sukses
- [ ] Tidak ada error di build logs

### Problem: API 404 Error
**Ceklist:**
- [ ] Backend sudah selesai deploy
- [ ] `NODE_ENV=production` sudah diset
- [ ] Health check `/api/health` berfungsi

### Problem: Frontend Blank Page
**Ceklist:**
- [ ] Build frontend berhasil
- [ ] Folder `dist` ada di `server/client/dist`
- [ ] CORS settings sudah benar

### Problem: Database Error
**Ceklist:**
- [ ] Folder `db/` ada
- [ ] Permission write untuk folder db

---

## 💰 BIAYA

| Service | Plan | Biaya |
|---------|------|-------|
| Render.com | Free | Gratis (dengan limitaciones) |
| GitHub | Free | Gratis |
| **Total** | | **GRATIS** |

⚠️ **Catatan Render.com Free Tier:**
- Sleep setelah 15 menit tidak aktif
- Build timeout 10 menit
- 750 jam/bulan gratis

---

## 📝 COMMAND REFERENCE

### Local Development
```bash
# Install dependencies
cd FINAL/server && npm install
cd FINAL/client && npm install

# Run backend
cd FINAL/server && npm run dev

# Run frontend (terminal baru)
cd FINAL/client && npm run dev
```

### Build for Production
```bash
cd FINAL/server && npm run build
```

### Useful Links
- Render Dashboard: https://dashboard.render.com
- Render Docs: https://render.com/docs
- Status Page: https://status.render.com
