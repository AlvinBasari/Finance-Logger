# SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION (arsitektur.md)
**Project:** Sistem Logger & Pengarsipan Invoice (Finance Desktop Application)  
**Status:** FROZEN & LOCKED (Hardware Adjusted: HP DeskJet 2132 Series Flatbed)  
**Platform:** Desktop (Electron + React) & Cloud API (Laravel on cPanel Shared Hosting)  
**Version:** v1.1.0  

---

## 1. TECHNICAL STACK MATRIX (LOCKED)

| Layer | Technology | Exact Version / Spec | Primary Role |
| :--- | :--- | :--- | :--- |
| **Desktop Runtime** | Electron.js | `^30.x` LTS | OS windowing, Node.js runtime, native IPC, packaging |
| **Frontend Framework** | React.js | `^18.3` (via Vite) | UI Component Lifecycle & State Management |
| **Styling Engine** | Tailwind CSS | `^3.4` | Enterprise UI utility styling & typography tokens |
| **Hardware Driver Bridge** | NAPS2 Console CLI | `v7.x` Portable | WIA driver interface for physical flatbed scanner |
| **Target Hardware** | HP DeskJet 2132 Series | Flatbed Scanner (Glass) | Pemindaian fisik dokumen invoice & lampiran |
| **PDF Rendering Engine** | `@react-pdf-viewer/core` / PDF.js | `^3.x` | In-app dual-pane document preview & inspection |
| **State & Data Layer** | TanStack Query + Zustand | `^5.x` | Server state caching & lightweight UI state |
| **HTTP Client** | Axios | `^1.7` | `multipart/form-data` uploads & REST communication |
| **Backend Framework** | Laravel | `11.x` / `12.x` | RESTful API, Request Validation, Authentication |
| **Auth Provider** | Laravel Sanctum | `^4.x` | Stateful Bearer Token Authentication |
| **Database Engine** | MySQL | `8.0` / MariaDB 10.6+ | Relational data persistence & transactional ACID |
| **File Storage** | Laravel Public Storage | `symlink` | PDF scans storage hosted on cPanel |
| **Hosting Target** | cPanel Shared Hosting | PHP 8.2+, Apache/LiteSpeed | Production API & Media Hosting |

---

## 2. CLIENT-SIDE ARCHITECTURE (ELECTRON + REACT)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      ELECTRON DESKTOP RUNTIME                          │
│                                                                         │
│  ┌─────────────────────────┐             ┌───────────────────────────┐  │
│  │     RENDERER PROCESS    │             │       MAIN PROCESS        │  │
│  │  (React + Tailwind UI)  │             │    (Node.js Core App)     │  │
│  │                         │             │                           │  │
│  │ - React Components      │  IPC invoke │ - BrowserWindow Lifecycle │  │
│  │ - Flatbed Multi-Page UI ├────────────►│ - Context Isolation Guard │  │
│  │ - PDF Inline Viewer     │  IPC handle │ - Child Process Manager   │  │
│  │ - Axios API Calls       │◄────────────┤   (NAPS2 CLI Bridge)      │  │
│  └───────────┬─────────────┘             └─────────────┬─────────────┘  │
│              │                                         │                │
└──────────────┼─────────────────────────────────────────┼────────────────┘
               │ (HTTPS REST API)                        │ (CLI Exec)
               ▼                                         ▼
   ┌───────────────────────┐                 ┌───────────────────────┐
   │  Laravel Backend API  │                 │  HP DeskJet 2132      │
   │  (Shared Hosting)     │                 │  (WIA / Flatbed Glass)│
   └───────────────────────┘                 └───────────────────────┘
```

### 2.1 Security & IPC Protocol
* **Context Isolation:** `contextIsolation: true` wajib aktif di `webPreferences`.
* **Node Integration:** `nodeIntegration: false` untuk mencegah vulnerability XSS eksekusi kode native sembarangan.
* **Preload Bridge:** Semua komunikasi native diisolasi melalui `contextBridge.exposeInMainWorld('scannerAPI', { ... })`.

---

## 3. SCANNER HARDWARE BRIDGE PATTERN (HP DESKJET 2132 FLATBED)

### 3.1 Profil Hardware & Driver
* **Jenis Scanner:** Flatbed (Kaca manual 1 halaman per-scan).
* **Driver Target:** `WIA` (Windows Image Acquisition) - profil default HP DeskJet 2130 series.
* **Format Perintah CLI:**
  ```bash
  NAPS2.Console.exe -o "C:\Temp\scan_page_1.pdf" --driver wia --source glass --pagesize a4 --dpi 200 --noprofile --autosave
  ```

### 3.2 Alur Multi-Page Scanning (Append Pattern)
Karena HP DeskJet 2132 tidak memiliki feeder otomatis (ADF), arsitektur menangani dokumen multi-halaman (Invoice + PO + Faktur Pajak) dengan siklus:
1. Scan halaman pertama -> disimpan ke `%TEMP%/session_{invoice_id}/page_1.pdf`.
2. Staf meletakkan lembar kedua di kaca flatbed -> klik *Pindai Halaman Berikutnya* -> `%TEMP%/session_{invoice_id}/page_2.pdf`.
3. Setelah klik *Selesai & Upload*, Electron Main Process menggabungkan seluruh file halaman menjadi 1 berkas `invoice_{invoice_number}.pdf` menggunakan engine NAPS2 merge/append.
4. Berkas final PDF dikirim via Axios `FormData` ke API Laravel.

---

## 4. SERVER-SIDE & HOSTING ARCHITECTURE (cPANEL SHARED HOSTING)

### 4.1 Folder Structure Locking (cPanel Compatibility)
Untuk shared hosting tanpa akses root server, struktur deployment Laravel dikonfigurasi:
```text
/home/username/
├── laravel_core/             <-- Core Laravel (app, config, routes, database, vendor)
│   ├── .env
│   └── storage/
└── public_html/              <-- Root domain API (api.domain.com)
    ├── index.php             <-- Diarahkan ke ../laravel_core/public/index.php
    ├── .htaccess
    └── storage               <-- Symlink ke /home/username/laravel_core/storage/app/public
```

### 4.2 Shared Hosting Tuning Parameters
* `upload_max_filesize`: `32M` (Menangani PDF multi-halaman hasil scan).
* `post_max_size`: `32M`.
* `memory_limit`: `256M`.
* `max_execution_time`: `120s`.
* **CORS Middleware (`cors.php`):**
  ```php
  'paths' => ['api/*'],
  'allowed_methods' => ['*'],
  'allowed_origins' => ['*'], // Diizinkan request dari protocol electron file:// dan localhost
  'allowed_headers' => ['*'],
  ```

---

## 5. NETWORK & DATA RESILIENCE STRATEGY

1. **Optimistic Local Caching:** Data form transaksi disimpan sementara di IndexedDB/LocalStorage desktop sebelum commit API, mencegah data hilang jika koneksi kantor terputus.
2. **Multipart Stream:** Berkas PDF hasil scan dikirim melalui `FormData` dengan validasi MIME server-side (`application/pdf`).
3. **Database Transaction Guard:** Setiap update status invoice yang melibatkan perubahan relasi boks gudang wajib dibungkus dalam `DB::transaction()` di Laravel Controller untuk menjaga integritas data.
