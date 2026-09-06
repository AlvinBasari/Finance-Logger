# PRODUCT REQUIREMENT DOCUMENT (PRD)

## 1. INFORMASI DOKUMEN & RINGKASAN EKSEKUTIF
* **Nama Proyek:** Sistem Logger & Pengarsipan Invoice (Finance Desktop Application)
* **Versi Dokumen:** v1.1.0 (Hardware Adjusted: Flatbed Support)
* **Target Rilis:** Q4 2026
* **Penulis:** Product Management & Engineering Team
* **Target Pengguna:** Staf Logger Invoice (Divisi Finance & Accounting), Warehouse/Archive Admin, Finance Manager.

### 1.1 Latar Belakang
Divisi Finance menerima volume dokumen invoice fisik harian dalam jumlah besar dari berbagai vendor dan divisi internal. Proses manual rentan terhadap risiko kehilangan berkas, duplikasi pembayaran, lambatnya pencarian arsip, serta ketidaksesuaian antara input sistem dan fisik invoice. Sistem ini dibangun untuk mendigitalkan, memvalidasi, dan melacak seluruh siklus hidup invoice fisik mulai dari tanda terima hingga penyimpanan di gudang arsip (warehouse).

### 1.2 Tujuan & Sasaran Produk
1. **Otomasi Pencatatan & Verifikasi:** Memastikan setiap invoice fisik terdaftar dan diverifikasi sebelum masuk ke sistem pembukuan utama.
2. **Digitalisasi Seamless (Hardware Integrated):** Mengintegrasikan mesin scanner fisik Flatbed (HP DeskJet 2132 series via WIA driver) langsung dengan desktop app Electron tanpa software pihak ketiga terpisah.
3. **Rekonsiliasi Cepat:** Membandingkan data input dengan hasil scan dalam satu layar (Split-Screen Reconciliation).
4. **Physical Archiving Traceability:** Menghasilkan nomor batch boks kardus dan barcode/QR tag untuk pelacakan lokasi fisik invoice di warehouse.

---

## 2. ARSITEKTUR SISTEM & TECH STACK

### 2.1 Arsitektur Aplikasi
Sistem menggunakan model Client-Server terdistribusi:
* **Client Side (Desktop Application):**
  * Core: **Electron.js** (Cross-platform runtime, packaging via `electron-builder`)
  * Frontend: **React.js** + **Vite**
  * Styling: **Tailwind CSS** + **Lucide React Icons**
  * State & Data Fetching: **Zustand** / **TanStack Query** + **Axios**
  * PDF Viewer: `@react-pdf-viewer/core` / PDF.js inline viewer
  * Hardware Target: **HP DeskJet 2132 Flatbed All-in-One**
  * Hardware Driver Bridge: **NAPS2 Console CLI** (`--driver wia --source glass`)
* **Server Side (Backend API):**
  * Framework: **Laravel 11.x / 12.x** (RESTful API)
  * Autentikasi: **Laravel Sanctum** (Token-based Auth)
  * Storage: Laravel Public Disk (`storage:link`)
  * Database: **MySQL 8.0**
  * Deployment Target: **Shared Hosting cPanel** (PHP 8.2+, Apache/LiteSpeed)

### 2.2 Diagram Alur Data & Hardware
```text
[ HP DeskJet 2132 (Flatbed Glass) ]
              │ (WIA Driver)
              ▼
[ NAPS2 CLI (Bundled Portable) ] ◄── (Child Process) ── [ Electron Main Process ]
                                                                 ▲
                                                                 │ (IPC invoke)
[ Laravel REST API (cPanel) ] ◄── (Axios multipart/form-data) ── [ React UI + Tailwind ]
              │
              ▼
   [ MySQL DB & File Storage ]
```

---

## 3. USER PERSONA & HAK AKSES (ROLE-BASED ACCESS CONTROL)

