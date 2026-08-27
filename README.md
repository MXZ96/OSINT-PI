# Dokumentasi Kode

**Project:** OSINT Intelligence Platform
**Dikembangkan oleh:** Ikbaar Rafi Hermansyah

> Dokumentasi ini ditulis berdasarkan source code yang benar-benar ada di repository pada saat penulisan. Bagian yang tidak ditemukan implementasinya ditandai dengan **(perlu diperiksa)** agar tidak menyesatkan.

---

## 1. Identitas Project

Nama project diambil dari `package.json` frontend (`"name": "osint-intelligence-platform"`) dan judul pada `public/index.html` ("OSINT Intelligence Platform"). Aplikasi ini adalah platform Open Source Intelligence (OSINT) berbasis web yang menerima input berupa email, username, nomor telepon, nama lengkap, dan lokasi, lalu mengumpulkan dan memproses data dari beberapa sumber OSINT, menghitung risk score, dan menampilkan laporan intelijen beserta rekomendasi keamanan.

Tujuan utamanya adalah menyajikan hasil pencarian OSINT dalam satu antarmuka web yang terdiri dari tahap: input → pengumpulan data → pemrosesan → filtering/korelasi → rule-based scoring → laporan → rekomendasi.

Teknologi yang benar-benar digunakan (terlihat di `package.json` dan `import`):
- Frontend: React 18, Tailwind CSS, Axios (terdaftar sebagai dependency namun pada kode sebenarnya request menggunakan `fetch` bawaan browser).
- Backend: Node.js + Express, dengan satu modul pembantu berbahasa Python.
- OSINT: Blackbird, Intelligence X, WhatsAppCheckLeaked (melalui wrapper Python), serta tool pihak ketiga yang disimpan di folder `TOOLS/`.

---

## 2. Struktur Project

```
OSINT PI/
├── backend/                # API Express + layanan analisis + wrapper Python
├── frontend/               # Aplikasi React (src, public, build)
├── TOOLS/                  # Tool OSINT pihak ketiga (blackbird, theHarvester)
├── logs/                   # File log (blackbird.log)
├── .gitignore
├── DOKUMENTASI_KODE_IKBAAR_RAFI_HERMANSYAH.md  # dokumentasi ini
└── OSINT PI.code-workspace # Konfigurasi workspace VS Code
```

### backend/
- `server.js` — Entry point Express. Mendaftarkan middleware, route, health check, error handler, dan 404 handler.
- `package.json` / `package-lock.json` — Dependency Node.js (`express`, `cors`, `dotenv`, `axios`, `nodemon` dev).
- `.env` — Variabel environment (`PORT`, `NODE_ENV`).
- `requirements.txt` — Dependency Python (lihat catatan di bagian 15).
- `routes/osint.js` — Endpoint utama `/api/analyze` dan `/api/discover`.
- `routes/tools.js` — Endpoint `/api/tools` dan `/api/tools/:toolId`.
- `routes/realOsint.js` — Endpoint `/api/real-osint/*` (tidak dipanggil oleh frontend, lihat bagian 4).
- `services/osintAnalyzer.js` — Mesin analisis mode mock (simulasi).
- `services/fullNameDiscovery.js` — Generator query pencarian berdasarkan nama lengkap.
- `services/htmlScraper.js` — Modul scraping & crawling (tidak tersambung ke route aktif, lihat bagian 10).
- `services/rateLimiter.js` — Kelas `RateLimiter` untuk throttling request.
- `services/realOsintTools.py` — Wrapper Python yang menjalankan pengecekan OSINT ke situs nyata.

### frontend/
- `public/index.html` — HTML entry, hanya berisi `<div id="root">`.
- `src/index.js` — Mount React ke `#root` menggunakan `ReactDOM.createRoot`.
- `src/App.js` — Komponen root, mengatur state dan orchestration request ke backend.
- `src/index.css` — Global style & animasi.
- `src/components/` — 7 komponen UI (Navbar, InputSection, ToolsSection, LoadingAnimation, ResultsSection, AIComparisonSection, Footer).
- `src/tailwind.config.js`, `postcss.config.js` — Konfigurasi styling.
- `build/` — Hasil `npm run build` (asset statis siap deploy).

