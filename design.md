# DESIGN SYSTEM & UI/UX GUIDELINES (design.md)
**Project:** Sistem Logger & Pengarsipan Invoice (Finance Desktop Application)  
**Platform:** Electron.js Desktop (React + Tailwind CSS)  
**Theme:** Minimalist Enterprise White & Crisp Slate (Corporate Clean)  
**Version:** v1.0.0  

---

## 1. DESIGN PHILOSOPHY & PRINCIPLES

1. **Information Density with Breathing Room:** Aplikasi finance membutuhkan efisiensi input tinggi tanpa membuat staf merasa sesak. Tata letak memanfaatkan *clean grid* dengan *whitespace* yang terukur.
2. **True Corporate White & Soft Contrast:** Dominan warna putih (`#FFFFFF`) dan abu-abu sangat lembut (`#F8FAFC`) untuk mengurangi kelelahan mata staf selama pemakaian 8 jam kerja.
3. **High-Legibility Data Visualization:** Angka nominal finansial, kode resi, dan tanggal transaksi diformat menggunakan font angka monospace/tabular (`tabular-nums`) agar posisi desimal sejajar rapi saat diinspeksi.
4. **Keyboard-First & High Efficiency:** Mendukung *keyboard shortcut* navigasi form cepat (`Tab`, `Enter`, `Esc`, `Ctrl+S`, `Ctrl+P`).
5. **Fail-Safe Operational Feedback:** Status dokumen (6 tahapan alur) dibedakan secara tegas dengan indikator visual pill/badge tanpa warna neon mencolok.

---

## 2. TYPOGRAPHY SYSTEM

### 2.1 Font Families
* **Primary Sans:** `'Plus Jakarta Sans'`, `'Inter'`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
  * Karakteristik: Geometris, modern, tegas, sangat mudah dibaca pada layar monitor kantor (1080p).
* **Monospace / Numerical:** `'JetBrains Mono'`, `'Fira Code'`, `ui-monospace`, `monospace`
  * Digunakan khusus untuk: Kode Tracking (`REC-2026...`), Nomor Invoice Vendor, Nomor Boks, Nominal Uang (IDR/USD).

### 2.2 Hierarchy & Type Scale

| Level | Size (Tailwind) | Weight | Line Height | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Page Title** | `text-xl` (20px) | `font-bold` (700) | `leading-snug` | `-tracking-tight` | Header modul utama |
| **Section Header** | `text-base` (16px) | `font-semibold` (600) | `leading-normal` | `-tracking-normal` | Judul card, modal title |
| **Field Label** | `text-xs` (12px) | `font-medium` (500) | `leading-none` | `tracking-wide uppercase` | Label form input, table header |
| **Body / Input Text** | `text-sm` (14px) | `font-normal` (400) | `leading-relaxed` | `normal` | Teks isi, nilai input form |
| **Meta / Hint / Caption** | `text-xs` (12px) | `font-normal` (400) | `leading-tight` | `normal` | Sub-label, timestamp log |
| **Financial / Code Badge** | `text-xs` (12px) | `font-semibold` (600) | `leading-none` | `tabular-nums` | Tag status, nominal transaksi |

---

## 3. COLOR PALETTE (TAILWIND TOKENS)

Tema didesain dengan fondasi **Corporate Slate & Pure White**, dipadukan dengan aksen **Executive Navy/Indigo** yang profesional dan tidak mencolok.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COLOR PALETTE PREVIEW                           │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ Background Pure │ Background Muted │ Border Neutral  │ Primary Accent  │
│ #FFFFFF (White) │ #F8FAFC (Slate50)│ #E2E8F0(Slate200│ #0F172A (Navy)  │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ Text Primary    │ Text Secondary   │ Status Valid    │ Status Pending  │
│ #0F172A(Slate900│ #64748B(Slate500)│ #059669(Emerald)│ #D97706 (Amber) │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

### 3.1 Background & Neutral Tokens
* **App Shell Background:** `bg-[#F8FAFC]` (`slate-50`)
* **Card & Surface Background:** `bg-[#FFFFFF]` (`white`)
* **Subtle Panel Fill:** `bg-[#F1F5F9]` (`slate-100`)
* **Border Neutral Default:** `border-[#E2E8F0]` (`slate-200`)
* **Border Input Focused:** `focus:border-[#0F172A]` (`slate-900`)

### 3.2 Text Color Tokens
* **Text Primary (High Contrast):** `text-[#0F172A]` (`slate-900`)
* **Text Secondary (Labels/Hints):** `text-[#475569]` (`slate-600`)
* **Text Muted (Placeholders/Disabled):** `text-[#94A3B8]` (`slate-400`)

### 3.3 Status & Semantic Tokens

| Status / Tahap | Badge Background | Badge Text | Dot Indicator | Arti Bisnis |
| :--- | :--- | :--- | :--- | :--- |
| **Received / Draft** | `bg-slate-100` | `text-slate-700` | `bg-slate-400` | Berkas baru masuk |
| **Verified** | `bg-blue-50` | `text-blue-700` | `bg-blue-500` | Kelengkapan valid |
| **Data Inputted** | `bg-indigo-50` | `text-indigo-700` | `bg-indigo-500` | Nilai tercatat |
| **Scanned** | `bg-purple-50` | `text-purple-700` | `bg-purple-500` | File PDF terunggah |
| **Reconciled** | `bg-emerald-50` | `text-emerald-700` | `bg-emerald-600` | Cocok fisik & digital |
| **Boxed / In Warehouse** | `bg-teal-50` | `text-teal-700` | `bg-teal-600` | Siap kirim / tersimpan |
| **Action Needed / Incomplete** | `bg-amber-50` | `text-amber-700` | `bg-amber-500` | Butuh revisi/susulan |
| **Rejected / Cancelled** | `bg-rose-50` | `text-rose-700` | `bg-rose-500` | Dokumen ditolak |