| Role | Tanggung Jawab Utama | Hak Akses Fitur |
| :--- | :--- | :--- |
| **Finance Logger (Staff)** | Penerimaan berkas fisik, input transaksi, scan invoice (flatbed multi-halaman), verifikasi, packing boks. | Fitur 1 sampai 6 (Full operational access). |
| **Finance Supervisor** | Review kelengkapan, approval invoice bernilai tinggi, re-open batch boks. | View, Reconcile, Approve, Generate Report. |
| **Warehouse Custodian** | Menerima boks fisik di gudang, update nomor rak/lokasi penyimpanan. | Fitur Warehouse Tracking, Confirm Inbound Box. |
| **System Administrator** | Manajemen user, konfigurasi API URL, backup database. | Konfigurasi sistem dan manajemen akun. |

---

## 4. SPESIFIKASI FITUR & USER STORIES (6 TAHAPAN UTAMA)

### Tahap 1: Penerimaan Dokumen Invoice
* **Deskripsi:** Registrasi awal saat dokumen fisik invoice diterima dari kurir, vendor, atau divisi internal.
* **Fitur & Logika:**
  * Auto-generate `Tracking Code` unik (format: `REC-YYYYMMDD-XXXX`).
  * Input Nama Vendor, Pengirim/Divisi, Tanggal Terima, Jumlah Lembar Dokumen.
  * Pencetakan resi / label barcode tanda terima (opsional).
* **Validasi:** Nomor invoice vendor dicek secara asinkron untuk mencegah double-entry sejak awal.

### Tahap 2: Pemeriksaan Kelengkapan & Keakuratan Data
* **Deskripsi:** Verifikasi fisik kelengkapan lampiran dokumen pendukung sebelum dimasukkan ke antrean input.
* **Fitur & Logika:**
  * Checklist wajib: Faktur Pajak, Surat Jalan / Delivery Order (DO), Purchase Order (PO), Berita Acara Serah Terima (BAST).
  * Status Verifikasi: `Complete`, `Incomplete` (Pending berkas susulan), `Rejected` (Berkas cacat/rusak).
  * Field Catatan Pemeriksa untuk mendokumentasikan kekurangan.

### Tahap 3: Penginputan Data Invoice ke Sistem
* **Deskripsi:** Input detail nilai keuangan dan parameter akuntansi ke database pusat.
* **Fitur & Logika:**
  * Form input: Nomor Invoice, Tanggal Invoice, Tanggal Jatuh Tempo (Due Date), Mata Uang (IDR/USD), Subtotal (DPP), PPN (11%/12%), PPh (jika ada), Total Amount.
  * Fitur auto-calculate pajak dan nominal total untuk meminimalkan human error.
  * Tombol *Save as Draft* atau *Submit to Next Step*.

### Tahap 4: Digitalisasi Dokumen (Flatbed Multi-Page Workflow)
* **Deskripsi:** Pemindaian fisik invoice lembar per lembar di kaca Flatbed HP DeskJet 2132 dan digabungkan menjadi 1 file PDF lengkap.
* **Fitur & Logika Hardware (HP DeskJet 2132):**
  * **Driver Mode:** Windows WIA Driver (`--driver wia --source glass --pagesize a4 --dpi 200`).
  * **Interactive Multi-Page Scanning Session:**
    * 1. Staf menaruh Invoice di kaca -> Klik **"Pindai Halaman 1"**.
    * 2. Sistem menampilkan thumbnail preview halaman 1 yang berhasil dipindai.
    * 3. Muncul tombol **"+ Pindai Halaman Berikutnya (Lampiran/PO/Faktur)"** dan **"Selesai & Gabung PDF"**.
    * 4. Staf mengganti lembar dokumen di kaca flatbed -> Klik Pindai Halaman Berikutnya (sistem otomatis melakukan appending).
    * 5. Klik **"Selesai & Upload"** -> Electron menggabungkan seluruh halaman dan mengirim 1 PDF utuh via `multipart/form-data` ke Laravel API.
  * **Fallback Uploader:** Drag-and-drop file upload manual tetap disediakan.

