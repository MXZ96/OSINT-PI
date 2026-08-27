# Deployment OSINT PI ke Northflank + Vercel

## Arsitektur

```text
User
  |
  v
Vercel (React frontend)
  |
  | HTTPS, REACT_APP_API_URL
  v
Northflank (Docker backend)
  |
  +-- Node.js / Express
  +-- Python 3.12
  +-- Blackbird
  +-- theHarvester
  +-- Playwright + Chromium
```

## 1. Prasyarat

Repository GitHub:

```text
https://github.com/MXZ96/OSINT-PI
```

Pastikan branch `main` berisi `backend/Dockerfile`, `backend/package.json`, `backend/requirements.txt`, `TOOLS/blackbird/`, `TOOLS/theHarvester/`, `frontend/package.json`, dan `vercel.json`.

## 2. Buat Project Northflank

1. Buka `https://app.northflank.com` dan login.
2. Buat workspace jika belum ada.
3. Pilih **Create project**.
4. Gunakan nama `osint-pi` dan pilih region yang dekat dengan pengguna.
5. Di dalam project, pilih **Add service** atau **Create service**.
6. Pilih **Build service**.
7. Pilih source repository dari GitHub.
8. Berikan akses GitHub hanya ke repository `MXZ96/OSINT-PI`.
9. Pilih repository dan branch `main`.

## 3. Konfigurasi Docker

Gunakan pengaturan berikut:

```text
Build type: Dockerfile
Dockerfile path: backend/Dockerfile
Build context: repository root (/)
Port: 5001
```

Build context wajib root repository, bukan `backend/`, karena Dockerfile menyalin `backend` dan `TOOLS`.

Gunakan command production dari image:

```text
npm start
```

Jangan menggunakan `npm run dev`.

## 4. Environment Variables Northflank

Tambahkan pada service backend:

```env
NODE_ENV=production
FRONTEND_URL=https://NAMA-FRONTEND.vercel.app
PYTHON_BIN=python3
OSINT_TOOLS_PATH=/app/TOOLS
BLACKBIRD_PATH=/app/TOOLS/blackbird
THEHARVESTER_PATH=/app/TOOLS/theHarvester
```

Biarkan `PORT` dikelola Northflank. Jika Northflank meminta port internal secara eksplisit, gunakan `5001`.

API key dan secret, bila dibutuhkan, harus disimpan sebagai secret/environment variable Northflank, bukan di GitHub.

## 5. Deploy Backend

1. Simpan konfigurasi service.
2. Pilih **Deploy** atau **Redeploy**.
3. Tunggu proses Docker build selesai.
4. Periksa log pada tahap `npm ci`, `pip install`, dan `playwright install --with-deps chromium`.
5. Aktifkan public endpoint untuk service.

Tes endpoint:

```text
https://URL-BACKEND-NORTHFLANK/health
```

Response wajib:

```json
{"status":"ok"}
```

Tes tool:

```text
https://URL-BACKEND-NORTHFLANK/api/real-osint/status
```

Path tool seharusnya menggunakan `/app/TOOLS`, bukan path Windows.

## 6. Health Check

Jika Northflank meminta konfigurasi health check, gunakan:

```text
Protocol: HTTP
Path: /health
Port: 5001
```

Endpoint ini ringan dan tidak menjalankan proses OSINT.

## 7. Deploy Frontend ke Vercel

1. Buka `https://vercel.com`.
2. Pilih **Add New Project**.
3. Import repository `MXZ96/OSINT-PI`.
4. Gunakan konfigurasi:

```text
Framework preset: Create React App
Root directory: .
Build command: npm run build --prefix frontend
Output directory: frontend/build
Install command: npm ci --prefix frontend
```

Konfigurasi ini juga tersedia di `vercel.json`.

Tambahkan Vercel environment variable:

```env
REACT_APP_API_URL=https://URL-BACKEND-NORTHFLANK
```

Aktifkan untuk Production. Setelah menambah atau mengubah variable, lakukan redeploy karena CRA membaca variable saat build.

## 8. Sambungkan CORS

Setelah URL Vercel tersedia, pada Northflank set:

```env
FRONTEND_URL=https://NAMA-FRONTEND.vercel.app
```

Gunakan URL lengkap dengan `https://` dan tanpa slash terakhir. Redeploy backend setelah mengubah variable.

## 9. Tes Production

1. Buka URL frontend Vercel.
2. Buka Developer Tools, tab **Network**.
3. Jalankan analisis mode mock terlebih dahulu.
4. Pastikan request menuju `https://URL-BACKEND-NORTHFLANK/api/analyze`.
5. Pastikan tidak ada request production menuju `localhost`.
6. Tes mode real dengan target ringan.
7. Periksa log Northflank bila proses gagal.

## 10. Troubleshooting

### Service unhealthy

Pastikan port service `5001`, health path `/health`, dan backend bind ke `0.0.0.0`.

### CORS error

Pastikan `FRONTEND_URL` sama persis dengan origin Vercel, termasuk `https://` dan tanpa slash terakhir.

### Tools tidak ditemukan

Pastikan build context adalah root repository dan source `TOOLS/blackbird` serta `TOOLS/theHarvester` ada di GitHub sebagai folder biasa, bukan gitlink.

### Chromium gagal berjalan

Periksa apakah Docker build menyelesaikan:

```text
playwright install --with-deps chromium
```

### Python tidak ditemukan

Pastikan variable berikut ada:

```env
PYTHON_BIN=python3
```

## 11. Checklist

```text
[ ] Repository GitHub terhubung ke Northflank
[ ] Build context adalah root repository
[ ] Dockerfile path adalah backend/Dockerfile
[ ] Port service adalah 5001
[ ] NODE_ENV=production
[ ] FRONTEND_URL berisi domain Vercel
[ ] Python 3.12 terpasang
[ ] Playwright dan Chromium terpasang saat build
[ ] Blackbird dan theHarvester masuk image
[ ] /health mengembalikan {"status":"ok"}
[ ] Vercel memakai REACT_APP_API_URL
[ ] Frontend production tidak memakai localhost
[ ] CORS berhasil dari domain Vercel
[ ] Flow mock berhasil
[ ] Flow real berhasil
```
