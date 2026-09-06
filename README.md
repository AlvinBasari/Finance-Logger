# Sistem Logger & Pengarsipan Invoice (Finance Desktop Application)

Aplikasi Desktop Finance berbasis **Electron.js + React + Tailwind CSS** yang terhubung dengan **Laravel 11/12 RESTful API (Sanctum + MySQL)** untuk mendigitalkan, memverifikasi, merekonsiliasi, dan melacak seluruh siklus hidup invoice fisik 6 tahap.

---

## 🌟 Fitur Utama (6 Tahapan Operasional)

1. **Tahap 1: Penerimaan Dokumen Fisik**
   - Registrasi berkas masuk dari vendor / ekspedisi / divisi internal.
   - Auto-generate kode unik `REC-YYYYMMDD-XXXX`.
   - Validasi asinkron mencegah duplikasi nomor invoice vendor.
   - Cetak tanda terima / resi fisik dengan Barcode CODE128.

2. **Tahap 2: Pemeriksaan Kelengkapan & Fisik Dokumen**
   - Checklist lampiran wajib: Faktur Pajak, Surat Jalan / DO, PO, BAST.
   - Status verifikasi: *Complete* (Lengkap), *Incomplete* (Pending), *Rejected* (Ditolak).
   - Catatan pemeriksa untuk dokumen kurang/cacat.

3. **Tahap 3: Penginputan Data Finansial & Akuntansi**
   - Input Nilai DPP, PPN (11% / 12% / Kustom dengan tombol preset), Potongan PPh, dan Tanggal Jatuh Tempo.
   - Auto-calculate total tagihan otomatis.
   - Format finansial rapi dengan standar *tabular-nums font-mono*.

4. **Tahap 4: Digitalisasi Dokumen (Hardware Scanner Flatbed HP DeskJet 2132)**
   - Loop pemindaian multi-halaman interaktif via driver WIA (`--driver wia --source glass --dpi 200`).
   - Pratinjau thumbnail per halaman yang dipindai.
   - Penggabungan otomatis multi-halaman menjadi 1 berkas PDF utuh.
   - Fallback uploader manual (drag-and-drop PDF / gambar).

5. **Tahap 5: Rekonsiliasi Kesesuaian (Split-Screen Dual-Pane)**
   - **Sisi Kiri (50%):** In-app interactive PDF Viewer (Zoom in/out, Rotate, Navigasi halaman).
   - **Sisi Kanan (50%):** Data audit summary, checklist kesesuaian fisik & digital, dan form approval supervisor.
   - Keputusan: *Approve & Mark as Reconciled* atau *Need Correction* (kembali ke Tahap 3).

6. **Tahap 6: Pengarsipan Boks & Warehouse Tracking**
   - Pembuatan Boks Kardus Baru: `BOX-FIN-YYYY-XXXX`.
   - Scan barcode tanda terima / input cepat untuk memasukkan invoice ke dalam boks.
   - Cetak **Label Boks dengan QR Code** & Cetak **Surat Jalan Pengiriman**.
   - Konfirmasi penerimaan di gudang beserta pencatatan nomor/baris rak (misal: *Rak A-02 / Baris 3*).

---

## 🔑 Akun Bawaan (Default Login Credentials)

| Role | Email | Password | Hak Akses Utama |
| :--- | :--- | :--- | :--- |
| **Finance Logger** | `logger@finance.local` | `password123` | Penerimaan, Verifikasi, Input Nilai, Scan Flatbed, Packing Boks |
| **Finance Supervisor** | `supervisor@finance.local` | `password123` | Verifikasi, Approval Rekonsiliasi, Monitoring |
| **Warehouse Custodian** | `warehouse@finance.local` | `password123` | Konfirmasi Inbound Boks, Update Nomor Rak Gudang |
| **System Administrator** | `admin@finance.local` | `password123` | Akses Penuh Seluruh Modul & Pengaturan |

*(Tersedia tombol **Pilihan Cepat Akun Role** di halaman Login dan Settings untuk memudahkan pengujian)*

---

## 🚀 Cara Menjalankan Aplikasi

### Cara Termudah (1-Klik untuk Backend + Desktop):
Cukup klik ganda file:
```cmd
start_app.bat
```
File ini akan otomatis menyalakan Backend Laravel di port `8088` dan membuka aplikasi desktop Electron.

---

### Cara Manual (Menjalankan Terpisah):
1. **Jalankan Backend API:**
   ```cmd
   start_backend.bat
   ```
   (Atau `cd backend && php artisan serve --host=127.0.0.1 --port=8088`)

2. **Jalankan Aplikasi Desktop:**
   ```cmd
   start_desktop.bat
   ```
   (Atau `cd client && npm run app:dev`)

---

## 📂 Struktur Proyek

```text
projek waril/
├── backend/                  # Laravel 11/12 RESTful API & MySQL
│   ├── app/Http/Controllers/Api/  # AuthController, InvoiceController, WarehouseBoxController
│   ├── app/Models/           # User, Invoice, WarehouseBox, InvoiceAttachment, InvoiceActivityLog
│   ├── database/migrations/  # Skema MySQL lengkap 6 tahap
│   ├── database/seeders/     # User 4 roles & sample data
│   └── routes/api.php        # Endpoint API Sanctum
│
├── client/                   # Electron + Vite + React 18 Desktop App
│   ├── electron/             # main.cjs (Window & Scanner Bridge) & preload.cjs
│   └── src/
│       ├── components/       # AppShell, Button, Input, Card, Modal, PdfViewer, PrintModal, Toast
│       ├── pages/            # Login, Dashboard, Stage 1 s.d. 6, InvoiceList, Settings
│       ├── services/         # Axios API client
│       └── store/            # Zustand AuthStore & AppStore
│
├── start_backend.bat         # Runner cepat Backend API
├── start_desktop.bat         # Runner cepat Desktop Electron
├── prd (1).md                # Product Requirement Document
├── arsitektur.md             # Arsitektur & Spesifikasi Hardware
└── design.md                 # Design System & UI/UX Guidelines
```