---

## 4. LAYOUT SYSTEM & DESKTOP SHELL

Aplikasi desktop didesain khusus untuk monitor kantor (1366x768 hingga 1920x1080) dengan layout terstruktur:

```text
+------------------------------------------------------------------------------------+
|  [Custom Windows Titlebar]   Sistem Logger & Pengarsipan Invoice     [ _ ] [ 口 ] [ X ] |
+---------+--------------------------------------------------------------------------+
|         | Top Header: Active User | Sync Status (cPanel) | Scanner Status (Ready)  |
| SIDEBAR +--------------------------------------------------------------------------+
| (240px) | Page Header: Title + Primary Action Button                               |
| Fixed   +--------------------------------------------------------------------------+
|         |                                                                          |
| - Logo  | MAIN CONTENT WORKSPACE                                                   |
| - Nav 1 | (Data Table / Multi-step Form / Split-Screen Reconciliation)             |
| - Nav 2 |                                                                          |
| - Nav 3 |                                                                          |
| - Sett. |                                                                          |
+---------+--------------------------------------------------------------------------+
```

### 4.1 Layout Dimensions
* **Sidebar Width:** `w-60` (240px) fixed, `border-r border-slate-200 bg-white`.
* **Top Header Height:** `h-14` (56px) fixed, `border-b border-slate-200 bg-white/80 backdrop-blur`.
* **Main Content Area:** `flex-1 overflow-y-auto p-6 bg-slate-50`.
* **Standard Container Card:** `bg-white border border-slate-200 rounded-lg shadow-sm p-5`.

---

## 5. ATURAN UI KOMPONEN (COMPONENT SPECS)

### 5.1 Buttons (Tombol Aksi)
* **Primary Button (Aksi Utama, Simpan, Pindai):**
  * Class: `bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium text-xs px-4 py-2 rounded-md transition shadow-sm flex items-center gap-2`
* **Secondary / Outline Button (Batal, Filter, Export):**
  * Class: `bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs px-4 py-2 rounded-md border border-slate-300 transition shadow-2xs flex items-center gap-2`
* **Danger Button (Hapus, Reject):**
  * Class: `bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2 rounded-md transition`

### 5.2 Input Fields & Form Controls
* **Standard Text / Number Input:**
  * Container: `flex flex-col gap-1.5`
  * Label: `text-[11px] font-semibold text-slate-600 tracking-wider uppercase`
  * Input: `h-9 px-3 text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition font-sans`
  * Financial Input (Rupiah): Tambahkan prefix `Rp` permanen di sisi kiri dengan class font `tabular-nums font-mono text-right`.

### 5.3 Data Tables (Tabel Daftar Invoice)
* **Table Wrapper:** `overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs`
* **Table Header (`<thead>`):** `bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider`
* **Table Row (`<tr>`):** `border-b border-slate-100 hover:bg-slate-50/80 transition cursor-pointer`
* **Cell Padding:** `px-4 py-3 text-xs text-slate-800`

---

## 6. POLA KHUSUS: RECONCILIATION SPLIT-SCREEN (TAHAP 5)

Layar krusial di mana staf finance memverifikasi berkas fisik digital dengan inputan angka:

```text
+------------------------------------------------------------------------------------+
|  < Kembali ke List       REKONSILIASI: INV/2026/08/0012            [Approve] [Revisi]  |
+------------------------------------------+-----------------------------------------+
| SISI KIRI: PDF VIEWER (50% Lebar)        | SISI KANAN: DATA AUDIT FORM (50% Lebar) |
| - Background: #334155 (Slate 700)        | - Background: White                     |
| - Fitur: Multi-page, Zoom 100%, Rotate   | - Read-only Field Summary (Vendor, Tgl) |
| - PDF Preview Document Canvas            | - Input Table: Nominal DPP, PPN, Total  |
|                                          | - Checklist Validasi:                   |
|                                          |   [v] Nominal sama dengan scan          |
|                                          |   [v] Faktur Pajak terlampir            |
|                                          | - Catatan Supervisor Box                |
+------------------------------------------+-----------------------------------------+
```

---

## 7. UX PATTERNS & MICRO-INTERACTIONS

1. **Scanner Hardware Feedback (Opsi 2):**
   * Saat tombol *Scan* diklik, tombol masuk ke status disabled dengan spinner halus dan teks: *"Scanner beroperasi... (ADF Feeder)"*.
   * Setelah selesai, muncul *toast notification* non-intrusif di pojok kanan bawah: *"Pindai selesai: 3 Halaman terdeteksi"*.
2. **Keyboard Focus Trap pada Modal:**
   * Setiap modal pop-up (misal: Konfirmasi Boks Arsip) otomatis memfokuskan tombol aksi utama, dan tombol `Esc` untuk menutup dialog.
3. **Empty States:**
   * Jika tidak ada invoice dalam antrean, jangan biarkan layar kosong putih. Tampilkan ilustrasi minimalis garis halus (line-art icon), judul *"Belum Ada Invoice Baru"*, dan tombol *"Input Invoice Sekarang"*.
4. **Offline / Sync Indicator:**
   * Status koneksi ke shared hosting cPanel ditandai dot kecil di header:
     * Hijau (`bg-emerald-500`): *Terkoneksi ke Server*
     * Kuning (`bg-amber-500`): *Mengunggah Dokumen...*
     * Merah (`bg-rose-500`): *Koneksi Terputus (Mode Offline)*

---

## 8. TAILWIND CONFIG EXTENSION REFERENCE

```javascript
// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        corporate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      }
    },
  },
  plugins: [],
}
```