### TOOLS/
Berisi source code tool pihak ketiga (`blackbird`, `theHarvester`). Pada implementasi saat ini, wrapper `realOsintTools.py` menggunakan *fallback* HTTP dan tidak mengeksekusi CLI tool tersebut secara langsung (dijelaskan di bagian 8 & 9).

---

## 3. Teknologi yang Digunakan

**Frontend**
- React `^18.2.0`, react-dom `^18.2.0`
- react-scripts `5.0.1` (CRA)
- lucide-react `^0.263.1` (ikon)
- Tailwind CSS `^3.3.0`, autoprefixer, postcss
- axios `^1.6.0` (terdaftar, namun request aktual di `App.js` memakai `fetch`)

**Backend**
- Node.js
- Express `^4.18.2`
- cors `^2.8.5`
- dotenv `^16.0.3`
- axios `^1.6.0`
- nodemon `^3.0.1` (dev)

**Wrapper OSINT (Python)**
- Python 3 (modul `asyncio`, `subprocess`, `re`, `json`)
- `httpx` (import di `realOsintTools.py:18`)
- `aiohttp` (import di `realOsintTools.py:14`)
- `playwright` (diimpor di dalam fungsi `_fetch_with_playwright`)
- Catatan: `httpx`, `aiohttp`, dan `playwright` **tidak** tercantum di `backend/requirements.txt` (lihat bagian 15).

**Tools OSINT (vendored)**
- Blackbird (`TOOLS/blackbird/`)
- theHarvester (`TOOLS/theHarvester/`)

**Runtime / Deployment**
- `npm start` (backend: `node server.js`)
- `npm start` (frontend: `react-scripts start`), `npm run build` menghasilkan `frontend/build`
- Environment `PORT` untuk backend

---

## 4. Arsitektur Aplikasi

Arsitektur yang ditemukan di kode adalah tiga lapis:

```
Browser (React, port 3000)
        │  POST http://localhost:5000/api/analyze
        ▼
Backend Express (Node.js, port 5000)
        │  jika useRealTools = true  → spawn python services/realOsintTools.py
        │  jika useRealTools = false → analyzeTarget() (mock)
        ▼
Wrapper Python (realOsintTools.py)
        │  HTTP check ke situs nyata (Blackbird fallback, IntelX, WhatsAppCheckLeaked)
        ▼
JSON hasil  ──►  Backend  ──►  Frontend render (ResultsSection, AIComparisonSection)
```

Hubungan antar bagian:
- `App.js` mengirim satu request ke `POST /api/analyze` (`frontend/src/App.js:53`). Ini adalah satu-satunya endpoint yang dipanggil frontend.
- `routes/osint.js` menangani `/api/analyze`. Bila `useRealTools` aktif dan ada `username`/`email`/`phone`, ia menjalankan `runRealOsint` yang me-`spawn` `python services/realOsintTools.py`.
- `routes/tools.js` menyediakan daftar tool, namun komponen `ToolsSection.js` justru menggunakan data yang di-hardcode langsung di komponen (tidak mengambil dari API).
- `routes/realOsint.js` (`/api/real-osint/analyze`, `/api/real-osint/status`) ada di kode, tetapi **tidak dipanggil oleh frontend**. Demikian pula `/api/discover` di `osint.js` tidak dipanggil UI.
- `services/htmlScraper.js` dan `services/rateLimiter.js` ada, namun `htmlScraper` tidak diimpor oleh route manapun, sehingga tidak ikut dalam alur berjalan.

---

## 5. Alur Kerja Aplikasi