### Tahap 5: Pengecekan Kesesuaian Data (Reconciliation Screen)
* **Deskripsi:** Validasi akhir membandingkan file pindaian digital multi-halaman dengan data yang diinput di sistem sebelum berkas fisik dikemas.
* **Fitur & Logika UI:**
  * **Dual-Pane Interface:**
    * Sisi Kiri: PDF Viewer interaktif (Zoom in/out, Rotate, Multi-page navigation thumbnail).
    * Sisi Kanan: Read-only summary data transaksi + form approval.
  * Tombol Aksi:
    * `Approve & Mark as Reconciled` (Lanjut ke tahap 6).
    * `Need Correction` (Mengembalikan ke Tahap 3 dengan catatan revisi).

### Tahap 6: Pencatatan & Pengiriman ke Warehouse
* **Deskripsi:** Pengelompokan berkas invoice fisik ke dalam boks arsip untuk dikirim dan disimpan di gudang fisik.
* **Fitur & Logika:**
  * Pembuatan Boks Baru: Nomor Boks (format: `BOX-FIN-YYYY-XXXX`), Kategori Periode, Kapasitas Boks (contoh: maks 50 invoice).
  * Fitur Barcode Scanner: Staf dapat men-scan barcode tanda terima invoice fisik untuk memasukkannya ke dalam boks aktif.
  * Cetak Dokumen:
    * **Label Boks:** Berisi QR Code, nomor boks, rentang nomor invoice, dan tanggal pengemasan.
    * **Surat Jalan Pengiriman:** Rekap daftar invoice di dalam boks untuk ditandatangani oleh bagian ekspedisi gudang.
  * Status Boks: `Open` -> `Sealed` -> `In Transit` -> `Received in Warehouse` (dengan pencatatan Nomor Rak / Baris Gudang).

---

## 5. SKEMA DATABASE (MYSQL ENTITY RELATIONSHIP)

```sql
-- 1. Users Table
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'logger', 'supervisor', 'warehouse') DEFAULT 'logger',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

-- 2. Warehouse Boxes Table
CREATE TABLE warehouse_boxes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    box_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NULL,
    rack_location VARCHAR(100) NULL,
    status ENUM('open', 'sealed', 'in_transit', 'stored') DEFAULT 'open',
    sealed_at TIMESTAMP NULL,
    received_at TIMESTAMP NULL,
    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 3. Invoices Table
CREATE TABLE invoices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tracking_code VARCHAR(100) UNIQUE NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(150) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency VARCHAR(10) DEFAULT 'IDR',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    tax_ppn DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    tax_pph DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    
    -- Status Alur 6 Tahap
    status ENUM(
        'received',
        'verified',
        'data_inputted',
        'scanned',
        'reconciled',
        'boxed',
        'archived'
    ) DEFAULT 'received',
    
    reconciliation_notes TEXT NULL,
    verified_by BIGINT UNSIGNED NULL,
    reconciled_by BIGINT UNSIGNED NULL,
    box_id BIGINT UNSIGNED NULL,
    created_by BIGINT UNSIGNED,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (verified_by) REFERENCES users(id),
    FOREIGN KEY (reconciled_by) REFERENCES users(id),
    FOREIGN KEY (box_id) REFERENCES warehouse_boxes(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_vendor (vendor_name)
);

-- 4. Invoice Attachments (Digital Scans & Supporting Files)
CREATE TABLE invoice_attachments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT UNSIGNED NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_kb INT UNSIGNED NOT NULL,
    page_count INT UNSIGNED DEFAULT 1,
    source ENUM('scanner_flatbed', 'manual_upload') DEFAULT 'scanner_flatbed',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- 5. Audit Log Activity
CREATE TABLE invoice_activity_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 6. SPESIFIKASI API ENDPOINT (LARAVEL)

### 6.1 Autentikasi
* `POST /api/auth/login` - Autentikasi user & mengembalikan Bearer Token Sanctum [cite: 3].
* `POST /api/auth/logout` - Revoke current token [cite: 3].
* `GET /api/auth/me` - Ambil profil dan permissions user aktif [cite: 3].

### 6.2 Modul Invoice
* `GET /api/invoices` - Ambil list invoice (dukungan pagination, search vendor, filter status) [cite: 3].
* `POST /api/invoices` - Buat invoice baru (Tahap 1 & Tahap 3) [cite: 3].
* `GET /api/invoices/{id}` - Detail invoice beserta attachments dan history log [cite: 3].
* `PUT /api/invoices/{id}/verify` - Update status checklist verifikasi (Tahap 2) [cite: 3].
* `POST /api/invoices/upload-scan` - Upload file scan PDF/Image multi-halaman (Tahap 4) via `multipart/form-data` [cite: 3].
* `PUT /api/invoices/{id}/reconcile` - Set status reconciled atau request revisi (Tahap 5) [cite: 3].

### 6.3 Modul Warehouse & Boxing
* `GET /api/boxes` - List data boks arsip dan kapasitasnya [cite: 3].
* `POST /api/boxes` - Buat boks baru [cite: 3].
* `POST /api/boxes/{id}/add-invoice` - Menambahkan invoice ke dalam boks (Tahap 6) [cite: 3].
* `PUT /api/boxes/{id}/seal` - Mengunci boks dan generate surat jalan [cite: 3].
* `PUT /api/boxes/{id}/receive` - Update status boks diterima di gudang beserta lokasi rak [cite: 3].

---

## 7. NON-FUNCTIONAL REQUIREMENTS (NFR)

1. **Performa & Ukuran Berkas:**
   * Hasil scan PDF otomatis dikompresi ke resolusi 200 DPI Grayscale (ukuran per halaman rata-rata 100–300 KB) [cite: 3].
   * Waktu upload dokumen ke cPanel shared hosting tidak melebihi 3 detik per berkas pada koneksi kantor standar [cite: 3].
2. **Kesesuaian Hosting cPanel:**
   * Konfigurasi PHP pada cPanel `php.ini`:
     * `upload_max_filesize = 32M` [cite: 3]
     * `post_max_size = 32M` [cite: 3]
     * `max_execution_time = 120` [cite: 3]
     * `memory_limit = 256M` [cite: 3]
   * CORS diizinkan untuk origin client desktop (`file://`, `http://localhost`) [cite: 3].
