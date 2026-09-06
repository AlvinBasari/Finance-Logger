import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invoiceApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { PDFDocument } from 'pdf-lib';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { ScannerModal } from '../components/ui/ScannerModal';
import { PdfViewer } from '../components/ui/PdfViewer';
import { formatDateTime } from '../utils/formatters';
import {
  ScanLine,
  Printer,
  Plus,
  CheckCircle2,
  FileUp,
  Trash2,
  ArrowRight,
  ArrowLeft,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
  Settings,
  X,
  Layers,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';

export const Stage4Scanning = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceIdParam = searchParams.get('id');
  const { addToast, scannerStatus } = useAppStore();

  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Scanning Session State
  const [sessionId, setSessionId] = useState(Date.now().toString());
  const [scannedPages, setScannedPages] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [mergedPdf, setMergedPdf] = useState(null);

  // Soft File Smart Insertion State
  const [hasSoftFile, setHasSoftFile] = useState(false);
  const [softFileAttachment, setSoftFileAttachment] = useState(null);
  const [workingPdfBytes, setWorkingPdfBytes] = useState(null);
  const [pagesStructure, setPagesStructure] = useState([]);
  const [insertMode, setInsertMode] = useState('end'); // 'end', 'start', 'after', 'before'
  const [targetPageNum, setTargetPageNum] = useState(1);
  const [isFinalizingSoftFile, setIsFinalizingSoftFile] = useState(false);

  // Page Previews & Deletions
  const [previewMergedPdf, setPreviewMergedPdf] = useState(false);
  const [deletePageConfirm, setDeletePageConfirm] = useState(null); // { pageNumber, index }
  const [showExtraScanConfirm, setShowExtraScanConfirm] = useState(false);

  // Fallback Manual File Upload
  const [manualFile, setManualFile] = useState(null);

  const loadPendingInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await invoiceApi.getAll({ status: 'data_inputted', per_page: 25 });
      const list = res.data?.data?.data || [];
      setInvoices(list);

      if (invoiceIdParam) {
        const found = list.find((i) => i.id === parseInt(invoiceIdParam));
        if (found) {
          selectInvoice(found);
        } else {
          const single = await invoiceApi.getById(invoiceIdParam);
          if (single.data?.data) {
            selectInvoice(single.data.data);
          }
        }
      } else if (list.length > 0) {
        selectInvoice(list[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectInvoice = async (inv) => {
    setSelectedInvoice(inv);
    setSessionId(Date.now().toString());
    setScannedPages([]);
    setMergedPdf(null);
    setManualFile(null);
    setWorkingPdfBytes(null);
    setPagesStructure([]);

    // Check if invoice has vendor softfile
    const softAttach = inv?.attachments?.find((a) => a.source === 'vendor_softfile') || null;
    const softUrl = inv?.soft_file_url || softAttach?.url;

    if (softUrl) {
      setHasSoftFile(true);
      setSoftFileAttachment(softAttach);
      await loadSoftFileBytes(softUrl, inv);
    } else {
      setHasSoftFile(false);
      setSoftFileAttachment(null);
    }
  };

  const loadSoftFileBytes = async (url, inv) => {
    try {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setWorkingPdfBytes(bytes);

      const doc = await PDFDocument.load(bytes);
      const pageCount = doc.getPageCount();

      const initialPages = Array.from({ length: pageCount }, (_, idx) => ({
        id: `soft-${idx + 1}`,
        pageNumber: idx + 1,
        source: 'vendor_softfile',
        label: `Halaman ${idx + 1} (Soft File Vendor)`,
        isInserted: false,
      }));
      setPagesStructure(initialPages);

      // Prepare preview
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = window.btoa(binary);

      setMergedPdf({
        fileName: `invoice_${inv.tracking_code}_softfile.pdf`,
        pageCount,
        sizeKb: Math.round(bytes.length / 1024),
        base64: `data:application/pdf;base64,${base64}`,
      });
    } catch (err) {
      console.error('Gagal membaca PDF vendor:', err);
      addToast('Gagal memuat soft file vendor ke memori: ' + err.message, 'warning');
    }
  };

  useEffect(() => {
    loadPendingInvoices();
  }, [invoiceIdParam]);

  const maxPhysicalPages = selectedInvoice?.document_count || 1;
  const isTargetPagesReached = scannedPages.length >= maxPhysicalPages;

  // Direct finalize softfile without physical scanning
  const handleFinalizeSoftFileDirect = async () => {
    if (!selectedInvoice) return;
    setIsFinalizingSoftFile(true);
    try {
      await invoiceApi.finalizeSoftfile(selectedInvoice.id);
      addToast('Soft file vendor disetujui sebagai dokumen final!', 'success');
      navigate(`/stage-5?id=${selectedInvoice.id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal finalisasi soft file', 'error');
    } finally {
      setIsFinalizingSoftFile(false);
    }
  };

  // Execute scan: either appending regular page OR smart-inserting into vendor PDF
  const executeScan = async () => {
    if (!selectedInvoice) return;

    setIsScanning(true);
    try {
      let scanResult = null;

      if (window.scannerAPI?.scanPage) {
        const nextPageNum = hasSoftFile ? pagesStructure.length + 1 : scannedPages.length + 1;
        const res = await window.scannerAPI.scanPage(sessionId, nextPageNum);
        if (res.success) {
          scanResult = res;
        } else {
          addToast(res.error || 'Gagal memindai halaman', 'error');
          setIsScanning(false);
          return;
        }
      } else {
        // Fallback for virtual simulator in browser
        const nextPageNum = hasSoftFile ? pagesStructure.length + 1 : scannedPages.length + 1;
        scanResult = {
          pageNumber: nextPageNum,
          sizeKb: 185,
          filePath: `virtual_scan_page_${nextPageNum}.pdf`,
          base64:
            'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iagoyIDAgb2JqPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmo8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCA1OTUgODQyXT4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTE4IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTcwCiUlRU9G',
        };
      }

      if (hasSoftFile && workingPdfBytes) {
        // Smart Insert into Vendor PDF
        await insertPageIntoVendorPdf(scanResult);
      } else {
        // Normal append to scannedPages list
        setScannedPages((prev) => [...prev, scanResult]);
        setMergedPdf(null);
        addToast(`Halaman ${scannedPages.length + 1} berhasil dipindai dari Flatbed`, 'success');
      }
    } catch (e) {
      addToast('Kesalahan saat memindai: ' + e.message, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Insert scanned page into existing vendor PDF at chosen position
  const insertPageIntoVendorPdf = async (scanResult) => {
    try {
      const cleanB64 = scanResult.base64.includes(',') ? scanResult.base64.split(',')[1] : scanResult.base64;
      const binary = window.atob(cleanB64);
      const scanBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        scanBytes[i] = binary.charCodeAt(i);
      }

      // Load documents in pdf-lib
      const currentDoc = await PDFDocument.load(workingPdfBytes);
      const scanDoc = await PDFDocument.load(scanBytes);
      const [copiedPage] = await currentDoc.copyPages(scanDoc, [0]);

      // Calculate target index
      let targetIndex = currentDoc.getPageCount(); // default 'end'
      if (insertMode === 'start') {
        targetIndex = 0;
      } else if (insertMode === 'after') {
        targetIndex = Math.min(targetPageNum, currentDoc.getPageCount());
      } else if (insertMode === 'before') {
        targetIndex = Math.max(0, targetPageNum - 1);
      }

      currentDoc.insertPage(targetIndex, copiedPage);
      const updatedBytes = await currentDoc.save();
      setWorkingPdfBytes(updatedBytes);

      // Update pages structure list
      const newPageItem = {
        id: `scan-${Date.now()}`,
        source: 'scanner_flatbed',
        label: `Lembar Fisik Sisipan (Scan Flatbed)`,
        isInserted: true,
        insertedAt: new Date().toLocaleTimeString(),
      };

      const updatedStructure = [...pagesStructure];
      updatedStructure.splice(targetIndex, 0, newPageItem);
      const reindexed = updatedStructure.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      setPagesStructure(reindexed);

      // Re-generate preview PDF
      let bin = '';
      const len = updatedBytes.byteLength;
      for (let i = 0; i < len; i++) {
        bin += String.fromCharCode(updatedBytes[i]);
      }
      const b64 = window.btoa(bin);

      setMergedPdf({
        fileName: `invoice_${selectedInvoice.tracking_code}_merged.pdf`,
        pageCount: currentDoc.getPageCount(),
        sizeKb: Math.round(updatedBytes.length / 1024),
        base64: `data:application/pdf;base64,${b64}`,
      });

      addToast(`Halaman fisik berhasil disisipkan ke posisi Halaman ${targetIndex + 1}!`, 'success');
    } catch (e) {
      console.error('Error inserting page:', e);
      addToast('Gagal menyisipkan halaman ke PDF: ' + e.message, 'error');
    }
  };

  // Merge Scanned Pages into Final PDF (for invoices without softfile)
  const handleMergePdf = async () => {
    if (scannedPages.length === 0) return;

    setIsMerging(true);
    try {
      const cleanInvNum = (selectedInvoice.invoice_number || selectedInvoice.tracking_code).replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );
      const targetFileName = `invoice_${cleanInvNum}.pdf`;

      if (window.scannerAPI?.mergePages) {
        const res = await window.scannerAPI.mergePages(
          sessionId,
          scannedPages.length,
          targetFileName,
          scannedPages.map((p) => p.pageNumber)
        );
        if (res.success) {
          setMergedPdf(res);
          addToast(`Berhasil menggabungkan ${scannedPages.length} halaman menjadi 1 PDF`, 'success');
        } else {
          addToast(res.error || 'Gagal menggabungkan PDF', 'error');
        }
      } else {
        const mergedDoc = await PDFDocument.create();
        for (const p of scannedPages) {
          if (p.base64) {
            const base64Data = p.base64.split(',')[1] || p.base64;
            const pdfBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
            const subDoc = await PDFDocument.load(pdfBytes);
            const copied = await mergedDoc.copyPages(subDoc, subDoc.getPageIndices());
            copied.forEach((page) => mergedDoc.addPage(page));
          }
        }
        const mergedBytes = await mergedDoc.save();
        let binary = '';
        const len = mergedBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(mergedBytes[i]);
        }
        const base64Merged = window.btoa(binary);
        setMergedPdf({
          fileName: targetFileName,
          sizeKb: Math.round(mergedBytes.length / 1024),
          pageCount: mergedDoc.getPageCount(),
          base64: `data:application/pdf;base64,${base64Merged}`,
        });
        addToast(`PDF gabungan (${mergedDoc.getPageCount()} halaman) siap diunggah`, 'success');
      }
    } catch (e) {
      addToast('Gagal merge PDF: ' + e.message, 'error');
    } finally {
      setIsMerging(false);
    }
  };

  const [showUploadConfirm, setShowUploadConfirm] = useState(false);

  // Upload Merged PDF or Manual File to Laravel API
  const handleUploadScannedPdf = async () => {
    if (!selectedInvoice) return;

    setShowUploadConfirm(false);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('invoice_id', selectedInvoice.id);

      if (hasSoftFile && workingPdfBytes) {
        // Upload the modified vendor PDF with inserted pages
        const blob = new Blob([workingPdfBytes], { type: 'application/pdf' });
        const file = new File([blob], `invoice_${selectedInvoice.tracking_code}_merged.pdf`, {
          type: 'application/pdf',
        });
        formData.append('file', file);
        formData.append('source', 'merged_softfile');
        formData.append('page_count', pagesStructure.length);
      } else if (manualFile) {
        formData.append('file', manualFile);
        formData.append('source', 'manual_upload');
        formData.append('page_count', 1);
      } else if (mergedPdf) {
        const fetchRes = await fetch(mergedPdf.base64);
        const blob = await fetchRes.blob();
        const file = new File([blob], mergedPdf.fileName || 'scanned_invoice.pdf', { type: 'application/pdf' });
        formData.append('file', file);
        formData.append('source', 'scanner_flatbed');
        formData.append('page_count', mergedPdf.pageCount || scannedPages.length);
      } else {
        addToast('Belum ada berkas untuk diunggah', 'error');
        setIsUploading(false);
        return;
      }

      await invoiceApi.uploadScan(formData);
      addToast('Berkas scan digital berhasil disimpan!', 'success');

      if (window.scannerAPI?.cleanSession) {
        window.scannerAPI.cleanSession(sessionId);
      }

      // Direct to Stage 5 (Reconciliation)
      navigate(`/stage-5?id=${selectedInvoice.id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengunggah berkas scan', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-bold">TAHAP 4</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Digitalisasi & Penyisipan Scan</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gunakan soft file vendor langsung, atau sisipkan lembar scan fisik flatbed ke PDF vendor pada posisi yang diinginkan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Pending Queue (3 cols) */}
        <div className="lg:col-span-3">
          <Card
            title="Antrean Digitalisasi"
            subtitle="Pilih dokumen yang akan diproses"
          >
            {invoices.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 stroke-[1.5] mb-2" />
                Semua dokumen data inputted telah diproses.
              </div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {invoices.map((inv) => {
                  const invHasSoft = inv.soft_file_url || inv.attachments?.some((a) => a.source === 'vendor_softfile');
                  return (
                    <div
                      key={inv.id}
                      onClick={() => selectInvoice(inv)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                        selectedInvoice?.id === inv.id
                          ? 'border-slate-900 bg-slate-50 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50/50 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900">{inv.tracking_code}</span>
                        <Badge status={inv.status} />
                      </div>
                      <p className="font-medium text-slate-800 truncate">{inv.vendor_name}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>{inv.document_count} Lembar Fisik</span>
                        {invHasSoft ? (
                          <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                            <FileText className="w-3 h-3" /> Ada Softfile
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Wajib Scan</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Workspace (9 cols) */}
        <div className="lg:col-span-9">
          {selectedInvoice ? (
            <div className="space-y-4">
              {/* Hardware Diagnostic Ribbon */}
              <div
                className={`p-3 rounded-lg flex items-center justify-between text-xs border ${
                  scannerStatus.ready
                    ? scannerStatus.mode === 'virtual'
                      ? 'bg-amber-900/90 text-amber-100 border-amber-800'
                      : 'bg-slate-900 text-slate-200 border-slate-800'
                    : 'bg-rose-950/90 text-rose-100 border-rose-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded ${
                      scannerStatus.ready
                        ? scannerStatus.mode === 'virtual'
                          ? 'bg-amber-800 text-amber-200'
                          : 'bg-slate-800 text-indigo-400'
                        : 'bg-rose-900 text-rose-300'
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {scannerStatus.ready
                          ? scannerStatus.mode === 'virtual'
                            ? 'HP DeskJet 2132 (Virtual Simulator)'
                            : scannerStatus.device || 'HP DeskJet 2132 Flatbed'
                          : 'Scanner Offline'}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/40">
                        {scannerStatus.ready ? (scannerStatus.mode === 'virtual' ? 'SIMULATOR' : 'WIA READY') : 'OFFLINE'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={scannerStatus.ready ? 'secondary' : 'primary'}
                  icon={Settings}
                  onClick={() => setShowScannerModal(true)}
                >
                  Diagnostik
                </Button>
              </div>

              {/* CASE 1: INVOICE HAS SOFT FILE VENDOR */}
              {hasSoftFile ? (
                <div className="space-y-4">
                  {/* Soft File Action Banner */}
                  <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl border border-indigo-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-600/80 border border-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">Soft File Vendor Tersedia</h3>
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded font-semibold">
                            {pagesStructure.length} Halaman Terdeteksi
                          </span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-0.5">
                          Jika soft file sudah lengkap, Anda dapat langsung menggunakannya tanpa scan. Jika ada lembar kurang, sisipkan scan di bawah.
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="success"
                      size="md"
                      icon={CheckCircle2}
                      onClick={handleFinalizeSoftFileDirect}
                      isLoading={isFinalizingSoftFile}
                      className="shrink-0 font-bold shadow-md"
                    >
                      Gunakan Soft File Vendor Langsung
                    </Button>
                  </div>

                  {/* Smart Page Inserter Control Panel */}
                  <Card
                    title="Sisipkan Lembar Fisik ke PDF Vendor"
                    subtitle="Scan lembar dokumen fisik yang belum ada di soft file vendor dan sisipkan di posisi tertentu"
                  >
                    <div className="space-y-4">
                      {/* Insertion Position Options */}
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                          Pilih Posisi Sisipan Halaman Scan:
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                          <label
                            className={`p-2.5 rounded-md border cursor-pointer flex items-center gap-2 transition ${
                              insertMode === 'end'
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="insert_mode"
                              value="end"
                              checked={insertMode === 'end'}
                              onChange={() => setInsertMode('end')}
                              className="accent-indigo-600"
                            />
                            <span>Di Akhir Dokumen (Hal {pagesStructure.length + 1})</span>
                          </label>

                          <label
                            className={`p-2.5 rounded-md border cursor-pointer flex items-center gap-2 transition ${
                              insertMode === 'start'
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="insert_mode"
                              value="start"
                              checked={insertMode === 'start'}
                              onChange={() => setInsertMode('start')}
                              className="accent-indigo-600"
                            />
                            <span>Di Awal (Sebelum Hal 1)</span>
                          </label>

                          <label
                            className={`p-2.5 rounded-md border cursor-pointer flex items-center gap-2 transition ${
                              insertMode === 'after'
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="insert_mode"
                              value="after"
                              checked={insertMode === 'after'}
                              onChange={() => setInsertMode('after')}
                              className="accent-indigo-600"
                            />
                            <span>Setelah Halaman ke...</span>
                          </label>

                          <label
                            className={`p-2.5 rounded-md border cursor-pointer flex items-center gap-2 transition ${
                              insertMode === 'before'
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="insert_mode"
                              value="before"
                              checked={insertMode === 'before'}
                              onChange={() => setInsertMode('before')}
                              className="accent-indigo-600"
                            />
                            <span>Sebelum Halaman ke...</span>
                          </label>
                        </div>

                        {(insertMode === 'after' || insertMode === 'before') && (
                          <div className="flex items-center gap-2 text-xs pt-1">
                            <span className="text-slate-600 font-medium">Tentukan Nomor Halaman Target:</span>
                            <select
                              value={targetPageNum}
                              onChange={(e) => setTargetPageNum(parseInt(e.target.value))}
                              className="px-3 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                            >
                              {pagesStructure.map((p) => (
                                <option key={p.id} value={p.pageNumber}>
                                  Halaman {p.pageNumber} ({p.isInserted ? 'Sisipan' : 'Soft File'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Trigger Scan and Insert Button */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-xs text-slate-500">
                          Letakkan lembar dokumen yang kurang pada kaca flatbed, lalu klik tombol di kanan:
                        </div>

                        <Button
                          variant="primary"
                          icon={ScanLine}
                          onClick={executeScan}
                          isLoading={isScanning}
                        >
                          Pindai Lembar Fisik & Sisipkan ke PDF
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Structure & Realtime Preview Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Pages list (5 cols) */}
                    <div className="lg:col-span-5">
                      <Card
                        title={`Struktur Berkas (${pagesStructure.length} Halaman)`}
                        subtitle="Urutan halaman PDF gabungan saat ini"
                      >
                        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                          {pagesStructure.map((p, idx) => (
                            <div
                              key={p.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                p.isInserted
                                  ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-medium'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-mono font-bold flex items-center justify-center text-[10px]">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-semibold text-[11px] leading-tight">{p.label}</p>
                                  <span className="text-[9px] text-slate-400">
                                    {p.isInserted ? `Disisipkan ${p.insertedAt || ''}` : 'Asli Vendor'}
                                  </span>
                                </div>
                              </div>

                              {p.isInserted && (
                                <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[9px] font-bold">
                                  SISIPAN
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {/* Right: Realtime PDF Viewer (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col">
                      <Card
                        title="Pratinjau Hasil PDF Gabungan"
                        subtitle="Pratinjau dokumen sebelum disimpan ke server"
                        action={
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            onClick={() => setShowUploadConfirm(true)}
                            isLoading={isUploading}
                          >
                            Simpan & Unggah Dokumen Gabungan
                          </Button>
                        }
                      >
                        <div className="h-[380px] rounded-lg overflow-hidden border border-slate-700">
                          {mergedPdf ? (
                            <PdfViewer
                              fileUrl={mergedPdf.base64}
                              fileName={mergedPdf.fileName || 'merged_document.pdf'}
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center bg-slate-800 text-slate-400 text-xs">
                              Memuat pratinjau dokumen...
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE 2: NO SOFT FILE -> MANDATORY FLATBED SCANNING */
                <Card
                  title={`Pemindaian Fisik Wajib: ${selectedInvoice.tracking_code}`}
                  subtitle={`Vendor: ${selectedInvoice.vendor_name} • Wajib Pindai ${maxPhysicalPages} Lembar`}
                  action={<Badge status={selectedInvoice.status} />}
                >
                  <div className="space-y-6">
                    {/* Mandatory Scanning Warning Alert */}
                    <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-900">Wajib Pemindaian Fisik (Tanpa Soft File)</h4>
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          Dokumen ini tidak memiliki soft file vendor. Seluruh <b>{maxPhysicalPages} lembar</b> berkas fisik wajib dipindai melalui Flatbed Scanner HP DeskJet 2132 sebelum dapat direkonsiliasi.
                        </p>
                      </div>
                    </div>

                    {/* Scanned Pages Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Halaman Terpindai: {scannedPages.length} dari {maxPhysicalPages} Lembar Fisik
                          </h4>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {Math.round((scannedPages.length / maxPhysicalPages) * 100)}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-4 border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isTargetPagesReached ? 'bg-emerald-500' : 'bg-corporate-900'
                          }`}
                          style={{
                            width: `${Math.min((scannedPages.length / maxPhysicalPages) * 100, 100)}%`,
                          }}
                        />
                      </div>

                      {/* Pages Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {scannedPages.map((page, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition flex flex-col justify-between"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-bold font-mono text-xs">Hal {page.pageNumber}</span>
                              <span className="text-[10px] text-slate-400">{page.sizeKb} KB</span>
                            </div>
                            <div className="h-24 bg-slate-50 rounded border border-slate-100 flex items-center justify-center text-slate-400">
                              <FileText className="w-8 h-8 stroke-[1.5]" />
                            </div>
                          </div>
                        ))}

                        {/* Scan Next Page Button Card */}
                        <div
                          onClick={executeScan}
                          className="p-4 rounded-lg border-2 border-dashed border-slate-300 hover:border-corporate-900 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-[140px]"
                        >
                          <Plus className="w-6 h-6 text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">
                            {scannedPages.length === 0 ? 'Pindai Hal 1' : 'Pindai Hal Berikutnya'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Merge and Upload Section */}
                    {scannedPages.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setScannedPages([]);
                            setMergedPdf(null);
                          }}
                        >
                          Reset Sesi
                        </Button>

                        <div className="flex items-center gap-2">
                          {!mergedPdf && (
                            <Button
                              variant="secondary"
                              icon={Layers}
                              onClick={handleMergePdf}
                              isLoading={isMerging}
                            >
                              Gabungkan Halaman (Merge PDF)
                            </Button>
                          )}

                          {mergedPdf && (
                            <Button
                              variant="primary"
                              icon={Check}
                              onClick={() => setShowUploadConfirm(true)}
                              isLoading={isUploading}
                            >
                              Unggah Berkas Scan ({mergedPdf.pageCount} Hal)
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <div className="py-16 text-center text-slate-400 text-xs">
                <ScanLine className="w-12 h-12 mx-auto stroke-[1.5] mb-2 text-slate-300" />
                Pilih invoice dari antrean sebelah kiri untuk memulai pemindaian atau penyisipan halaman.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Upload */}
      <ConfirmModal
        isOpen={showUploadConfirm}
        onClose={() => setShowUploadConfirm(false)}
        onConfirm={handleUploadScannedPdf}
        title="Konfirmasi Unggah Berkas Digital"
        message={
          <div>
            <p className="mb-2">
              Apakah Anda yakin ingin menyimpan dan mengunggah berkas digital untuk{' '}
              <b>{selectedInvoice?.tracking_code}</b> ({selectedInvoice?.vendor_name})?
            </p>
            <p className="text-[11px] text-slate-500">
              Dokumen akan diteruskan ke Tahap 5 (Rekonsiliasi Kesesuaian Data).
            </p>
          </div>
        }
        confirmText="Ya, Unggah & Lanjutkan"
        cancelText="Batal"
        variant="primary"
        isLoading={isUploading}
      />

      {/* Scanner Diagnostic Modal */}
      <ScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />
    </div>
  );
};