1. Pengguna membuka halaman utama, mengisi form (email / username / phone / fullName / location).
2. `InputSection` memanggil `onAnalyze(formData)` → `App.handleAnalyze`.
3. `App` melakukan `fetch('http://localhost:5000/api/analyze', {email, username, phone, fullName, location, useRealTools})`.
4. Backend memvalidasi: minimal satu dari `email/username/phone/fullName` harus ada (`osint.js:17`), jika tidak → 400.
5. Bila `useRealTools` true → `runRealOsint` spawn `realOsintTools.py`. Bila false → `analyzeTarget` (mock).
6. Python wrapper mengumpulkan hasil dari situs nyata (lihat bagian 8), lalu mengembalikan JSON.
7. Backend meneruskan JSON ke frontend (`res.json`).
8. Frontend menyimpan hasil ke state `results`, menampilkan `LoadingAnimation` selama proses, lalu merender `ResultsSection` dan `AIComparisonSection`.
9. Pengguna dapat memfilter hasil (korelasi & tahun) dan membuka panel perbandingan OSINT vs AI.

---

## 6. Dokumentasi Frontend

**Halaman utama** dirender oleh `App.js` yang menyusun komponen secara berurutan: Navbar → InputSection → ToolsSection → (LoadingAnimation saat loading) → (ResultsSection + AIComparisonSection saat ada hasil) → Footer.

**State (App.js)**
- `isDark` — boolean tema (default `true`), disimpan di `localStorage`.
- `isLoading` — status proses analisis.
- `results` — objek hasil dari backend.
- `useRealTools` — boolean pemilih mode (default `true`), diteruskan ke navbar toggle.
- `formData` — input terakhir pengguna.

**Event handler**
- `handleAnalyze(data)` — mengirim request ke backend; pada mode mock (`useRealTools=false`) dan gagal, frontend men-fallback ke `getMockResults` lokal (`App.js:95`).
- `toggleTheme()` — mengubah class `dark` di `documentElement` dan menyimpan preferensi.
- `handleInputChange` / `handleSubmit` di `InputSection`.

**Komponen**
- `Navbar.js` — logo, link, toggle "Real Tools / Mock", toggle tema.
- `InputSection.js` — form 5 field + tombol "Analyze & Gather Intelligence".
- `ToolsSection.js` — 4 kartu tool (Blackbird, Analyst Research, Intelligence X, CheckLeaked) dengan status `active`.
- `LoadingAnimation.js` — 5 langkah teks berurutan + progress bar.
- `ResultsSection.js` — render OSINT Findings, Intelligence Insights, Risk Assessment, Leaked Data, Security Recommendations; memiliki filter `onlyRelated` dan `yearFilter`.
- `AIComparisonSection.js` — panel expand/collapse berisi `aiComparison.osintAnalysis` dan `aiComparison.aiInsight`.
- `Footer.js` — informasi & link statis.

**API request**
- `fetch('http://localhost:5000/api/analyze', {...})` dengan `Content-Type: application/json` (`App.js:53`). URL di-hardcode, bukan dari env.

**Proses menampilkan hasil**
- `ResultsSection` membaca `results.osintResults`, `results.leakedData`, `results.insights`, `results.riskScore`, `results.recommendations`.
- Filter sisi klien: `onlyRelated` menyaring `osintResults.filter(r => r.isLikelyOwner)`; `yearFilter` menyaring `leakedData` berdasarkan selisih tahun ke `leak.year`.

**Mode aplikasi**
- Tersedia toggle `useRealTools` (Real Tools / Mock) di Navbar; default Real Tools.

---

## 7. Dokumentasi Backend

**Entry point:** `server.js`
- Middleware: `cors()`, `express.json()`, logger request.
- Route terdaftar: `/api` (osintRoutes), `/api/tools` (toolsRoutes), `/api/real-osint` (realOsintRoutes, di-load di dalam `try/catch`).
- `GET /health` → `{ status: 'OSINT Platform is online' }`.
- Error handler global + 404 handler.

**Endpoint**
- `POST /api/analyze` (`osint.js`) — inti aplikasi.
- `GET /api/tools` (`tools.js`) — daftar 4 tool (hardcode).
- `GET /api/tools/:toolId` (`tools.js`) — detail `blackbird`, `intelligence-x`.
- `POST /api/discover` (`osint.js`) — panggil `discoverFullName` (generator query, tidak crawling).
- `POST /api/real-osint/analyze` (`realOsint.js`) — spawn `realOsintTools.py` langsung (tidak dipakai UI).
- `GET /api/real-osint/status` (`realOsint.js`) — cek keberadaan file tool via `fs.existsSync` dengan path hardcode.