3. **Keamanan (Security):**
   * Semua komunikasi data melalui protokol HTTPS/TLS [cite: 3].
   * Kredensial token disimpan di secure local storage / electron safe storage [cite: 3].
   * File upload diverifikasi ekstensi MIME type-nya (`application/pdf`, `image/jpeg`, `image/png`) [cite: 3].
4. **Kompatibilitas Sistem Operasi:**
   * Target Client: Windows 10 & Windows 11 (64-bit) dengan driver HP DeskJet 2130 series WIA [cite: 3].

---

## 8. TIMELINE & RENCANA IMPLEMENTASI (MILESTONES)

* **Sprint 1 (Minggu 1-2):**
  * Setup Backend Laravel, Migrations, Seeders, dan Authentication API [cite: 3].
  * Setup Base Electron + React + Tailwind + Routing [cite: 3].
* **Sprint 2 (Minggu 3-4):**
  * Implementasi Tahap 1 (Penerimaan), Tahap 2 (Verifikasi), dan Tahap 3 (Input Data) [cite: 3].
  * Bundling engine NAPS2 CLI ke Electron Main Process dengan profil Flatbed HP [cite: 3].
* **Sprint 3 (Minggu 5-6):**
  * Implementasi Tahap 4 (Flatbed Multi-Page UI Loop & Upload API) [cite: 3].
  * Implementasi Tahap 5 (Split-Screen Reconciliation PDF Viewer) [cite: 3].
* **Sprint 4 (Minggu 7-8):**
  * Implementasi Tahap 6 (Warehouse Box Management, Print Label, Surat Jalan) [cite: 3].
  * Testing UAT bersama tim Finance & deploy API ke cPanel Shared Hosting [cite: 3].
  * Build installer Windows (`.exe`) via `electron-builder` [cite: 3].

---
*Dokumen ini telah disesuaikan dengan profil perangkat keras Flatbed Scanner HP DeskJet 2132.*
