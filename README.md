# SAHABAT UTARA
## Sistem Antisipasi Hadapi Banjir Terpadu
### Kecamatan Bekasi Utara

---

## 📋 Requirements

- **Node.js** v18 atau lebih tinggi
- **npm** (sudah termasuk dengan Node.js)

---

## 🚀 Cara Menjalankan

### 1. Setup Database (SQLite - Otomatis)

Database SQLite akan otomatis dibuat saat pertama kali menjalankan server. Tidak perlu install database terpisah.

### 2. Jalankan Backend Server

```bash
cd FINAL
cd server
npm install
npm run dev
```

Server akan berjalan di: **http://localhost:3001**

### 3. Jalankan Frontend (Terminal Baru)

```bash
cd FINAL
cd client
npm install
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

---

## 👤 Akun Login

| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |
| PIC RW 01 | pic_rw01 | rw01 |
| PIC RW 02 | pic_rw02 | rw02 |
| PIC RW 03 | pic_rw03 | rw03 |

---

## 📊 Menu Dashboard

### Super Admin
- Dashboard
- Input Data
- Pos Evakuasi
- Data Pengungsi
- Data Penduduk
- Informasi
- Laporan
- Laporan RW
- CCTV
- Manajemen User
- Pengaturan

### PIC RW
- Dashboard
- Input Data
- Pos Evakuasi
- Data Pengungsi
- Data Penduduk

---

## 📁 Struktur Project

```
FINAL/
├── client/                 # Frontend (React + Vite + TailwindCSS)
│   ├── src/
│   │   ├── api/          # API calls
│   │   ├── components/   # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── App.jsx       # Main app with routes
│   │   └── main.jsx      # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Backend (Express + SQLite)
│   ├── db/               # Database files
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API routes
│   ├── uploads/          # Uploaded files
│   ├── index.js         # Main server
│   ├── package.json
│   └── .env             # Environment config
│
└── README.md
```

---

## 🔧 Konfigurasi

### Backend Port (default: 3001)
Edit file `server/.env`:
```
PORT=3001
```

### Frontend Proxy
Sudah dikonfigurasi otomatis untuk connect ke backend.

---

## ☁️ Deploy ke Hosting (Render.com)

### Deploy ke Render.com (Gratis)

Lihat panduan lengkap di [DEPLOY-RENDER.md](./DEPLOY-RENDER.md)

**Ringkasan:**
1. Push project ke GitHub
2. Buat akun di https://render.com
3. Connect GitHub repo
4. Deploy otomatis!

**URL Production:** `https://sahabat-utara.onrender.com`

---

## 📝 Catatan

- Data tersimpan di `server/db/sahabat_utara.db` (SQLite)
- Untuk reset data, hapus file `.db` dan jalankan ulang server
- Super Admin bisa CRUD semua data
- PIC RW hanya bisa melihat & menginput data RW-nya sendiri

---

© 2026 Kecamatan Bekasi Utara