**Request & Response**
- `/api/analyze` menerima body `{ email, username, phone, fullName, location, useRealTools }`. Merespons JSON berisi `query, timestamp, osintResults, leakedData, insights, riskScore, recommendations, aiComparison`.
- Validasi: 400 bila input kosong; 500 bila terjadi exception (mengembalikan `error`, `message`, `timestamp`).

**Error handling**
- Di `runRealOsint`: bila proses Python keluar tidak dengan kode 0, gagal parse JSON, atau spawn error → fallback ke `analyzeTarget` (mock) (`osint.js:73,82,89`).
- Di `realOsint.js`: kode keluar ≠ 0 → kembalikan JSON berisi `error` + `details`; gagal parse → 500.
- Frontend: `handleAnalyze` menangkap error; bila `useRealTools` true → tampilkan objek error (UI error di `ResultsSection`); bila false → `getMockResults` lokal.

---

## 8. Integrasi OSINT

Tool/sumber yang benar-benar ditemukan di kode (`realOsintTools.py` & `ToolsSection.js`):

**Blackbird**
- Tujuan: pencarian username lintas platform.
- Cara dipanggil: `BlackbirdWrapper.search_username` → karena `use_fallback=True` (`realOsintTools.py:491`), ia tidak menjalankan `blackbird.py`, melainkan `DirectHttpChecker.check_username`.
- Hasil: pengecekan HTTP ke 13 platform (`USERNAME_PLATFORMS`: GitHub, Twitter, Instagram, Reddit, TikTok, YouTube, Medium, Pinterest, Snapchat, Twitch, GitLab, npm, Docker Hub). Status `found` ditentukan dari HTTP 200 + pemeriksaan teks "not found" (`NOT_FOUND_SIGNATURES`).
- Pemrosesan: hasil masuk ke `osintResults` dengan `source: "blackbird_http"`.

**Intelligence X**
- Tujuan: pengecekan kebocoran email.
- Cara dipanggil: `DirectEmailChecker.check_email` → `_fetch_with_playwright` membuka `https://intelx.io/?s={email}` menggunakan Playwright, menunggu `#found_media_stats`, mem-parse jumlah Text/CSV/Database files (`_parse_stats_text`), dan mengambil tanggal dari baris hasil.
- Hasil: `intelx_stats` (text/csv/db files), `lastDetected`, `is_disposable`. Masuk ke `osintResults` sebagai entri `platform: "Intelligence X"`.

**WhatsAppCheckLeaked**
- Tujuan: pengecekan nomor telepon via `whatsapp.checkleaked.cc`.
- Cara dipanggil: `PhoneNumberChecker.check_phone` → `_fetch_with_playwright` membuka `https://whatsapp.checkleaked.cc/{phone}`, membaca JSON dari `textarea.v-field__input`, lalu `_parse_phone_json`.
- Hasil: `whatsapp_data` (isWAContact, isBusiness, isVerified, countryCode), `telegram_data`, `leak_data` (Facebook Leak bila `fbLeak.success`), `ai_report` (dari field `aiReport` situs tersebut). Masuk ke `osintResults` sebagai `platform: "Phone OSINT"`.

**TheHarvester**
- Ditemukan sebagai tool di `TOOLS/theHarvester/` dan direferensikan oleh `TheHarvesterWrapper` (`realOsintTools.py:416`), namun `use_fallback=True` sehingga CLI `theHarvester.py` tidak dieksekusi; fallback-nya memanggil `DirectEmailChecker`. Jadi theHarvester belum benar-benar dijalankan dalam alur aktif.

> Catatan: pada kode, tool asli Blackbird & theHarvester tidak dieksekusi (selalu fallback). Yang benar-benar melakukan request ke situs nyata adalah `DirectHttpChecker` (HTTP), IntelX (Playwright), dan WhatsAppCheckLeaked (Playwright).

