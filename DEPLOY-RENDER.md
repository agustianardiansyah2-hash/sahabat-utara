# 🚀 DEPLOY SAHABAT UTARA KE RENDER.COM

## Langkah 1: Push ke GitHub

```bash
cd C:\xampp\htdocs\SAHABAT-UTARA-FINAL

git add .
git commit -m "Ready for Render.com deployment"
git push origin main
```

---

## Langkah 2: Buat Akun Render.com

1. Buka https://render.com
2. Klik **"Get Started"**
3. Pilih **"Continue with GitHub"**
4. Izinkan akses ke repository GitHub

---

## Langkah 3: Buat Blueprint

1. Di dashboard Render, klik **"New +"**
2. Pilih **"Blueprint"**
3. Klik **"Connect"** pada repository `sahabat-utara`

---

## Langkah 4: Konfigurasi Blueprint

Pastikan konfigurasi seperti ini:

| Setting | Value |
|---------|-------|
| **Name** | `sahabat-utara` |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Root Directory** | `server` |

### Environment Variables

Klik **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `JWT_SECRET` | Klik **"Generate"** |
| `FRONTEND_URL` | (kosongkan) |

---

## Langkah 5: Deploy

1. Klik **"Apply Blueprint"**
2. Tunggu proses build (~3-5 menit)
3. Deploy berhasil!

---

## Langkah 6: Verifikasi

Buka di browser:
```
https://sahabat-utara.onrender.com/api/health
```

Harus muncul:
```json
{"status":"ok","message":"SAHABAT UTARA API is running","env":"production"}
```

---

## Langkah 7: Buka Aplikasi

Buka:
```
https://sahabat-utara.onrender.com
```

Login dengan:
- **Username:** `admin`
- **Password:** `admin123`

---

## ✅ SELESAI!

Aplikasi sudah online dan bisa diakses publik.

---

## 🔧 Troubleshooting

### Build Gagal?
- Pastikan `render.yaml` ada di root folder
- Pastikan Root Directory = `server`

### 404 Error?
- Tunggu 1-2 menit setelah deploy selesai
- Refresh browser

### Blank Page?
- Cek apakah backend sudah selesai deploy
- Buka `/api/health` dulu

---

## 💰 Biaya

**GRATIS!** (Free tier Render.com)

- Sleep setelah 15 menit idle
- Wake up otomatis saat diakses

---

## 📝 Catatan Penting

- Data tersimpan di server Render
- Jika server sleep, data tetap aman
- Upload file (foto) akan reset saat server sleep (free tier)

---

## 🔄 Update Kode

Jika ubah kode:
```bash
git add .
git commit -m "Update terbaru"
git push origin main
```

Render akan auto-deploy!

---

## 📞 Support

- Render Docs: https://render.com/docs
- Status: https://status.render.com
