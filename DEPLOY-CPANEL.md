# 🚀 DEPLOY SAHABAT UTARA KE CPANEL HOSTING

## 📋 PERSYARATAN

### Hosting harus support Node.js
Cek di cPanel → Cari **"Setup Node.js App"** atau **"Node.js"** di section Software

---

## LANGKAH 1: Build Frontend (DI KOMPUTER LOKAL)

### 1.1 Install Dependencies

```bash
cd C:\xampp\htdocs\SAHABAT-UTARA-FINAL

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 1.2 Build Frontend

```bash
cd C:\xampp\htdocs\SAHABAT-UTARA-FINAL\client
npm run build
```

Hasil build akan ada di folder `client/dist/`

---

## LANGKAH 2: Upload File ke cPanel

### 2.1 Login ke cPanel

1. Buka cPanel hosting Anda
2. Login dengan username dan password

### 2.2 Buat Folder Project

1. Buka **File Manager**
2. Masuk ke `public_html` (atau folder domain Anda)
3. Buat folder baru: `sahabat-utara`
4. Masuk ke folder tersebut

### 2.3 Upload via File Manager

**Opsi A: Upload via File Manager**
1. Klik **Upload**
2. Upload SEMUA file dari folder project (klik Select File, pilih semua)

**Opsi B: Upload via ZIP (Lebih cepat)**
1. Di komputer lokal, compress folder project jadi ZIP
2. Upload ZIP file ke cPanel
3. Klik kanan → **Extract**

### 2.4 Struktur Folder di Hosting

```
public_html/sahabat-utara/
├── server/
│   ├── index.js
│   ├── package.json
│   ├── .env
│   ├── routes/
│   ├── middleware/
│   ├── db/
│   ├── uploads/
│   └── node_modules/     ← setelah npm install
├── client/
│   └── dist/             ← hasil build frontend
└── package.json          ← (hapus ini, tidak perlu)
```

---

## LANGKAH 3: Setup Node.js App di cPanel

### 3.1 Buka Setup Node.js App

1. Di cPanel, cari **"Setup Node.js App"** (di section Software)
2. Klik **"Create Application"**

### 3.2 Konfigurasi

| Setting | Value |
|---------|-------|
| **Node.js version** | `18` atau `20` |
| **Application mode** | `Production` |
| **Application root** | `/home/USERNAME/public_html/sahabat-utara/server` |
| **Application startup file** | `index.js` |
| **Application URL** | `sahabat-utara` (atau subdomain) |

**Contoh:**
```
Application root: /home/username/public_html/sahabat-utara/server
Application URL:  sahabat-utara
```

### 3.3 Environment Variables

Klik **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `JWT_SECRET` | `(ketik random string, min 32 karakter)` |

### 3.4 Install Dependencies

Klik tombol **"Run npm install"** atau biarkan auto-install.

### 3.5 Start App

Klik **"Start App"**

---

## LANGKAH 4: Verifikasi

### 4.1 Test API

Buka di browser:
```
https://domainanda.com/sahabat-utara/api/health
```

Harus muncul:
```json
{"status":"ok","message":"SAHABAT UTARA API is running","env":"production"}
```

### 4.2 Buka Aplikasi

Buka:
```
https://domainanda.com/sahabat-utara
```

Login dengan:
- **Username:** `admin`
- **Password:** `admin123`

---

## ⚠️ TROUBLESHOOTING

### Error: "npm not found"
**Solusi:** Pastikan Node.js app sudah disetup dengan benar di cPanel

### Error: "Module not found"
**Solusi:** Jalankan `npm install` di folder `server`

### Error: "Port already in use"
**Solusi:** Ganti PORT di environment variables

### Blank Page
**Solusi:** Pastikan folder `client/dist` ada dan terisi

### 404 Error
**Solusi:**
1. Pastikan `NODE_ENV=production`
2. Cek apakah app sudah running

---

## 📁 STRUKTUR PROJECT (FINAL)

```
sahabat-utara/
├── server/                    ← Application root di Node.js
│   ├── index.js              ← Entry point
│   ├── package.json
│   ├── .env
│   ├── routes/
│   ├── middleware/
│   ├── db/                   ← Database SQLite
│   └── uploads/              ← Uploaded files
│
└── client/
    └── dist/                 ← Static files (HTML/CSS/JS)
```

---

## 🔄 UPDATE KODE

Jika ubah kode:

1. **Lokal:** Edit kode
2. **Build:** `cd client && npm run build`
3. **Upload:** Upload ulang file yang berubah
4. **Restart:** Di cPanel → Setup Node.js App → Klik **"Restart"**

---

## 💡 TIPS

### Pakai Subdomain
Lebih rapi jika pakai subdomain:
- App URL: `api.sahabatutara.com`
- Atau: `sahabatutara.domain.com`

### SSL/HTTPS
 Pastikan SSL sudah aktif di hosting
 (biasanya gratis dari cPanel → AutoSSL)

---

## 📞 Butuh Bantuan?

Jika ada error:
1. Screenshot error dari cPanel
2. Screenshot error dari browser (F12 → Console)
3. Kirim ke saya untuk bantu troubleshooting