---

## 9. Real Tool / Mock Tool / Simulated Tool

Aplikasi memiliki dua mode yang dipilih lewat `useRealTools` (toggle di Navbar, default `true`):

**Mode Mock (`useRealTools = false`)**
- Fungsi: `analyzeTarget` di `osintAnalyzer.js`.
- Sumber data: data simulasi di `osintDatabase` (`socialPlatforms`, `leakDatabases`, `phoneExposures`).
- Perbedaan: `found`, `leakedData`, `riskScore` (dengan `Math.random`), dan `insights` di-generate acak/模板. Tidak ada request keluar.

**Mode Real (`useRealTools = true`)**
- Fungsi: `runRealOsint` → spawn `realOsintTools.py`.
- Sumber data: situs nyata via HTTP/Playwright (Blackbird fallback, IntelX, WhatsAppCheckLeaked).
- Perbedaan alur: hasil dikumpulkan secara asinkron (`asyncio.gather`), lalu `UnifiedOsintEngine` menghitung `insights`, `riskScore` (rule-based `_calculate_risk`), `recommendations`, `leakedData`, `aiComparison`.
- Jika Python/Playwright tidak tersedia atau gagal, `runRealOsint` kembali ke mock (`osint.js:73,82,89`).

**Penting:** UI `ToolsSection.js` menampilkan keempat tool dengan status `active` (di-hardcode di komponen), namun backend `/api/tools` masih mengembalikan `status: "simulated"` untuk `intelligence-x` dan `check-leaked`. Ini adalah ketidaksesuaian antara UI dan API yang perlu diperiksa.

---

## 10. Processing Data

Berdasarkan kode, pemrosesan yang benar-benar ada:

- **Filtering (sisi klien):** `ResultsSection` menyaring `osintResults` berdasarkan `isLikelyOwner` (`onlyRelated`) dan `leakedData` berdasarkan tahun (`yearFilter`).
- **Klasifikasi:** backend memberi `severity` (high/medium/low), `confidenceLabel` (High/Medium/Low), `isLikelyOwner`, dan `status` pada tiap hasil.
- **Correlation (mode mock):** `calculateConfidence` (`osintAnalyzer.js:172`) menghitung skor 0–1 dari kemiripan nama (`stringSimilarity`, pendekatan himpunan kata panjang >2), lokasi, email, dan bio. `isLikelyOwner` bila `found && confidence >= 0.6`.
- **Normalisasi:** `htmlScraper.normalizeUrl` ada, tetapi modul ini tidak dipakai di alur berjalan.
- **Rule-based intelligence:** `generateInsights` (mock) dan `_generate_insights` (real) menggunakan aturan IF/THEN untuk menyusun insight (jumlah platform, pola konsistensi, dsb).
- **Deduplikasi:** **(perlu diperiksa)** — tidak ditemukan fungsi yang menghapus duplikat hasil OSINT di seluruh kode. `.filter`/`.Set` hanya dipakai untuk tahun dan domain, bukan untuk deduplikasi data.
- **Penggabungan hasil:** `UnifiedOsintEngine` menggabungkan hasil username, email, dan phone ke dalam satu array `osintResults`.

---

## 11. Risk Scoring

**Mode Mock (`osintAnalyzer.calculateRiskScore`):**
```
score = 25
score += 25  jika ada email
score += 20  jika ada username
score += 30  jika ada phone
score += randint(-10, 10)
riskScore = clamp(score, 0, 100)
```
Skor ini sebagian acak, bukan murni rule-based.

**Mode Real (`realOsintTools._calculate_risk`):**
```
found      = jumlah osintResults dengan found == true
intelx_total = Σ intelx_stats.total (dari tiap akun)
score = 15 + found * 8 + int(intelx_total * 0.5)
riskScore = min(95, score)
```

**Kategori risiko (UI, `ResultsSection.getRiskLabel`):**
- `< 30` → Low
- `< 60` → Medium
- `≥ 60` → High

