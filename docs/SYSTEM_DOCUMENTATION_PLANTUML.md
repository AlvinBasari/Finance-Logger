# DOKUMENTASI SISTEM & DIAGRAM UML LENGKAP
## Finance Invoice Logger & Archiving System (Finance-Logger)

> **Dokumen Versi:** 2.0.0  
> **Status:** Production Ready & GitHub Synchronized  
> **Repository:** [AlvinBasari/Finance-Logger](https://github.com/AlvinBasari/Finance-Logger)  
> **Standar UML:** PlantUML v1.2024+ (Compatible with PlantUML Server, VSCode PlantUML, and GitHub Markdown Renderers)

---

## DAFTAR ISI
1. [Ringkasan Sistem & Arsitektur Global](#1-ringkasan-sistem--arsitektur-global)
2. [Diagram Arsitektur Sistem (System Architecture Diagram)](#2-diagram-arsitektur-sistem)
3. [Diagram Use Case (Use Case Diagram)](#3-diagram-use-case)
4. [Diagram Sequence (Sequence Diagrams)](#4-diagram-sequence)
   - 4.1 [Autentikasi (Login & Logout)](#41-sequence-diagram-autentikasi-login--logout)
   - 4.2 [Tahap 1: Penerimaan & Registrasi Invoice (Stage 1)](#42-sequence-diagram-tahap-1-penerimaan--registrasi-invoice)
   - 4.3 [Tahap 2: Verifikasi Fisik & Checklist Star Energy (Stage 2)](#43-sequence-diagram-tahap-2-verifikasi-fisik--checklist-star-energy)
   - 4.4 [Tahap 3: Entry Data Finansial & Pajak (Stage 3)](#44-sequence-diagram-tahap-3-entry-data-finansial--pajak)
   - 4.5 [Tahap 4: Digitalisasi Scanner & Upload Attachment (Stage 4)](#45-sequence-diagram-tahap-4-digitalisasi-scanner--upload-attachment)
   - 4.6 [Tahap 5: Rekonsiliasi & Finalisasi Supervisor (Stage 5)](#46-sequence-diagram-tahap-5-rekonsiliasi--finalisasi-supervisor)
   - 4.7 [Tahap 6: Pengemasan Box & Pengarsipan Gudang (Stage 6)](#47-sequence-diagram-tahap-6-pengemasan-box--pengarsipan-gudang)
   - 4.8 [Modul Peminjaman Dokumen & Dynamic Watermarking PDF](#48-sequence-diagram-peminjaman-dokumen--dynamic-watermarking-pdf)
   - 4.9 [Otomasi Notifikasi Email & Pengingat Jatuh Tempo](#49-sequence-diagram-otomasi-notifikasi-email--pengingat-jatuh-tempo)
5. [Diagram Kelas (Class Diagram)](#5-diagram-kelas-class-diagram)
6. [Diagram Relasi Entitas / Database (Entity Relationship Diagram - ERD)](#6-diagram-relasi-entitas--database-erd)
7. [Diagram State Machine (State Machine Diagrams)](#7-diagram-state-machine)
   - 7.1 [Status Lifecycle Invoice (6-Stage Pipeline)](#71-state-machine-invoice-lifecycle)
   - 7.2 [Status Lifecycle Peminjaman Dokumen (Document Loan)](#72-state-machine-document-loan-lifecycle)
   - 7.3 [Status Lifecycle Box Arsip Gudang (Warehouse Box)](#73-state-machine-warehouse-box-lifecycle)
8. [Diagram Aktivitas (Activity Diagrams)](#8-diagram-aktivitas-activity-diagrams)
   - 8.1 [Alur Pemrosesan Dokumen End-to-End](#81-activity-diagram-alur-pemrosesan-dokumen-end-to-end)
   - 8.2 [Alur Peminjaman, Watermarking, dan Pengembalian](#82-activity-diagram-alur-peminjaman-watermarking-dan-pengembalian)
9. [Diagram Deployment & Infrastruktur (Deployment Diagram)](#9-diagram-deployment--infrastruktur)

---

## 1. Ringkasan Sistem & Arsitektur Global

**Finance-Logger** adalah sistem komprehensif untuk tata kelola, pelacakan fisik, digitalisasi (scanning), rekonsiliasi finansial/pajak, pengemasan boks arsip gudang (*warehouse boxing*), serta peminjaman dokumen resmi (*document loan*) kepada pihak eksternal (KAP, Pajak, Vendor, Legal) dan internal.

### Modul Utama Sistem:
1. **Autentikasi & RBAC (Role-Based Access Control):** Login, Logout, Sanctum Token, peran Admin, Logger (Staf Registrasi), Supervisor / FP (Verifikator Keuangan), dan Warehouse (Arsiparis).
2. **Pipeline Pemrosesan 6 Tahap:**
   - *Stage 1 (Receipt):* Registrasi invoice masuk dari vendor, auto-generate kode pelacakan (`TRK-YYYYMMDD-XXXX`), deteksi duplikasi.
   - *Stage 2 (Verification):* Validasi fisik 7 kategori checklist standar Star Energy Geothermal (Invoice Bermaterai, Faktur Pajak, Acceptance Letter/BAST, Delivery Order, Purchase Order, Fotokopi Kontrak, Dokumen Pendukung Pajak/Legalitas), preset PO/SO, dan cetak lembar verifikasi resmi.
   - *Stage 3 (Data Input):* Input nominal finansial, PPN, PPh, No Invoice, tanggal jatuh tempo, dan currency.
   - *Stage 4 (Scanning):* Integrasi flatbed scanner (HP DeskJet 2132 via NAPS2 CLI / WIA Bridge) & upload berkas softfile PDF dari vendor.
   - *Stage 5 (Reconciliation):* Pencocokan fisik vs sistem dan persetujuan supervisor keuangan.
   - *Stage 6 (Warehouse Boxing):* Penempatan invoice ke box arsip (`BOX-YYYYMM-XXXX`), pelabelan rak gudang (`rack_location`), penyegelan (*sealed*), dan konfirmasi penerimaan gudang (*stored*).
3. **Peminjaman Dokumen Eksternal/Internal (Document Loans):**
   - Registrasi peminjaman (`LN-YYYYMM-XXXX`), scan check-out barcode fisik dari box.
   - **Client-Side Dynamic Watermarking (pdf-lib):** Stamp keamanan diagonal nama instansi/auditor, peruntukan, timestamp, dan confidentiality header/footer.
   - **Email Dispatcher Otomatis:** Notifikasi konfirmasi peminjaman, pengingat H-3 / H-1 jatuh tempo, peringatan overdue, dan tanda terima pengembalian (Blade HTML templates).
   - Pengembalian dokumen barcode scan in & auto-restorasi kembali ke box gudang asal.
   - Cetak Berita Acara Serah Terima (BAST) & Lembar Pengembalian.

---

## 2. Diagram Arsitektur Sistem

Menjelaskan arsitektur berorientasi desktop (*hybrid client-server*) yang menghubungkan antarmuka Electron Desktop, driver hardware scanner lokal, RESTful API Laravel, media penyimpanan, dan server email.

```plantuml
@startuml System_Architecture
!theme plain
skinparam componentStyle uml2
skinparam shadowing false
skinparam packageBackgroundColor #F8FAFC
skinparam packageBorderColor #64748B
skinparam componentBackgroundColor #FFFFFF
skinparam componentBorderColor #3B82F6

title Finance Invoice Logger & Archiving - System Architecture

package "Client Workstation (Desktop Client)" {
    [HP DeskJet 2132 Scanner] as HW_Scanner #FEF08A
    
    package "Electron Desktop Application" {
        [Electron Main Process (Node.js)] as ElectronMain #E2E8F0
        [Preload Script (ContextBridge)] as Preload #E2E8F0
        [NAPS2 CLI Bridge (WIA Driver)] as NapsBridge #FEF08A
        
        package "Renderer Process (React.js + Tailwind CSS)" {
            [Auth Context & State Store] as AuthStore
            [Stage 1-6 UI Components] as StageViews
            [Document Loans & Watermark UI] as LoanViews
            [PDF Viewer Engine] as PDFViewer
            [Client-Side PDF-lib Engine] as WatermarkEngine #BAE6FD
            [Axios HTTP Client] as AxiosClient
        }
    }
}

package "Backend Server (Cloud / cPanel Shared Hosting)" {
    package "Laravel 11 RESTful API" {
        [Routing & Sanctum Middleware] as APIRouter #E0E7FF
        [AuthController] as C_Auth
        [InvoiceController] as C_Invoice
        [WarehouseBoxController] as C_Box
        [DocumentLoanController] as C_Loan
        [Eloquent ORM Models] as Models
        [Mail Notification Subsystem] as Mailer #FBCFE8
    }
    
    database "Relational Database\n(MySQL / MariaDB / SQLite)" as DB #BBF7D0
    folder "Storage Disk\n(Public Storage / Scans / PDFs)" as Storage #FED7AA
}

cloud "External SMTP Mail Server\n(Gmail / Mailhog / SES)" as SMTP #F472B6

' Relationships
HW_Scanner <--> NapsBridge : WIA Driver Control
NapsBridge <--> ElectronMain : ChildProcess Exec
ElectronMain <--> Preload : IPC (invoke / handle)
Preload <--> StageViews : window.scannerAPI

StageViews --> WatermarkEngine : Generate Watermarked PDF
LoanViews --> WatermarkEngine : Dynamic Overlay PDF
StageViews --> AxiosClient
LoanViews --> AxiosClient
AuthStore --> AxiosClient

AxiosClient --> APIRouter : HTTPS (REST API + Bearer Token)

APIRouter --> C_Auth
APIRouter --> C_Invoice
APIRouter --> C_Box
APIRouter --> C_Loan

C_Auth --> Models
C_Invoice --> Models
C_Box --> Models
C_Loan --> Models

Models --> DB : SQL CRUD & Transactions
C_Invoice --> Storage : Save Scanned PDF / Softfile
C_Loan --> Storage : Save Reference Letters
C_Loan --> Mailer : Trigger Dispatch
Mailer --> SMTP : Send HTML Email Notifications

@enduml
```

---

## 3. Diagram Use Case

Menjelaskan relasi aktor (Admin, Logger, Supervisor/FP, Warehouse, dan Peminjam Eksternal) terhadap fitur dan fungsi sistem.

```plantuml
@startuml Use_Case_Diagram
!theme plain
skinparam shadowing false
skinparam actorBackgroundColor #EFF6FF
skinparam actorBorderColor #2563EB
skinparam usecaseBackgroundColor #FFFFFF
skinparam usecaseBorderColor #0284C7

left to right direction
title Finance Invoice Logger & Archiving - Use Case Diagram

actor "Staf Registrasi\n(Logger)" as Logger
actor "Supervisor / Verifikator\n(Finance FP)" as Supervisor
actor "Arsiparis\n(Warehouse)" as Warehouse
actor "Administrator" as Admin
actor "Peminjam Eksternal\n(KAP / Pajak / Auditor)" as ExtBorrower

rectangle "Finance Invoice Logger & Archiving System" {
    
    package "Modul Autentikasi & Profil" {
        usecase "UC-01: Login Sistem" as UC_Login
        usecase "UC-02: Logout Sistem" as UC_Logout
        usecase "UC-03: Kelola Master Pengguna" as UC_ManageUsers
    }
    
    package "Modul Pemrosesan Invoice (Stage 1 - 5)" {
        usecase "UC-04: Registrasi Invoice Masuk\n(Stage 1: Receipt)" as UC_Stage1
        usecase "UC-05: Pengecekan Duplikasi Invoice" as UC_DupCheck
        usecase "UC-06: Verifikasi Fisik & Star Energy Checklist\n(Stage 2: Verification)" as UC_Stage2
        usecase "UC-07: Cetak Lembar Checklist Resmi" as UC_PrintChecklist
        usecase "UC-08: Entry Data Finansial & Pajak\n(Stage 3: Data Input)" as UC_Stage3
        usecase "UC-09: Pemindaian Fisik Dokumen (Flatbed)\n(Stage 4: Scanning)" as UC_Stage4
        usecase "UC-10: Upload Softfile PDF Vendor" as UC_UploadSoftfile
        usecase "UC-11: Rekonsiliasi & Approval Keuangan\n(Stage 5: Reconciliation)" as UC_Stage5
    }
    
    package "Modul Gudang & Boxing (Stage 6)" {
        usecase "UC-12: Buat Box Arsip Baru" as UC_CreateBox
        usecase "UC-13: Masukkan Invoice ke Box" as UC_AddInvoiceBox
        usecase "UC-14: Segel Box (Sealing)" as UC_SealBox
        usecase "UC-15: Konfirmasi Simpan di Rak Gudang" as UC_StoreBox
        usecase "UC-16: Cetak Label Barcode Box" as UC_PrintBoxLabel
    }
    
    package "Modul Peminjaman Dokumen (Document Loans)" {
        usecase "UC-17: Buat Permohonan Peminjaman" as UC_CreateLoan
        usecase "UC-18: Scan Barcode Check-Out Dokumen" as UC_ScanOut
        usecase "UC-19: Download PDF Watermark Dinamis" as UC_DownloadWatermark
        usecase "UC-20: Cetak BAST Peminjaman" as UC_PrintBAST
        usecase "UC-21: Kirim Pengingat Email Otomatis" as UC_SendEmailReminder
        usecase "UC-22: Proses Pengembalian & Auto-Restore Box" as UC_ReturnLoan
    }
    
    package "Dashboard & Pelaporan" {
        usecase "UC-23: Monitoring KPI & Pipeline Stage" as UC_Dashboard
        usecase "UC-24: Pelacakan & Riwayat Audit Log" as UC_AuditLog
    }
}

' Role associations
Logger --> UC_Login
Logger --> UC_Logout
Logger --> UC_Stage1
Logger --> UC_DupCheck
Logger --> UC_Stage2
Logger --> UC_PrintChecklist
Logger --> UC_Stage3
Logger --> UC_Stage4
Logger --> UC_UploadSoftfile
Logger --> UC_Dashboard
Logger --> UC_AuditLog

Supervisor --> UC_Login
Supervisor --> UC_Logout
Supervisor --> UC_Stage2
Supervisor --> UC_Stage5
Supervisor --> UC_CreateLoan
Supervisor --> UC_DownloadWatermark
Supervisor --> UC_PrintBAST
Supervisor --> UC_SendEmailReminder
Supervisor --> UC_Dashboard

Warehouse --> UC_Login
Warehouse --> UC_Logout
Warehouse --> UC_CreateBox
Warehouse --> UC_AddInvoiceBox
Warehouse --> UC_SealBox
Warehouse --> UC_StoreBox
Warehouse --> UC_PrintBoxLabel
Warehouse --> UC_ScanOut
Warehouse --> UC_ReturnLoan

Admin --> UC_Login
Admin --> UC_Logout
Admin --> UC_ManageUsers
Admin --> UC_Dashboard
Admin --> UC_AuditLog

ExtBorrower ..> UC_CreateLoan : Mengajukan Permohonan
ExtBorrower ..> UC_DownloadWatermark : Menerima Salinan Ber-watermark
ExtBorrower ..> UC_PrintBAST : Menandatangani BAST

' Include & Extend relations
UC_Stage1 ..> UC_DupCheck : <<include>>
UC_Stage2 ..> UC_PrintChecklist : <<extend>>
UC_CreateLoan ..> UC_ScanOut : <<include>>
UC_CreateLoan ..> UC_PrintBAST : <<extend>>
UC_CreateLoan ..> UC_SendEmailReminder : <<extend>>
UC_ReturnLoan ..> UC_AddInvoiceBox : <<include (restore)>>

@enduml
```

---

## 4. Diagram Sequence

### 4.1 Sequence Diagram: Autentikasi (Login & Logout)

```plantuml
@startuml Sequence_Auth
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Pengguna (User)" as User
participant "Login UI (React)" as UI
participant "Axios Client" as Axios
participant "AuthController" as AuthCtrl
participant "User Model" as UserModel
participant "PersonalAccessToken" as TokenModel
database "Database" as DB

== Proses Login ==
User -> UI : Masukkan Email & Password
UI -> Axios : POST /api/auth/login\n{email, password}
Axios -> AuthCtrl : login(request)
AuthCtrl -> UserModel : where('email', email)->first()
UserModel -> DB : SELECT * FROM users WHERE email = ?
DB --> UserModel : Record User
AuthCtrl -> AuthCtrl : Hash::check(password, user.password)

alt Password Valid
    AuthCtrl -> UserModel : createToken('auth_token')
    UserModel -> TokenModel : Insert token record
    TokenModel -> DB : INSERT INTO personal_access_tokens
    DB --> TokenModel : Token Stored
    AuthCtrl --> Axios : 200 OK\n{token, user: {id, name, role}}
    Axios --> UI : Save token in localStorage & update AuthState
    UI --> User : Redirect ke Dashboard sesuai Role
else Password Salah / User Tidak Ditemukan
    AuthCtrl --> Axios : 401 Unauthorized\n{message: "Invalid credentials"}
    Axios --> UI : Error response
    UI --> User : Tampilkan Alert Gagal Login
end

== Proses Logout ==
User -> UI : Klik Tombol Logout
UI -> Axios : POST /api/auth/logout (Bearer Token)
Axios -> AuthCtrl : logout(request)
AuthCtrl -> TokenModel : user->currentAccessToken()->delete()
TokenModel -> DB : DELETE FROM personal_access_tokens WHERE id = ?
DB --> TokenModel : Deleted
AuthCtrl --> Axios : 200 OK\n{message: "Logged out successfully"}
Axios --> UI : Clear localStorage & reset state
UI --> User : Redirect ke Halaman Login

@enduml
```

---

### 4.2 Sequence Diagram: Tahap 1 (Penerimaan & Registrasi Invoice)

```plantuml
@startuml Sequence_Stage1_Receipt
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Staf Registrasi (Logger)" as Logger
participant "Stage1Receipt UI" as UI
participant "Axios Client" as Axios
participant "InvoiceController" as InvCtrl
participant "Invoice Model" as InvModel
participant "InvoiceActivityLog" as LogModel
database "Database" as DB

Logger -> UI : Input Nama Vendor, Jumlah Dokumen, Tgl Terima
UI -> Axios : GET /api/invoices/check-duplicate?vendor=...&invoice_no=...
Axios -> InvCtrl : checkDuplicate(request)
InvCtrl -> InvModel : where(vendor_name)->where(invoice_number)->exists()
InvModel -> DB : SELECT EXISTS(...)
DB --> InvModel : Result (false)
InvCtrl --> Axios : {is_duplicate: false}
Axios --> UI : Indikator Hijau (Aman / Unik)

Logger -> UI : Klik "Simpan & Generate Barcode Resi"
UI -> Axios : POST /api/invoices\n{vendor_name, document_count, received_date, sender_division}
Axios -> InvCtrl : store(request)

InvCtrl -> InvCtrl : Generate Tracking Code:\n"TRK-" + Ymd + "-" + sequential_number
InvCtrl -> InvModel : create([... data, status='received'])
InvModel -> DB : INSERT INTO invoices
DB --> InvModel : Invoice ID & Record

InvCtrl -> LogModel : create(invoice_id, user_id, action='received')
LogModel -> DB : INSERT INTO invoice_activity_logs

InvCtrl --> Axios : 201 Created {invoice, tracking_code}
Axios --> UI : Response Sukses
UI --> Logger : Tampilkan Pop-up Konfirmasi & Tombol Cetak Resi Barcode

@enduml
```

---

### 4.3 Sequence Diagram: Tahap 2 (Verifikasi Fisik & Checklist Star Energy)

```plantuml
@startuml Sequence_Stage2_Verification
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Verifikator Fisik" as Verifier
participant "Stage2Verification UI" as UI
participant "PrintModal (Checklist)" as PrintUI
participant "Axios Client" as Axios
participant "InvoiceController" as InvCtrl
participant "Invoice Model" as InvModel
database "Database" as DB

Verifier -> UI : Scan Barcode Resi / Pilih Invoice dari Daftar
UI -> Axios : GET /api/invoices/{id}
Axios -> InvCtrl : show(id)
InvCtrl -> InvModel : with(['attachments', 'activityLogs'])->find(id)
InvModel -> DB : SELECT invoice data
DB --> InvModel : Invoice Record
InvCtrl --> Axios : 200 OK {invoice}
Axios --> UI : Render Detail Invoice & 7 Kategori Checklist Star Energy

Verifier -> UI : Pilih Preset Filter: [PO (Barang)] / [SO (Jasa)]
UI -> UI : Highlight poin kategori wajib sesuai tipe pesanan

Verifier -> UI : Periksa fisik dan centang item kelengkapan:
note right of UI
1. Invoice Bermaterai (Poin 1.1 - 1.2)
2. Faktur Pajak (Poin 2.1)
3. Acceptance Letter (SO: ML84 / BAST)
4. Delivery Order (PO: DO)
5. Purchase Order (PO: PO / Exhibit B)
6. Fotokopi Kontrak (SO: 5 butir)
7. Dokumen Pajak & Legalitas (SKB/DGT-1/NPWP/PKP)
end note

alt Ingin Mencetak Lembar Verifikasi Fisik
    Verifier -> UI : Klik "Cetak Lembar Check List"
    UI -> PrintUI : Open Modal (Type: checklist)
    PrintUI --> Verifier : Print Preview A4 Layout Resmi Star Energy Geothermal
    Verifier -> PrintUI : Confirm Print (Cetak Fisik)
end

Verifier -> UI : Pilih Status: [Lengkap / Diterima] & Catatan
UI -> Axios : PUT /api/invoices/{id}/verify\n{verification_checklist, verification_status='complete', notes}
Axios -> InvCtrl : verify(id, request)

InvCtrl -> InvModel : update status='verified', verification_checklist, verified_by=auth()->id()
InvModel -> DB : UPDATE invoices SET status = 'verified', ...
DB --> InvModel : Success

InvCtrl -> InvModel : logActivity(user_id, 'verified', notes)
InvModel -> DB : INSERT INTO invoice_activity_logs

InvCtrl --> Axios : 200 OK {message: "Invoice verified"}
Axios --> UI : Update status & Notifikasi Berhasil
UI --> Verifier : Alihkan ke Tahap 3 / Antrean Berikutnya

@enduml
```

---

### 4.4 Sequence Diagram: Tahap 3 (Entry Data Finansial & Pajak)

```plantuml
@startuml Sequence_Stage3_DataInput
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Staf Keuangan (Tax & Finance)" as FinStaff
participant "Stage3DataInput UI" as UI
participant "Axios Client" as Axios
participant "InvoiceController" as InvCtrl
participant "Invoice Model" as InvModel
database "Database" as DB

FinStaff -> UI : Buka Invoice (Status: verified)
UI --> FinStaff : Tampilkan Form Finansial
FinStaff -> UI : Input Nomor Invoice, Tanggal Invoice, Jatuh Tempo, Mata Uang, Subtotal, PPN (11%), PPh (Pasal 23/4 ayat 2)
UI -> UI : Auto-kalkulasi Total Amount = Subtotal + PPN - PPh

FinStaff -> UI : Klik "Simpan Data Finansial"
UI -> Axios : PUT /api/invoices/{id}/financials\n{invoice_number, invoice_date, due_date, currency, subtotal, tax_ppn, tax_pph, total_amount}
Axios -> InvCtrl : updateFinancials(id, request)

InvCtrl -> InvModel : update(financial_data, status='data_inputted')
InvModel -> DB : UPDATE invoices SET ... status='data_inputted'
DB --> InvModel : Success

InvCtrl -> InvModel : logActivity(user_id, 'data_inputted', 'Inputted financial values')
InvModel -> DB : INSERT INTO invoice_activity_logs

InvCtrl --> Axios : 200 OK {invoice}
Axios --> UI : Data tersimpan & status menjadi 'data_inputted'
UI --> FinStaff : Notifikasi Sukses

@enduml
```

---

### 4.5 Sequence Diagram: Tahap 4 (Digitalisasi Scanner & Upload Attachment)

```plantuml
@startuml Sequence_Stage4_Scanning
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Operator Scanner" as Operator
participant "Stage4Scanning UI" as UI
participant "Preload (scannerAPI)" as Preload
participant "Electron Main Process" as ElectronMain
participant "NAPS2.Console CLI" as NAPS2
participant "HP DeskJet 2132" as Scanner
participant "Axios Client" as Axios
participant "InvoiceController" as InvCtrl
participant "Storage Disk" as Storage
database "Database" as DB

== Pemindaian Fisik (Multi-Page Flatbed Append Pattern) ==
Operator -> UI : Letakkan Halaman 1 pada Kaca Scanner & Klik "Pindai Halaman"
UI -> Preload : window.scannerAPI.scanPage({pageNumber: 1})
Preload -> ElectronMain : ipcRenderer.invoke('scan-page', 1)
ElectronMain -> NAPS2 : Exec CLI: NAPS2.Console.exe -o "%TEMP%/page_1.pdf" --driver wia --source glass --dpi 200
NAPS2 -> Scanner : Trigger Hardware Scan
Scanner --> NAPS2 : Raw Image Data
NAPS2 --> ElectronMain : page_1.pdf Generated
ElectronMain --> Preload : Success {path: ".../page_1.pdf"}
Preload --> UI : Preview Thumbnail Page 1

Operator -> UI : Ganti Kertas Lembar 2 & Klik "Pindai Halaman Berikutnya"
UI -> Preload -> ElectronMain -> NAPS2 -> Scanner : Pindai page_2.pdf
Scanner --> NAPS2 --> ElectronMain --> UI : Preview Thumbnail Page 2

Operator -> UI : Klik "Gabungkan & Unggah PDF Final"
UI -> Preload : window.scannerAPI.mergeAndExportPDF([page_1, page_2])
ElectronMain -> NAPS2 : Exec Merge command -> invoice_scanned_final.pdf
ElectronMain --> UI : Return Merged Buffer / Path

UI -> Axios : POST /api/invoices/upload-scan (FormData: file, invoice_id, source='scanner_flatbed')
Axios -> InvCtrl : uploadScan(request)
InvCtrl -> Storage : Storage::disk('public')->putFileAs('invoices/scans', file, filename)
Storage --> InvCtrl : File Path Stored
InvCtrl -> DB : INSERT INTO invoice_attachments (invoice_id, file_path, file_size_kb, page_count, source)
InvCtrl -> DB : UPDATE invoices SET status='scanned'
InvCtrl --> Axios : 200 OK {attachment, status: 'scanned'}
Axios --> UI : Render Dokumen di PDF Viewer
UI --> Operator : Tanda Centang Hijau: "Dokumen Berhasil Didigitalisasi"

@enduml
```

---

### 4.6 Sequence Diagram: Tahap 5 (Rekonsiliasi & Finalisasi Supervisor)

```plantuml
@startuml Sequence_Stage5_Reconciliation
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Supervisor Keuangan" as Supervisor
participant "Stage5Reconciliation UI" as UI
participant "Axios Client" as Axios
participant "InvoiceController" as InvCtrl
participant "Invoice Model" as InvModel
database "Database" as DB

Supervisor -> UI : Buka Antrean Rekonsiliasi (Status: scanned)
UI --> Supervisor : Dual-pane View: Form Finansial (Kiri) vs Dokumen PDF Scan (Kanan)
Supervisor -> UI : Cek kesesuaian nilai invoice fisik dengan softfile & SAP
Supervisor -> UI : Input Catatan Rekonsiliasi & Klik "Approve & Selesaikan Rekonsiliasi"

UI -> Axios : PUT /api/invoices/{id}/reconcile\n{reconciliation_notes: "Sesuai PO & SAP"}
Axios -> InvCtrl : reconcile(id, request)

InvCtrl -> InvModel : update status='reconciled', reconciled_by=auth()->id(), reconciliation_notes
InvModel -> DB : UPDATE invoices SET status='reconciled', ...
DB --> InvModel : Success

InvCtrl -> InvModel : logActivity(user_id, 'reconciled', 'Reconciled & validated by supervisor')
InvModel -> DB : INSERT INTO invoice_activity_logs

InvCtrl --> Axios : 200 OK {invoice}
Axios --> UI : Update status ke 'reconciled'
UI --> Supervisor : Invoice Siap Masuk Tahap 6 (Boxing Arsip Gudang)

@enduml
```

---

### 4.7 Sequence Diagram: Tahap 6 (Pengemasan Box & Pengarsipan Gudang)

```plantuml
@startuml Sequence_Stage6_Warehouse
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Petugas Arsip (Warehouse)" as Warehouse
participant "Stage6Warehouse UI" as UI
participant "Axios Client" as Axios
participant "WarehouseBoxController" as BoxCtrl
participant "WarehouseBox Model" as BoxModel
participant "Invoice Model" as InvModel
database "Database" as DB

== 1. Pembuatan / Pemilihan Box ==
Warehouse -> UI : Buat Box Baru (Nomor Box: Auto-generate / Input manual, Lokasi Rak: "RAK-A-03")
UI -> Axios : POST /api/boxes {box_number, rack_location, description}
Axios -> BoxCtrl : store(request)
BoxCtrl -> BoxModel : create(status='open')
BoxModel -> DB : INSERT INTO warehouse_boxes
DB --> BoxCtrl : Box Record Created
BoxCtrl --> Axios : 201 Created {box}
Axios --> UI : Box Terpilih

== 2. Memasukkan Invoice Fisik ke Box (Barcode Scanning) ==
Warehouse -> UI : Scan Barcode Resi Invoice (TRK-...)
UI -> Axios : POST /api/boxes/{box_id}/add-invoice {invoice_id}
Axios -> BoxCtrl : addInvoice(boxId, request)
BoxCtrl -> InvModel : update box_id=box_id, status='boxed'
InvModel -> DB : UPDATE invoices SET box_id=?, status='boxed' WHERE id=?
DB --> BoxCtrl : Success
BoxCtrl --> Axios : 200 OK {message: "Invoice added to box"}
Axios --> UI : List Invoice dalam Box Bertambah

== 3. Penyegelan & Simpan ke Rak Gudang ==
Warehouse -> UI : Klik "Segel Box (Seal Box)"
UI -> Axios : PUT /api/boxes/{box_id}/seal
Axios -> BoxCtrl : seal(boxId)
BoxCtrl -> BoxModel : update status='sealed', sealed_at=now()
BoxModel -> DB : UPDATE warehouse_boxes SET status='sealed'
BoxCtrl --> Axios : 200 OK {box}

Warehouse -> UI : Simpan di Rak Fisik & Klik "Konfirmasi Simpan di Gudang"
UI -> Axios : PUT /api/boxes/{box_id}/receive
Axios -> BoxCtrl : receive(boxId)
BoxCtrl -> BoxModel : update status='stored', received_at=now()
BoxCtrl -> InvModel : where('box_id', boxId)->update(['status' => 'archived'])
InvModel -> DB : UPDATE invoices SET status='archived' WHERE box_id=?
BoxCtrl --> Axios : 200 OK {message: "Box and all invoices archived"}
Axios --> UI : Status Box: 'stored', Semua Invoice: 'archived'

@enduml
```

---

### 4.8 Sequence Diagram: Peminjaman Dokumen & Dynamic Watermarking PDF

```plantuml
@startuml Sequence_Document_Loan_Watermark
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

actor "Petugas Finance / Verifikator" as Staff
actor "Peminjam (Auditor KAP / Pajak)" as Borrower
participant "DocumentLoans UI" as UI
participant "PDFWatermarkService (pdf-lib)" as WMarkService
participant "Axios Client" as Axios
participant "DocumentLoanController" as LoanCtrl
participant "DocumentLoan Model" as LoanModel
participant "Invoice Model" as InvModel
participant "Storage Disk" as Storage
participant "Mail Subsystem" as Mailer
database "Database" as DB

== 1. Registrasi Peminjaman Dokumen ==
Staff -> UI : Buka Form Peminjaman Dokumen
Staff -> UI : Input PIC, Lembaga (PwC/KPP), Email, Tgl Pinjam, Estimasi Kembali, No Surat Tugas
Staff -> UI : Scan Barcode Invoice yang Dipinjam (Multi-item)
Staff -> UI : Klik "Buat Peminjaman & Lepas Fisik"

UI -> Axios : POST /api/loans\n{borrower_name, organization, contact_email, loan_date, expected_return_date, invoice_ids: [...]}
Axios -> LoanCtrl : store(request)

LoanCtrl -> LoanModel : generateLoanCode() -> "LN-202609-0001"
LoanCtrl -> LoanModel : create([... data, status='active'])
LoanModel -> DB : INSERT INTO document_loans
DB --> LoanModel : Loan ID

loop Untuk Setiap Invoice
    LoanCtrl -> DB : INSERT INTO document_loan_items (loan_id, invoice_id, original_box_id, status='borrowed')
    LoanCtrl -> InvModel : update(active_loan_id=loan.id)
    InvModel -> DB : UPDATE invoices SET active_loan_id = ?
end

LoanCtrl -> Mailer : Mail::to(contact_email)->send(new LoanConfirmationMail(loan))
Mailer --> LoanCtrl : Queued / Sent
LoanCtrl --> Axios : 201 Created {loan, loan_code}
Axios --> UI : Response Sukses

== 2. Generate PDF Watermark Dinamis (Client-Side pdf-lib) ==
Borrower -> Staff : Meminta Softfile Berkas untuk Audit
Staff -> UI : Klik Tombol "Watermark PDF" pada Invoice
UI -> Axios : GET /api/invoices/{id} (Ambil file scan asli)
Axios --> UI : PDF Raw ArrayBuffer

UI -> WMarkService : applyWatermarkToPdf(rawPdfBuffer, {\n  watermarkText: "PINJAMAN: KAP PwC",\n  subText: "AUDIT TAHUNAN - TGL: 2026-09-07",\n  confidentialHeader: "STRICTLY CONFIDENTIAL - STAR ENERGY",\n  opacity: 0.18, rotation: -45\n})

WMarkService -> WMarkService : Embed custom fonts & calculate diagonal center
WMarkService -> WMarkService : Draw text diagonal di seluruh halaman
WMarkService -> WMarkService : Draw header & footer disclaimer with timestamp
WMarkService --> UI : Generated Watermarked PDF Blob
UI --> Staff : Download PDF Ber-watermark & Kirim ke Borrower

== 3. Pengembalian Dokumen Fisik (Auto-Restoration) ==
Borrower -> Staff : Mengembalikan Dokumen Fisik Invoice
Staff -> UI : Buka Modal Pengembalian (ReturnLoanModal)
Staff -> UI : Scan Barcode Invoice / Resi Fisik
Staff -> UI : Pilih Kondisi: [Baik / Lengkap] & Klik "Konfirmasi Pengembalian"

UI -> Axios : PUT /api/loans/{id}/return\n{items: [{invoice_id: 101, status: 'returned', notes: 'Kondisi baik'}]}
Axios -> LoanCtrl : returnItems(loanId, request)

LoanCtrl -> DB : UPDATE document_loan_items SET status='returned', returned_at=now()
LoanCtrl -> InvModel : update(active_loan_id = NULL)
note right of LoanCtrl
Invoice otomatis terhubung kembali 
dengan original_box_id sebelumnya.
end note
LoanCtrl -> DB : UPDATE invoices SET active_loan_id = NULL WHERE id = 101
LoanCtrl -> LoanModel : Check if all items returned -> update status='returned'
LoanCtrl -> Mailer : Mail::to(borrower)->send(new LoanReturnReceiptMail(loan))
LoanCtrl --> Axios : 200 OK {message: "Items returned successfully"}
Axios --> UI : Update UI Badge (Active -> Returned, Invoice Ready in Box)

@enduml
```

---

### 4.9 Sequence Diagram: Otomasi Notifikasi Email & Pengingat Jatuh Tempo

```plantuml
@startuml Sequence_Email_Notification
!theme plain
autonumber
skinparam shadowing false
skinparam sequenceMessageAlign center

participant "Laravel Task Scheduler / Manual Trigger" as Scheduler
participant "DocumentLoanController" as LoanCtrl
participant "DocumentLoan Model" as LoanModel
participant "LoanReminderMail / LoanOverdueMail" as Mailable
participant "Blade Template Engine" as Blade
participant "SMTP Server" as SMTP
actor "Peminjam Eksternal (Borrower)" as Borrower

Scheduler -> LoanCtrl : sendReminder(loanId) / Daily Cron Check
LoanCtrl -> LoanModel : with(['items.invoice', 'approver'])->find(loanId)
LoanModel --> LoanCtrl : Loan Data

alt Peminjaman Mendekati Jatuh Tempo (H-3 / H-1)
    LoanCtrl -> Mailable : new LoanReminderMail(loan)
    Mailable -> Blade : Render view('emails.loan_reminder', ['loan' => loan])
    Blade --> Mailable : HTML Email Content
    Mailable -> SMTP : Dispatch SMTP (To: borrower_email)
    SMTP --> Borrower : Terima Email: "[REMINDER] Pengembalian Dokumen Invoice..."
    LoanCtrl -> LoanModel : update(['last_reminder_sent_at' => now()])
else Peminjaman Lewat Jatuh Tempo (Overdue)
    LoanCtrl -> Mailable : new LoanOverdueMail(loan)
    Mailable -> Blade : Render view('emails.loan_overdue', ['loan' => loan])
    Blade --> Mailable : HTML Email Content (Urgent Red Banner)
    Mailable -> SMTP : Dispatch SMTP (To: borrower_email)
    SMTP --> Borrower : Terima Email: "[OVERDUE] Peringatan Keterlambatan Pengembalian..."
    LoanCtrl -> LoanModel : update(['status' => 'overdue', 'last_reminder_sent_at' => now()])
end

LoanCtrl --> Scheduler : 200 OK {message: "Reminder email sent successfully"}

@enduml
```

---

## 5. Diagram Kelas (Class Diagram)

Menjelaskan struktur berorientasi objek pada backend Laravel, termasuk Controller, Model Eloquent, Mailables, dan keterhubungannya.

```plantuml
@startuml Class_Diagram
!theme plain
skinparam classAttributeIconSize 0
skinparam shadowing false
skinparam classBackgroundColor #FFFFFF
skinparam classBorderColor #3B82F6

title Finance Invoice Logger & Archiving - Backend Class Diagram

package "App\\Http\\Controllers\\Api" {
    class AuthController {
        +login(request: Request): JsonResponse
        +logout(request: Request): JsonResponse
        +me(request: Request): JsonResponse
    }

    class InvoiceController {
        +index(request: Request): JsonResponse
        +store(request: Request): JsonResponse
        +show(id: int): JsonResponse
        +verify(id: int, request: Request): JsonResponse
        +updateFinancials(id: int, request: Request): JsonResponse
        +uploadScan(request: Request): JsonResponse
        +finalizeSoftfile(id: int, request: Request): JsonResponse
        +reconcile(id: int, request: Request): JsonResponse
        +checkDuplicate(request: Request): JsonResponse
        +dashboardStats(): JsonResponse
    }

    class WarehouseBoxController {
        +index(request: Request): JsonResponse
        +store(request: Request): JsonResponse
        +show(id: int): JsonResponse
        +addInvoice(id: int, request: Request): JsonResponse
        +removeInvoice(id: int, invoiceId: int): JsonResponse
        +seal(id: int): JsonResponse
        +receive(id: int): JsonResponse
    }

    class DocumentLoanController {
        +index(request: Request): JsonResponse
        +store(request: Request): JsonResponse
        +show(id: int): JsonResponse
        +returnItems(id: int, request: Request): JsonResponse
        +sendReminder(id: int): JsonResponse
        +stats(): JsonResponse
    }
}

package "App\\Models" {
    class User {
        -id: bigint
        -name: string
        -email: string
        -password: string
        -role: string
        -created_at: timestamp
        -updated_at: timestamp
        +isAdmin(): bool
        +isLogger(): bool
        +isSupervisor(): bool
        +isWarehouse(): bool
    }

    class Invoice {
        -id: bigint
        -tracking_code: string
        -vendor_name: string
        -sender_division: string
        -document_count: int
        -received_date: date
        -invoice_number: string
        -invoice_date: date
        -due_date: date
        -currency: string
        -subtotal: decimal
        -tax_ppn: decimal
        -tax_pph: decimal
        -total_amount: decimal
        -status: string
        -verification_checklist: json
        -verification_status: string
        -verification_notes: string
        -reconciliation_notes: string
        -verified_by: bigint
        -reconciled_by: bigint
        -box_id: bigint
        -active_loan_id: bigint
        -created_by: bigint
        +getIsLoanedAttribute(): bool
        +getActiveLoanSummaryAttribute(): array
        +getSoftFileUrlAttribute(): string
        +getLatestFileUrlAttribute(): string
        +logActivity(userId: int, action: string, desc: string): void
        +attachments(): HasMany
        +activityLogs(): HasMany
        +box(): BelongsTo
        +activeLoan(): BelongsTo
        +loanItems(): HasMany
        +creator(): BelongsTo
        +verifier(): BelongsTo
        +reconciler(): BelongsTo
    }

    class WarehouseBox {
        -id: bigint
        -box_number: string
        -description: text
        -rack_location: string
        -status: string
        -sealed_at: timestamp
        -received_at: timestamp
        -created_by: bigint
        +invoices(): HasMany
        +creator(): BelongsTo
    }

    class InvoiceAttachment {
        -id: bigint
        -invoice_id: bigint
        -file_path: string
        -file_name: string
        -file_type: string
        -file_size_kb: int
        -page_count: int
        -source: string
        +getUrlAttribute(): string
        +invoice(): BelongsTo
    }

    class InvoiceActivityLog {
        -id: bigint
        -invoice_id: bigint
        -user_id: bigint
        -action: string
        -description: text
        -created_at: timestamp
        +invoice(): BelongsTo
        +user(): BelongsTo
    }

    class DocumentLoan {
        -id: bigint
        -loan_code: string
        -borrower_type: string
        -borrower_name: string
        -organization: string
        -contact_phone: string
        -contact_email: string
        -purpose: text
        -reference_letter_no: string
        -reference_doc_path: string
        -loan_date: date
        -expected_return_date: date
        -actual_return_date: date
        -loan_type: string
        -status: string
        -approved_by: bigint
        -created_by: bigint
        -notes: text
        -last_reminder_sent_at: timestamp
        +getIsOverdueAttribute(): bool
        +getDaysRemainingAttribute(): int
        +getTotalItemsAttribute(): int
        +getReturnedItemsCountAttribute(): int
        +{static} generateLoanCode(): string
        +items(): HasMany
        +invoices(): HasManyThrough
        +creator(): BelongsTo
        +approver(): BelongsTo
    }

    class DocumentLoanItem {
        -id: bigint
        -loan_id: bigint
        -invoice_id: bigint
        -original_box_id: bigint
        -status: string
        -returned_at: timestamp
        -return_condition_notes: text
        -checked_by: bigint
        +loan(): BelongsTo
        +invoice(): BelongsTo
        +originalBox(): BelongsTo
        +checker(): BelongsTo
    }
}

package "App\\Mail" {
    class LoanConfirmationMail {
        +loan: DocumentLoan
        +build(): Content
    }
    class LoanReminderMail {
        +loan: DocumentLoan
        +build(): Content
    }
    class LoanOverdueMail {
        +loan: DocumentLoan
        +build(): Content
    }
    class LoanReturnReceiptMail {
        +loan: DocumentLoan
        +build(): Content
    }
}

' Controller to Model dependencies
InvoiceController ..> Invoice : uses
InvoiceController ..> InvoiceAttachment : uses
InvoiceController ..> InvoiceActivityLog : uses
WarehouseBoxController ..> WarehouseBox : uses
WarehouseBoxController ..> Invoice : uses
DocumentLoanController ..> DocumentLoan : uses
DocumentLoanController ..> DocumentLoanItem : uses
DocumentLoanController ..> Invoice : uses
DocumentLoanController ..> LoanConfirmationMail : triggers
DocumentLoanController ..> LoanReminderMail : triggers
DocumentLoanController ..> LoanOverdueMail : triggers
DocumentLoanController ..> LoanReturnReceiptMail : triggers

' Model Relationships
User "1" <-- "0..*" Invoice : created_by / verified_by / reconciled_by
User "1" <-- "0..*" WarehouseBox : created_by
User "1" <-- "0..*" DocumentLoan : approved_by / created_by
User "1" <-- "0..*" DocumentLoanItem : checked_by
User "1" <-- "0..*" InvoiceActivityLog : user_id

WarehouseBox "1" o-- "0..*" Invoice : box_id
Invoice "1" *-- "0..*" InvoiceAttachment : attachments
Invoice "1" *-- "0..*" InvoiceActivityLog : activityLogs

DocumentLoan "1" *-- "1..*" DocumentLoanItem : items
DocumentLoan "0..1" <-- "0..*" Invoice : active_loan_id
Invoice "1" <-- "0..*" DocumentLoanItem : invoice_id
WarehouseBox "0..1" <-- "0..*" DocumentLoanItem : original_box_id

@enduml
```

---

## 6. Diagram Relasi Entitas / Database (ERD)

Menampilkan skema relasi database relasional, tipe data, *primary key*, *foreign key*, dan indeks tabel.

```plantuml
@startuml Database_ERD
!theme plain
skinparam linetype ortho
skinparam shadowing false
skinparam entityBackgroundColor #FFFFFF
skinparam entityBorderColor #0284C7

title Finance Invoice Logger & Archiving - Entity Relationship Diagram (ERD)

entity "users" as users {
    * id : bigint <<PK, auto_increment>>
    --
    * name : varchar(255)
    * email : varchar(255) <<UNIQUE>>
    * password : varchar(255)
    * role : varchar(50) <<default: 'logger'>>
    remember_token : varchar(100)
    created_at : timestamp
    updated_at : timestamp
}

entity "warehouse_boxes" as boxes {
    * id : bigint <<PK, auto_increment>>
    --
    * box_number : varchar(100) <<UNIQUE>>
    description : text
    rack_location : varchar(100)
    * status : enum('open','sealed','in_transit','stored')
    sealed_at : timestamp
    received_at : timestamp
    created_by : bigint <<FK -> users.id>>
    created_at : timestamp
    updated_at : timestamp
}

entity "invoices" as invoices {
    * id : bigint <<PK, auto_increment>>
    --
    * tracking_code : varchar(100) <<UNIQUE>>
    * vendor_name : varchar(255)
    sender_division : varchar(255)
    document_count : unsigned int <<default: 1>>
    received_date : date
    invoice_number : varchar(150)
    invoice_date : date
    due_date : date
    currency : varchar(10) <<default: 'IDR'>>
    subtotal : decimal(15,2)
    tax_ppn : decimal(15,2)
    tax_pph : decimal(15,2)
    total_amount : decimal(15,2)
    * status : enum('received','verified','data_inputted','scanned','reconciled','boxed','archived')
    verification_checklist : json
    verification_status : enum('complete','incomplete','rejected')
    verification_notes : text
    reconciliation_notes : text
    verified_by : bigint <<FK -> users.id>>
    reconciled_by : bigint <<FK -> users.id>>
    box_id : bigint <<FK -> warehouse_boxes.id>>
    active_loan_id : bigint <<FK -> document_loans.id>>
    created_by : bigint <<FK -> users.id>>
    created_at : timestamp
    updated_at : timestamp
}

entity "invoice_attachments" as attachments {
    * id : bigint <<PK, auto_increment>>
    --
    * invoice_id : bigint <<FK -> invoices.id>>
    * file_path : varchar(500)
    * file_name : varchar(255)
    * file_type : varchar(100)
    file_size_kb : unsigned int
    page_count : unsigned int
    source : varchar(50) <<default: 'scanner_flatbed'>>
    created_at : timestamp
    updated_at : timestamp
}

entity "invoice_activity_logs" as logs {
    * id : bigint <<PK, auto_increment>>
    --
    * invoice_id : bigint <<FK -> invoices.id>>
    user_id : bigint <<FK -> users.id>>
    * action : varchar(100)
    description : text
    created_at : timestamp
}

entity "document_loans" as loans {
    * id : bigint <<PK, auto_increment>>
    --
    * loan_code : varchar(100) <<UNIQUE>>
    * borrower_type : enum('external','internal')
    * borrower_name : varchar(255)
    * organization : varchar(255)
    * contact_phone : varchar(50)
    contact_email : varchar(150)
    * purpose : text
    reference_letter_no : varchar(150)
    reference_doc_path : varchar(500)
    * loan_date : date
    * expected_return_date : date
    actual_return_date : date
    * loan_type : enum('physical','digital')
    * status : enum('active','returned','partial_returned','overdue')
    approved_by : bigint <<FK -> users.id>>
    created_by : bigint <<FK -> users.id>>
    notes : text
    last_reminder_sent_at : timestamp
    created_at : timestamp
    updated_at : timestamp
}

entity "document_loan_items" as loan_items {
    * id : bigint <<PK, auto_increment>>
    --
    * loan_id : bigint <<FK -> document_loans.id>>
    * invoice_id : bigint <<FK -> invoices.id>>
    original_box_id : bigint <<FK -> warehouse_boxes.id>>
    * status : enum('borrowed','returned','damaged','lost')
    returned_at : timestamp
    return_condition_notes : text
    checked_by : bigint <<FK -> users.id>>
    created_at : timestamp
    updated_at : timestamp
}

' Foreign Key Connections
users ||..o{ invoices : "creates / verifies / reconciles"
users ||..o{ boxes : "creates"
users ||..o{ loans : "creates / approves"
users ||..o{ loan_items : "checks"
users ||..o{ logs : "performs"

boxes ||..o{ invoices : "stores (box_id)"
boxes ||..o{ loan_items : "remembers (original_box_id)"

invoices ||--|{ attachments : "has files"
invoices ||--|{ logs : "has history"
invoices ||..o{ loan_items : "is borrowed in"
loans ||..o{ invoices : "active_loan_id"

loans ||--|{ loan_items : "contains"

@enduml
```

---

## 7. Diagram State Machine

### 7.1 State Machine: Invoice Lifecycle (6-Stage Pipeline)

```plantuml
@startuml State_Invoice_Lifecycle
!theme plain
skinparam stateBackgroundColor #FFFFFF
skinparam stateBorderColor #2563EB
skinparam shadowing false

title State Machine - Siklus Status Invoice (6 Tahap)

[*] --> received : Staf Input Metadata & Resi Terbit (Stage 1)

received --> verified : Verifikasi Fisik & Checklist Star Energy Lengkap (Stage 2)
received --> rejected : Dokumen Tidak Lengkap / Ditolak Verifikator

rejected --> received : Vendor Mengirim Ulang Dokumen Perbaikan

verified --> data_inputted : Entry Nilai Invoice, PPN, PPh & SAP Match (Stage 3)

data_inputted --> scanned : Dokumen Dipindai (Flatbed HP DeskJet / Softfile Upload) (Stage 4)

scanned --> reconciled : Supervisor Melakukan Validasi & Approval Finansial (Stage 5)

reconciled --> boxed : Invoice Dimasukkan ke dalam Box Gudang (Stage 6)

boxed --> archived : Box Disegel & Diterima di Rak Fisik Gudang

archived --> archived : Dipinjam Sementara (active_loan_id terisi) & Dikembalikan

archived --> [*] : Dokumen Memenuhi Masa Retensi Arsip

@enduml
```

---

### 7.2 State Machine: Document Loan Lifecycle

```plantuml
@startuml State_DocumentLoan_Lifecycle
!theme plain
skinparam stateBackgroundColor #FFFFFF
skinparam stateBorderColor #059669
skinparam shadowing false

title State Machine - Status Peminjaman Dokumen (Document Loan)

[*] --> active : Permohonan Dibuat & Fisik/Digital Diserahkan

active --> active : Kirim Pengingat Email (H-3 / H-1)
active --> overdue : Tanggal Hari Ini > expected_return_date & Belum Kembali

overdue --> overdue : Kirim Email Peringatan Keterlambatan Otomatis

active --> partial_returned : Sebagian Berkas Dikembalikan
overdue --> partial_returned : Sebagian Berkas Dikembalikan

partial_returned --> returned : Seluruh Berkas Telah Dikembalikan Lengkap
active --> returned : Seluruh Berkas Dikembalikan Tepat Waktu
overdue --> returned : Seluruh Berkas Dikembalikan Terlambat

returned --> [*] : BAST Pengembalian Ditandatangani & Status Closed

@enduml
```

---

### 7.3 State Machine: Warehouse Box Lifecycle

```plantuml
@startuml State_WarehouseBox_Lifecycle
!theme plain
skinparam stateBackgroundColor #FFFFFF
skinparam stateBorderColor #D97706
skinparam shadowing false

title State Machine - Status Box Arsip Gudang

[*] --> open : Box Baru Dibuat (Siap Diisi Invoice)

open --> open : Scan & Masukkan Invoice (Status invoice -> 'boxed')
open --> sealed : Kapasitas Penuh / Box Disegel Petugas (sealed_at terisi)

sealed --> in_transit : Dikirim dari Ruang Finance ke Gudang Arsip

in_transit --> stored : Petugas Gudang Menempatkan di Rak & Konfirmasi (received_at terisi)
stored --> stored : Pengambilan Fisik Sementara untuk Peminjaman (Box tetap stored)

stored --> [*] : Masa Retensi Box Berakhir / Dimusnahkan Sesuai Jadwal Retensi Arsip

@enduml
```

---

## 8. Diagram Aktivitas (Activity Diagrams)

### 8.1 Activity Diagram: Alur Pemrosesan Dokumen End-to-End

```plantuml
@startuml Activity_EndToEnd
!theme plain
skinparam shadowing false
skinparam activityBackgroundColor #FFFFFF
skinparam activityBorderColor #2563EB

title Activity Diagram - Alur End-to-End Pemrosesan Dokumen

start
:Vendor Mengirimkan Berkas Invoice Fisik;
:Staf Registrasi (Logger) Membuka Sistem;
:Input Metadata Awal (Vendor, Jumlah Lembar, Tgl Terima);
:Sistem Melakukan Pengecekan Duplikasi;

if (Duplikat Ditemukan?) then (Ya)
    :Tampilkan Peringatan & Hentikan Proses;
    stop
else (Tidak)
    :Generate Resi Barcode Pelacakan (TRK-...);
    :Cetak Label Resi & Tempelkan pada Berkas Fisik;
endif

:Verifikator Membuka Stage 2;
:Pilih Preset (Purchase Order / Service Order);
:Pemeriksaan Fisik 7 Kategori Checklist Star Energy;

if (Dokumen Lengkap & Sah?) then (Tidak)
    :Tandai "Incomplete / Rejected" & Tulis Catatan;
    :Kirimkan Berkas Balik ke Vendor / Bagian Terkait;
    stop
else (Lengkap)
    :Tandai "Complete" & Simpan Hasil Checklist;
    opt Cetak Lembar Checklist Resmi
        :Cetak Form Verifikasi Standar Star Energy A4;
    end
endif

:Staf Pajak/Keuangan Input Nilai Finansial (Stage 3);
:Entry No Invoice, Subtotal, PPN, PPh, & Jatuh Tempo;
:Operator Melakukan Pemindaian Scanner Flatbed (Stage 4);
:Gabungkan Seluruh Lembar Menjadi File PDF Tunggal;
:Upload PDF Hasil Scan ke Sistem;

:Supervisor Keuangan Membuka Stage 5 (Rekonsiliasi);
:Bandingkan Tampilan Dual-Pane (Form Fisik vs PDF Scan);

if (Data Cocok & Disetujui?) then (Ya)
    :Supervisor Klik "Approve & Selesaikan Rekonsiliasi";
else (Revisi Diperlukan)
    :Kembalikan ke Tahap Input untuk Koreksi;
    stop
endif

:Petugas Gudang Membuka Stage 6 (Boxing);
:Scan Barcode Resi untuk Memasukkan ke Box Arsip (BOX-...);
:Segel Box & Simpan pada Nomor Rak Gudang yang Ditentukan;
:Konfirmasi Penerimaan di Sistem (Status -> 'archived');

stop
@enduml
```

---

### 8.2 Activity Diagram: Alur Peminjaman, Watermarking, dan Pengembalian

```plantuml
@startuml Activity_Loan_Watermark
!theme plain
skinparam shadowing false
skinparam activityBackgroundColor #FFFFFF
skinparam activityBorderColor #059669

title Activity Diagram - Peminjaman Dokumen, Watermark PDF & Pengembalian

start
:Pihak Luar (KAP/Pajak/Vendor) Mengajukan Permohonan Pinjam;
:Petugas Finance Membuat Registrasi Peminjaman Baru;
:Input Identitas Peminjam, Email, Instansi, dan Masa Pinjam;
:Scan Barcode Dokumen yang Dipinjam;
:Sistem Melepas Dokumen dari Status Aktif Box & Generate No. Pinjam (LN-...);
:Sistem Mengirim Email Konfirmasi & Jadwal Pengembalian ke Peminjam;
:Cetak BAST Peminjaman & Tanda Tangan Fisik;

if (Peminjam Memerlukan Salinan Digital?) then (Ya)
    :Petugas Klik "Download Watermark PDF";
    :Engine pdf-lib Membaca PDF Asli dari Storage;
    :Terapkan Cap Diagonal ("PINJAMAN: [Lembaga]"), Timestamp, & Disclaimer;
    :Unduh Berkas PDF Terproteksi Watermark & Kirim ke Peminjam;
else (Hanya Fisik)
endif

while (Apakah Dokumen Sudah Dikembalikan?) is (Belum)
    if (Hari Ini == Jatuh Tempo - 3 Hari ATAU Jatuh Tempo - 1 Hari?) then (Ya)
        :Sistem Mengirimkan Email Pengingat Otomatis (Loan Reminder);
    elseif (Hari Ini > Jatuh Tempo?) then (Ya)
        :Ubah Status Peminjaman Menjadi 'overdue';
        :Sistem Mengirimkan Email Peringatan Keterlambatan (Overdue Alert);
    endif
    :Tunggu Respon / Kedatangan Peminjam;
endwhile (Sudah Kembali)

:Petugas Menerima Berkas Fisik;
:Buka Form Pengembalian & Scan Barcode Dokumen;
:Periksa Kondisi Fisik Dokumen (Baik / Rusak / Hilang);
:Sistem Menghapus active_loan_id pada Invoice;
:Sistem Mengembalikan Invoice ke Box Arsip Asal (original_box_id);
:Sistem Mengirimkan Email Tanda Terima Pengembalian;
:Cetak Berita Acara Pengembalian Dokumen;

stop
@enduml
```

---

## 9. Diagram Deployment & Infrastruktur

Menjelaskan topologi perangkat keras dan jaringan pada implementasi *Finance-Logger*.

```plantuml
@startuml Deployment_Diagram
!theme plain
skinparam nodeBackgroundColor #FFFFFF
skinparam nodeBorderColor #64748B
skinparam shadowing false

title Deployment & Infrastructure Diagram

node "Finance Workstation (Client PC)" <<Windows 10/11>> {
    node "Hardware Peripherals" {
        artifact "HP DeskJet 2132\n(Flatbed Scanner)" as Dev_Scanner #FEF08A
        artifact "Barcode / QR Scanner\n(USB HID / Virtual COM)" as Dev_Barcode #FEF08A
        artifact "Thermal / Laser Printer\n(A4 & Label Resi)" as Dev_Printer #FEF08A
    }
    
    node "Desktop Runtime" {
        component "Electron Desktop App\n(v30.x LTS)" as App_Electron {
            component "Renderer: React + Tailwind + pdf-lib" as App_React
            component "Node.js Main Process + Preload" as App_Node
        }
        component "NAPS2 Console CLI\n(WIA Engine)" as App_NAPS2
    }
    
    Dev_Scanner <.. App_NAPS2 : USB 2.0 (WIA Protocol)
    Dev_Barcode <.. App_React : Keyboard Emulation (Keystroke)
    App_React ..> Dev_Printer : Windows Print Spooler (Silent/Dialog)
    App_Node <--> App_NAPS2 : Local ChildProcess Execution
    App_Node <--> App_React : IPC contextBridge
}

cloud "Corporate Local Network / Internet (HTTPS)" as Network

node "Production Server (cPanel Shared Hosting / VPS)" <<Linux CentOS / CloudLinux>> {
    node "Web Server (Apache / LiteSpeed)" as WebServer {
        component "public_html/index.php\n(Reverse Proxy & Static Router)" as EntryPoint
        component "public/storage (Symlink)" as StorageSymlink
    }
    
    node "PHP-FPM Environment (PHP 8.2+)" as PHPEnv {
        component "Laravel 11 Core Application" as LaravelApp {
            component "Sanctum Auth Middleware" as SanctumMid
            component "RESTful API Controllers" as Controllers
            component "Eloquent ORM Engine" as EloquentEngine
        }
    }
    
    database "MySQL / MariaDB 10.6+" as DB_Server {
        database "finance_logger_db" as DatabaseSchema #BBF7D0
    }
    
    folder "Local Storage / NAS" as DiskStorage {
        folder "/storage/app/public/invoices/scans" as FolderScans #FED7AA
        folder "/storage/app/public/loans/letters" as FolderLoans #FED7AA
    }
}

node "Cloud Mail Infrastructure" <<External Provider>> {
    component "SMTP Mail Server\n(Google Workspace / Mailgun / SES)" as SMTPServer #FBCFE8
}

' Physical Network Links
App_React --> Network : HTTPS / JSON / FormData
Network --> WebServer : Port 443 (SSL/TLS)
WebServer --> PHPEnv : FastCGI (Unix Socket)
LaravelApp --> DB_Server : Port 3306 (TCP / PDO MySQL)
LaravelApp --> DiskStorage : Read / Write Multi-Page PDF & Attachments
LaravelApp --> SMTPServer : Port 587 / 465 (SMTP TLS)

@enduml
```

---

## 10. Panduan Penggunaan & Rendering Diagram PlantUML

Diagram di atas dapat langsung dilihat atau diekspor dengan metode:

1. **Visual Studio Code:**
   - Install ekstensi `PlantUML` (`jebbs.plantuml`).
   - Tekan `Alt + D` pada file ini untuk melihat preview interaktif diagram secara langsung.
2. **PlantUML Online Server:**
   - Copy blok kode antara `@startuml` dan `@enduml` ke [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/).
3. **Automated CI/CD Pipeline:**
   - Gunakan CLI `plantuml.jar` atau Docker image `plantuml/plantuml-server` untuk menghasilkan format `.png`, `.svg`, atau `.pdf` dalam dokumentasi teknis kantor.

---
*Dokumentasi ini dibuat secara resmi untuk sistem Finance Invoice Logger & Archiving System (Finance-Logger).*
