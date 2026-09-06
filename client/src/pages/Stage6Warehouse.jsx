import React, { useState, useEffect } from 'react';
import { boxApi, invoiceApi } from '../services/api';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { PrintModal } from '../components/ui/PrintModal';
import { PdfViewer } from '../components/ui/PdfViewer';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import {
  Archive,
  Plus,
  Lock,
  Warehouse,
  Printer,
  FileText,
  ScanBarcode,
  Trash2,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  Eye,
  X,
} from 'lucide-react';

export const Stage6Warehouse = () => {
  const { addToast } = useAppStore();

  const [boxes, setBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter State for Boxes
  const [boxSearch, setBoxSearch] = useState('');
  const [boxStatusFilter, setBoxStatusFilter] = useState('all'); // 'all', 'open', 'sealed', 'stored'

  // Search for invoices in the current box
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Barcode / Tracking input for adding invoice to box
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isAddingInvoice, setIsAddingInvoice] = useState(false);

  // Available reconciled invoices ready for boxing
  const [reconciledInvoices, setReconciledInvoices] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoxDesc, setNewBoxDesc] = useState('');
  const [isCreatingBox, setIsCreatingBox] = useState(false);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [rackLocationInput, setRackLocationInput] = useState('Rak A-01 / Baris 1');
  const [isReceiving, setIsReceiving] = useState(false);

  const [printModalData, setPrintModalData] = useState({ isOpen: false, type: 'box_label', data: null });

  // Preview Soft File / Digital Doc Modal
  const [previewDocModal, setPreviewDocModal] = useState({
    isOpen: false,
    url: null,
    title: '',
  });

  const loadBoxes = async () => {
    setIsLoading(true);
    try {
      const params = { per_page: 100 };
      if (boxStatusFilter !== 'all') params.status = boxStatusFilter;
      if (boxSearch.trim()) params.search = boxSearch.trim();

      const res = await boxApi.getAll(params);
      const list = res.data?.data?.data || [];
      setBoxes(list);

      if (list.length > 0) {
        if (!selectedBox) {
          loadBoxDetail(list[0].id);
        } else {
          // If current selected box still in list, refresh it
          const currentStillExists = list.find((b) => b.id === selectedBox.id);
          if (currentStillExists) {
            loadBoxDetail(selectedBox.id);
          } else {
            loadBoxDetail(list[0].id);
          }
        }
      } else {
        setSelectedBox(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBoxDetail = async (id) => {
    try {
      const res = await boxApi.getById(id);
      setSelectedBox(res.data?.data || null);
    } catch (e) {
      console.error(e);
    }
  };

  const loadReconciledInvoices = async () => {
    try {
      const res = await invoiceApi.getAll({ status: 'reconciled', per_page: 50 });
      setReconciledInvoices(res.data?.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBoxes();
  }, [boxSearch, boxStatusFilter]);

  useEffect(() => {
    loadReconciledInvoices();
  }, []);

  const handleCreateBox = async (e) => {
    e.preventDefault();
    setIsCreatingBox(true);
    try {
      const res = await boxApi.create({ description: newBoxDesc });
      addToast(res.data.message || 'Boks baru berhasil dibuat', 'success');
      setShowCreateModal(false);
      setNewBoxDesc('');
      loadBoxes();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal membuat boks', 'error');
    } finally {
      setIsCreatingBox(false);
    }
  };

  const handleAddInvoiceToBox = async (e) => {
    e?.preventDefault();
    if (!selectedBox || !barcodeInput.trim()) return;

    setIsAddingInvoice(true);
    try {
      const res = await boxApi.addInvoice(selectedBox.id, {
        tracking_code: barcodeInput.trim(),
      });
      addToast(res.data.message || 'Invoice berhasil dimasukkan ke boks', 'success');
      setBarcodeInput('');
      loadBoxDetail(selectedBox.id);
      loadReconciledInvoices();
      loadBoxes();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menambahkan invoice ke boks', 'error');
    } finally {
      setIsAddingInvoice(false);
    }
  };

  const handleAddDirect = async (inv) => {
    if (!selectedBox) return;
    setIsAddingInvoice(true);
    try {
      const res = await boxApi.addInvoice(selectedBox.id, { invoice_id: inv.id });
      addToast(res.data.message || 'Invoice berhasil dimasukkan ke boks', 'success');
      loadBoxDetail(selectedBox.id);
      loadReconciledInvoices();
      loadBoxes();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menambahkan invoice', 'error');
    } finally {
      setIsAddingInvoice(false);
    }
  };

  const [showSealConfirm, setShowSealConfirm] = useState(false);
  const [removeInvoiceConfirm, setRemoveInvoiceConfirm] = useState(null); // invoice object

  const handleRemoveInvoice = async () => {
    if (!selectedBox || !removeInvoiceConfirm) return;
    const invId = removeInvoiceConfirm.id;
    setRemoveInvoiceConfirm(null);
    try {
      await boxApi.removeInvoice(selectedBox.id, invId);
      addToast('Invoice dikeluarkan dari boks', 'info');
      loadBoxDetail(selectedBox.id);
      loadReconciledInvoices();
      loadBoxes();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengeluarkan invoice', 'error');
    }
  };

  const handleSealBox = async () => {
    if (!selectedBox) return;
    setShowSealConfirm(false);
    try {
      const res = await boxApi.seal(selectedBox.id);
      addToast(res.data.message || 'Boks berhasil disegel!', 'success');
      loadBoxDetail(selectedBox.id);
      loadBoxes();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyegel boks', 'error');
    }
  };

  const handleReceiveWarehouse = async (e) => {
    e.preventDefault();
    if (!selectedBox) return;

    setIsReceiving(true);
    try {
      const res = await boxApi.receive(selectedBox.id, { rack_location: rackLocationInput });
      addToast(res.data.message || 'Boks berhasil diterima di warehouse', 'success');
      setShowReceiveModal(false);
      loadBoxDetail(selectedBox.id);
      loadBoxes();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal konfirmasi penerimaan gudang', 'error');
    } finally {
      setIsReceiving(false);
    }
  };

  // Filter invoices inside current box by search input
  const filteredInvoicesInBox = (selectedBox?.invoices || []).filter((inv) => {
    if (!invoiceSearch.trim()) return true;
    const q = invoiceSearch.toLowerCase();
    return (
      inv.tracking_code?.toLowerCase().includes(q) ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.vendor_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-teal-700 text-white rounded text-[10px] font-bold">TAHAP 6</span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pengarsipan Boks & Warehouse Tracking</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencarian boks arsip, tautan soft file invoice, cetak label QR/Surat Jalan, dan pencatatan lokasi rak gudang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadBoxes}>
            Perbarui
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowCreateModal(true)}>
            + Buat Boks Baru
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Boxes List with Search & Filter (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card
            title="Daftar Boks Arsip"
            subtitle={`${boxes.length} Boks Tersedia`}
          >
            {/* 1. Search Bar */}
            <div className="mb-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari no boks, rak, keterangan, atau no invoice..."
                  value={boxSearch}
                  onChange={(e) => setBoxSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
                />
                {boxSearch && (
                  <button
                    type="button"
                    onClick={() => setBoxSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Status Filter Tabs */}
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'open', label: 'Open' },
                { id: 'sealed', label: 'Sealed' },
                { id: 'stored', label: 'Stored' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setBoxStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer shrink-0 ${
                    boxStatusFilter === f.id
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 3. Boxes Items List */}
            {boxes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Package className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
                Tidak ada boks yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {boxes.map((box) => (
                  <div
                    key={box.id}
                    onClick={() => loadBoxDetail(box.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                      selectedBox?.id === box.id
                        ? 'border-slate-900 bg-slate-50 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50/50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-slate-900">{box.box_number}</span>
                      <Badge status={box.status} type="box" />
                    </div>
                    <p className="text-slate-600 line-clamp-1 text-[11px]">{box.description || 'Tanpa keterangan'}</p>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{box.invoices_count || 0} Dokumen Dikemas</span>
                      <span>{box.rack_location ? `📍 ${box.rack_location}` : 'Belum Ada Rak'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Box Detail & Invoice List with Soft File Links (8 cols) */}
        <div className="lg:col-span-8">
          {selectedBox ? (
            <div className="space-y-4">
              {/* Box Top Information Card */}
              <Card
                title={`Detail Boks: ${selectedBox.box_number}`}
                subtitle={`Dibuat oleh: ${selectedBox.creator?.name || 'Staff'} • Status: ${selectedBox.status}`}
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Printer}
                      onClick={() => setPrintModalData({ isOpen: true, type: 'box_label', data: selectedBox })}
                    >
                      Label QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={FileText}
                      onClick={() => setPrintModalData({ isOpen: true, type: 'surat_jalan', data: selectedBox })}
                    >
                      Surat Jalan
                    </Button>
                    {selectedBox.status === 'open' && (
                      <Button variant="primary" size="sm" icon={Lock} onClick={() => setShowSealConfirm(true)}>
                        Segel Boks
                      </Button>
                    )}
                    {selectedBox.status === 'sealed' && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={Warehouse}
                        onClick={() => setShowReceiveModal(true)}
                      >
                        Terima di Gudang
                      </Button>
                    )}
                  </div>
                }
              >
                {/* Meta details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Lokasi Rak</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {selectedBox.rack_location || 'Belum Ditentukan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Total Berkas Fisik</span>
                    <span className="font-semibold text-slate-900">
                      {selectedBox.invoices?.length || 0} Dokumen
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Tanggal Segel</span>
                    <span className="text-slate-800">{formatDate(selectedBox.sealed_at)}</span>
                  </div>
                </div>

                {/* Barcode Scanner / Manual Tracking Code Input (Only if Open) */}
                {selectedBox.status === 'open' && (
                  <form onSubmit={handleAddInvoiceToBox} className="mb-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Scan Barcode Tanda Terima atau ketik REC-2026..."
                          value={barcodeInput}
                          onChange={(e) => setBarcodeInput(e.target.value)}
                          isMonospace
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        icon={ScanBarcode}
                        isLoading={isAddingInvoice}
                      >
                        Masukkan ke Boks
                      </Button>
                    </div>
                  </form>
                )}

                {/* Table of Invoices inside this box with Search & Soft File Links */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Daftar Invoice di Dalam Boks ({selectedBox.invoices?.length || 0}):
                    </h4>

                    {selectedBox.invoices?.length > 3 && (
                      <div className="w-56">
                        <input
                          type="text"
                          placeholder="Cari di dalam boks ini..."
                          value={invoiceSearch}
                          onChange={(e) => setInvoiceSearch(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                    )}
                  </div>

                  {(!selectedBox.invoices || selectedBox.invoices.length === 0) ? (
                    <div className="border border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
                      Boks ini masih kosong. Scan barcode tanda terima atau pilih invoice di bawah.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2">Tracking Code</th>
                            <th className="px-3 py-2">No. Invoice</th>
                            <th className="px-3 py-2">Vendor</th>
                            <th className="px-3 py-2 text-right">Total Nilai</th>
                            <th className="px-3 py-2 text-center">Soft File / Berkas</th>
                            {selectedBox.status === 'open' && <th className="px-3 py-2 text-center w-12">Aksi</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredInvoicesInBox.map((inv) => {
                            const softAttach = inv.attachments?.find((a) => a.source === 'vendor_softfile');
                            const scanAttach = inv.attachments?.find((a) => a.source !== 'vendor_softfile');
                            const fileUrl = inv.latest_file_url || inv.soft_file_url || inv.attachments?.[0]?.url;

                            return (
                              <tr key={inv.id} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 font-mono font-bold text-slate-900">{inv.tracking_code}</td>
                                <td className="px-3 py-2 font-mono">{inv.invoice_number || '-'}</td>
                                <td className="px-3 py-2">{inv.vendor_name}</td>
                                <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                                  {formatCurrency(inv.total_amount, inv.currency)}
                                </td>

                                {/* Soft File / Digital Doc Link */}
                                <td className="px-3 py-2 text-center">
                                  {fileUrl ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPreviewDocModal({
                                          isOpen: true,
                                          url: fileUrl,
                                          title: `${inv.tracking_code} - ${inv.vendor_name}`,
                                        })
                                      }
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                                      title="Klik untuk membuka soft file / dokumen digital"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>Lihat Dokumen</span>
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Tidak ada file</span>
                                  )}
                                </td>

                                {selectedBox.status === 'open' && (
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      onClick={() => setRemoveInvoiceConfirm(inv)}
                                      className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                      title="Keluarkan dari Boks"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>

              {/* Ready Reconciled Queue Quick Adder */}
              {selectedBox.status === 'open' && reconciledInvoices.length > 0 && (
                <Card
                  title="Antrean Invoice Siap Dikemas (Status: Reconciled)"
                  subtitle="Klik '+' untuk langsung memasukkan dokumen ke boks aktif ini"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {reconciledInvoices.map((inv) => {
                      const docUrl = inv.latest_file_url || inv.soft_file_url || inv.attachments?.[0]?.url;
                      return (
                        <div
                          key={inv.id}
                          className="p-2.5 rounded border border-slate-200 bg-white flex items-center justify-between text-xs"
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono font-bold text-slate-900 block">{inv.tracking_code}</span>
                            <span className="text-[11px] text-slate-600 truncate block">{inv.vendor_name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {docUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDocModal({
                                    isOpen: true,
                                    url: docUrl,
                                    title: `${inv.tracking_code} - ${inv.vendor_name}`,
                                  })
                                }
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Lihat Soft File"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Plus}
                              onClick={() => handleAddDirect(inv)}
                            >
                              Kemas
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <div className="py-20 text-center text-slate-400 text-xs">
                <Archive className="w-12 h-12 mx-auto stroke-[1.5] mb-2 text-slate-300" />
                Pilih atau buat boks arsip untuk memulai pengemasan dokumen fisik.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Buat Boks Baru */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Buat Boks Kardus Arsip Baru"
        subtitle="Sistem akan menghasilkan nomor boks unik BOX-FIN-YYYY-XXXX"
      >
        <form onSubmit={handleCreateBox} className="space-y-4">
          <Input
            label="Keterangan / Kategori Dokumen Boks"
            placeholder="Contoh: Arsip Invoice Vendor Ekspedisi & Logistik Agustus 2026"
            value={newBoxDesc}
            onChange={(e) => setNewBoxDesc(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={Plus} isLoading={isCreatingBox}>
              Buat Boks Baru
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Konfirmasi Terima Boks di Gudang */}
      <Modal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        title="Konfirmasi Penerimaan Boks di Gudang Arsip"
        subtitle={`Nomor Boks: ${selectedBox?.box_number}`}
      >
        <form onSubmit={handleReceiveWarehouse} className="space-y-4">
          <Input
            label="Tentukan Lokasi Rak Penyimpanan"
            placeholder="Contoh: Rak A-02 / Baris 3"
            value={rackLocationInput}
            onChange={(e) => setRackLocationInput(e.target.value)}
            required
          />

          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md">
            Setelah konfirmasi penerimaan, seluruh dokumen di dalam boks ini akan berstatus <b>Archived</b> (Tersimpan
            Permanen).
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setShowReceiveModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="success" icon={Warehouse} isLoading={isReceiving}>
              Simpan & Tandai Diterima di Gudang
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Pratinjau Soft File / Dokumen Digital Invoice di Warehouse */}
      <Modal
        isOpen={previewDocModal.isOpen}
        onClose={() => setPreviewDocModal({ isOpen: false, url: null, title: '' })}
        title={`Pratinjau Berkas: ${previewDocModal.title}`}
        subtitle="Dokumen soft file vendor / hasil scan digital invoice"
        maxWidth="max-w-4xl"
      >
        <div className="h-[520px] rounded-lg overflow-hidden border border-slate-700">
          {previewDocModal.url ? (
            <PdfViewer fileUrl={previewDocModal.url} fileName={previewDocModal.title} />
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-800 text-slate-400 text-xs">
              Memuat berkas digital...
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Cetak Label Boks & Surat Jalan */}
      <PrintModal
        isOpen={printModalData.isOpen}
        onClose={() => setPrintModalData({ ...printModalData, isOpen: false })}
        type={printModalData.type}
        data={printModalData.data}
      />

      {/* Confirm: Segel Boks */}
      <ConfirmModal
        isOpen={showSealConfirm}
        onClose={() => setShowSealConfirm(false)}
        onConfirm={handleSealBox}
        title="Konfirmasi Penyegelan Boks Arsip"
        message={`Apakah Anda yakin ingin menyegel boks ${selectedBox?.box_number}? Boks yang disegel tidak dapat ditambahkan invoice baru.`}
        confirmText="Ya, Segel Boks"
        cancelText="Batal"
        variant="warning"
      />

      {/* Confirm: Hapus Invoice dari Boks */}
      <ConfirmModal
        isOpen={!!removeInvoiceConfirm}
        onClose={() => setRemoveInvoiceConfirm(null)}
        onConfirm={handleRemoveInvoice}
        title="Keluarkan Invoice dari Boks"
        message={`Apakah Anda yakin ingin mengeluarkan invoice ${removeInvoiceConfirm?.tracking_code} (${removeInvoiceConfirm?.vendor_name}) dari boks ini?`}
        confirmText="Keluarkan"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
};