Hasil akhir ditampilkan sebagai angka 0–100, label, dan progress bar di bagian "Risk Assessment".

---

## 12. AI Analysis

Bagian yang berlabel "AI" adalah **pembuatan teks berbasis template dari hasil analisis**, bukan pemanggilan model AI eksternal:
- Mock: `generateAIComparison` (`osintAnalyzer.js:344`) menyusun `osintAnalysis` dan `aiInsight` dari `platformCount` dan `relatedCount`.
- Real: `_generate_ai_analysis` (`realOsintTools.py:747`) menyusun teks dari `found_count`.
- `AIComparisonSection.js` menampilkan `results.aiComparison.osintAnalysis` dan `results.aiComparison.aiInsight`.

Satu catatan: pada mode real, `PhoneNumberChecker` memang mem-parsing field `aiReport` dari respons situs `whatsapp.checkleaked.cc` (`realOsintTools.py:399`), namun itu berasal dari situs eksternal, bukan dari model AI yang kita panggil. Secara keseluruhan, tidak ada kode yang memanggil API LLM/AI kita sendiri.

---

## 13. Security Recommendation

Rekomendasi keamanan dihasilkan dari fungsi statis, bukan dari inferensi dinamis terhadap hasil:
- Mock: `generateRecommendations` (`osintAnalyzer.js:331`) → 8 string tetap (2FA, batasi privasi, hapus data sensitif, ganti password, pantau HIBP, alert aktivitas, password manager, layanan anti-pencurian identitas).
- Real: `_generate_recommendations` (`realOsintTools.py:734`) → 8 string serupa.

Kedua fungsi mengembalikan list yang sama untuk semua input; tidak bergantung pada nilai `riskScore` atau jenis kebocoran. Hasil ditampilkan di "Security Recommendations" (`ResultsSection.js:533`).

---

## 14. Error Handling

**Backend**
- Validasi input: 400 bila `email/username/phone/fullName` kosong (`osint.js:17`, `osint.js:121`).
- Validasi strategy pada `/api/discover`: 400 bila strategy tidak valid.
- `try/catch` di setiap route → 500 dengan `{ error, message, timestamp }`.
- `runRealOsint`: kode keluar ≠ 0 / gagal parse / spawn error → fallback mock (`osint.js:73,82,89`).
- `realOsint.js`: kode ≠ 0 → JSON `error`+`details`; gagal parse → 500.
- `server.js`: error handler global + 404 handler + logging request.

**Frontend**
- `App.handleAnalyze` `try/catch`: bila `useRealTools` true dan gagal → `setResults({error,...})` (UI error di `ResultsSection`).
- Bila `useRealTools` false dan gagal → `getMockResults` lokal (`App.js:86`).
- Mode mock juga menunda 2 detik (`setTimeout`) agar terlihat seperti proses.

---

## 15. Configuration

**`backend/.env`**
- `PORT` — port backend (bernilai non-sensitive, digunakan `server.js`).
- `NODE_ENV` — environment (development/production).
- Tidak ada API key/token asli di file ini.

**`backend/requirements.txt`**
Berisi: `flask`, `requests`, `beautifulsoup4`, `lxml`, `python-dotenv`, `click`.
**(perlu diperiksa)** `realOsintTools.py` justru mengimpor `httpx`, `aiohttp`, dan `playwright` yang tidak tercantum di file ini. Bila mode real dijalankan, dependency tersebut harus diinstal secara terpisah.

**`TOOLS/blackbird/.env` & konfigurasi theHarvester**
Ada, namun pada alur aktif wrapper menggunakan fallback HTTP sehingga file konfigurasi tool tersebut tidak dibaca oleh aplikasi.

**Frontend**
- Tidak ada file `.env`; URL API di-hardcode `http://localhost:5000` di `App.js:53`.
- `tailwind.config.js`, `postcss.config.js` — konfigurasi styling (tidak diubah).

**Lainnya**
- `.gitignore` — version control.
- `OSINT PI.code-workspace` — workspace VS Code.

