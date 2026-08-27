# Local Development Guide

Project ini berjalan sepenuhnya di komputer lokal. Tidak ada deployment ke Render, Northflank, Vercel, atau platform cloud lainnya.

## Prerequisites

- Node.js >= 16
- npm atau yarn
- Python 3 (untuk mode real OSINT)

## Menjalankan Aplikasi

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend akan berjalan di `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend akan berjalan di `http://localhost:3000`

## Environment Variables

### Backend (`backend/.env`)

```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
PYTHON_BIN=python3
OSINT_TOOLS_PATH=../TOOLS
BLACKBIRD_PATH=../TOOLS/blackbird
THEHARVESTER_PATH=../TOOLS/theHarvester
```

### Frontend (`frontend/.env`)

```
REACT_APP_API_URL=http://localhost:5000
```

## VS Code Port Forwarding

Untuk mengakses aplikasi dari internet menggunakan VS Code Port Forwarding:

1. Jalankan backend (`http://localhost:5000`)
2. Jalankan frontend (`http://localhost:3000`)
3. Buka tab **PORTS** di VS Code
4. Forward port **3000** (frontend)
5. Forward port **5000** (backend)
6. Gunakan URL forwarding yang diberikan VS Code

Pastikan server listen pada `0.0.0.0` agar port forwarding dapat bekerja.

## Cloudflare Tunnel (Opsional)

Untuk demo/testing dari internet, gunakan Cloudflare Tunnel:

```bash
# Tunnel untuk backend
cloudflared tunnel --url http://localhost:5000

# Tunnel untuk frontend
cloudflared tunnel --url http://localhost:3000
```

Tunnel hanya digunakan sebagai jalur akses sementara menuju aplikasi yang tetap berjalan di komputer lokal.

## Testing

Setelah menjalankan backend dan frontend:

1. Buka `http://localhost:3000`
2. Masukkan data target (email, username, phone, atau fullName)
3. Pilih mode Real Tools atau Mock
4. Klik "Analyze & Gather Intelligence"
5. Periksa hasil di Results Section

## Catatan Keamanan

- Jangan commit file `.env` ke Git
- API keys harus tetap di environment variable lokal
- Jangan expose secret di frontend atau console/log
- Gunakan tunnel hanya untuk keperluan demo/testing sementara
