# 🚀 PANDUAN DEPLOY SAHABAT UTARA - VERCEL + RAILWAY

## Overview

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│   VERCEL        │         │   RAILWAY       │
│   (Frontend)    │  ───►   │   (Backend)     │
│                 │         │                 │
│   Static App    │  API    │   Node.js       │
│   React/Vite    │  Calls  │   Express       │
│                 │         │   SQLite         │
└─────────────────┘         └─────────────────┘
     ▲                            ▲
     │                            │
     └────── GitHub ──────────────┘
```

---

## 📋 LANGKAH 1: Push Kode ke GitHub

### 1.1 Commit Perubahan Terakhir

```bash
cd C:\xampp\htdocs\SAHABAT-UTARA-FINAL

# Add semua perubahan
git add .

# Commit
git commit -m "Update for Vercel + Railway deployment"

# Push
git push origin main
```

---

## 📋 LANGKAH 2: Deploy Backend ke Railway

### 2.1 Buat Akun Railway

1. Buka https://railway.app
2. Klik **"Login"** → pilih **"Login with GitHub"**
3. Izinkan akses ke repository GitHub

### 2.2 Buat Project Baru

1. Di dashboard Railway, klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Pilih repository `sahabat-utara`
4. Railway akan auto-detect Node.js

### 2.3 Konfigurasi Project

1. Klik pada project yang baru dibuat
2. Masuk ke tab **"Settings"**

#### Root Directory
- Set: `/server` (karena backend ada di folder server)

#### Build Command
```
npm install
```

#### Start Command
```
npm start
```

### 2.4 Setup Environment Variables

Di Railway dashboard → **"Variables"**, tambah:

| Key | Value | Catatan |
|-----|-------|---------|
| `NODE_ENV` | `production` | Wajib |
| `PORT` | `3001` | Wajib |
| `JWT_SECRET` | `(generate random string)` | Klik "Generate" |
| `FRONTEND_URL` | `(kosong dulu)` | Akan diupdate nanti |

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2.5 Tunggu Deploy Selesai

1. Railway akan build dan deploy otomatis
2. Tunggu ~2-3 menit
3. Dapat URL seperti:
   ```
   https://sahabat-utara.railway.app
   ```

### 2.6 Verifikasi Backend

Buka di browser:
```
https://sahabat-utara.railway.app/api/health
```

Harus muncul:
```json
{"status":"ok","message":"SAHABAT UTARA API is running","env":"production"}
```

**CATAT URL INI!** (misal: `https://sahabat-utara.railway.app`)

---

## 📋 LANGKAH 3: Deploy Frontend ke Vercel

### 3.1 Buat Akun Vercel

1. Buka https://vercel.com
2. Klik **"Sign Up"** → pilih **"Continue with GitHub"**
3. Izinkan akses ke repository GitHub

### 3.2 Import Project

1. Di dashboard Vercel, klik **"Add New..."** → **"Project"**
2. Pilih repository `sahabat-utara`
3. Klik **"Import"**

### 3.3 Konfigurasi Project

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.4 Environment Variables

Klik **"Environment Variables"**, tambah:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://sahabat-utara.railway.app/api` |

⚠️ **PENTING:** Ganti `sahabat-utara` dengan subdomain Railway Anda!

### 3.5 Deploy

1. Klik **"Deploy"**
2. Tunggu ~1-2 menit
3. Dapat URL seperti:
   ```
   https://sahabat-utara.vercel.app
   ```

---

## 📋 LANGKAH 4: Update Railway dengan Frontend URL

### 4.1 Kembali ke Railway

1. Buka project backend di Railway
2. Masuk ke **"Variables"**
3. Edit `FRONTEND_URL`:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://sahabat-utara.vercel.app` |

4. Klik **"Save"**
5. Railway akan auto-redeploy

---

## 📋 LANGKAH 5: Verifikasi Lengkap

### 5.1 Test Frontend
Buka: `https://sahabat-utara.vercel.app`

Harus muncul halaman login SAHABAT UTARA.

### 5.2 Login
| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |

### 5.3 Test API Connection
- Buka dashboard
- Coba input data
- Pastikan tidak ada error CORS

---

## ✅ SELESAI!

Aplikasi Anda sudah online di:

| Component | URL |
|----------|-----|
| **Frontend** | `https://sahabat-utara.vercel.app` |
| **Backend API** | `https://sahabat-utara.railway.app/api` |

---

## 🔧 TROUBLESHOOTING

### Error: CORS Policy
**Masalah:** Frontend tidak bisa akses backend

**Solusi:**
1. Pastikan `FRONTEND_URL` di Railway sudah benar
2. Pastikan `VITE_API_URL` di Vercel sudah benar
3. Redeploy kedua service

### Error: 404 Not Found
**Masalah:** Halaman blank atau 404

**Solusi:**
1. Cek apakah backend sudah selesai deploy
2. Test: `https://sahabat-utara.railway.app/api/health`
3. Redeploy frontend

### Error: Database Empty
**Masalah:** Login gagal / tidak ada data

**Solusi:**
1. Database SQLite di Railway auto-create
2. Default admin `admin/admin123` auto-create
3. Jika bermasalah, cek Railway logs

### Error: Build Failed
**Masalah:** Vercel build error

**Solusi:**
1. Pastikan `client` folder sudah benar
2. Cek build logs di Vercel
3. Pastikan semua dependencies di `package.json`

---

## 💰 BIAYA

| Service | Plan | Biaya |
|---------|------|-------|
| GitHub | Free | Gratis |
| Vercel | Hobby | Gratis |
| Railway | Starter | $5 credit/bulan gratis |
| **Total** | | **GRATIS** |

### Catatan Railway Free Tier:
- $5 credit per bulan
- Project tidur setelah 1 jam idle
- Wake up otomatis saat diakses
- Cukup untuk development/demo

---

## 🔄 Update Kode

Setiap push ke GitHub:

1. **Railway** - Auto-deploy backend
2. **Vercel** - Auto-deploy frontend

Tidak perlu manual deploy lagi!

---

## 📞 Support Links

- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- GitHub: https://docs.github.com