> Sesuai aturan, tidak ada credential asli (API key, password, token) yang ditampilkan; variabel di atas hanya berisi nilai non-sensitive.

---

## 16. Deployment

Berdasarkan file project yang tersedia:
- **Backend:** dijalankan dengan `npm start` (`node server.js`). Port diambil dari env `PORT`.
- **Frontend:** `npm start` untuk pengembangan; `npm run build` menghasilkan folder `frontend/build` (asset statis siap di-serve). Folder `build/` sudah ada di repository.
- Tidak ditemukan `Dockerfile` atau konfigurasi CI/CD di root project utama (hanya ada di dalam `TOOLS/` sebagai milik tool pihak ketiga). Deployment cukup dilakukan dengan menyalurkan `frontend/build` ke static server dan menjalankan backend Express.
- Prerequisite mode real: Python 3 + `httpx` + `aiohttp` + `playwright` + akses internet.

---

## 17. Contoh Alur Eksekusi

**Mode Real, input username "john":**
```
Input: username = "john", useRealTools = true
        ↓
InputSection.handleSubmit → onAnalyze({username:"john", useRealTools:true})
        ↓
App.handleAnalyze → fetch POST http://localhost:5000/api/analyze
        ↓
Backend osint.js: useRealTools && username → runRealOsint
        ↓
spawn: python services/realOsintTools.py -u john
        ↓
UnifiedOsintEngine.analyze_async
   ├─ BlackbirdWrapper → DirectHttpChecker (HTTP ke 13 platform)
   └─ hasil masuk osintResults
        ↓
Hitung insights, riskScore (_calculate_risk), recommendations,
leakedData, aiComparison
        ↓
Python print JSON → backend res.json
        ↓
Frontend setResults → LoadingAnimation selesai
        ↓
ResultsSection render: OSINT Findings, Insights, Risk (gauge),
Leaked Data, Security Recommendations
        ↓
AIComparisonSection render: aiComparison.osintAnalysis & aiInsight
```

**Mode Mock, input email "a@b.com", useRealTools=false:**
```
fetch POST /api/analyze {email, useRealTools:false}
        ↓
Backend osint.js → analyzeTarget (simulasi osintDatabase)
        ↓
JSON mock (found/leak/risk acak) → frontend
        ↓
ResultsSection & AIComparisonSection render hasil simulasi
```

---

## 18. Kesimpulan

Secara keseluruhan, kode bekerja sebagai aplikasi web 3-lapis: React di sisi klien, Express sebagai API, dan satu wrapper Python yang melakukan pengecekan ke situs OSINT nyata. Alur utama sudah jelas dan berjalan melalui satu endpoint `/api/analyze`, dengan pemilih mode Real/Mock.

Beberapa hal yang perlu diperhatikan agar dokumentasi dan implementasi konsisten:
1. **Deduplikasi belum diimplementasikan** — hanya ada filtering sisi klien, belum ada penghapusan duplikat hasil.
2. **Web crawling (`htmlScraper.js`) tidak tersambung** ke route mana pun, sehingga belum masuk alur berjalan.
3. **Tool asli Blackbird & theHarvester tidak dieksekusi** (selalu fallback HTTP); yang benar-benar request ke situs nyata adalah `DirectHttpChecker`, IntelX, dan WhatsAppCheckLeaked.
4. **Ketidaksesuaian status tool** antara UI (`ToolsSection` menampilkan semua `active`) dan API (`/api/tools` mengembalikan `simulated` untuk IntelX & CheckLeaked).
5. **Dependency Python tidak lengkap** di `requirements.txt` (`httpx`, `aiohttp`, `playwright` tidak tercantum) padahal dipakai `realOsintTools.py`.
6. Endpoint `/api/discover` dan `/api/real-osint/*` ada di kode namun tidak dipanggil frontend.
7. Bagian "AI" adalah teks template, bukan pemanggilan model AI eksternal.

Dokumentasi ini dibuat semata-mata dari struktur dan implementasi kode yang ada, tanpa menambahkan fitur atau teknologi di luar yang terdeteksi di repository.
