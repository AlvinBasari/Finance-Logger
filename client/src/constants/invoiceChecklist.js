/**
 * Skema Checklist Verifikasi Kelengkapan Dokumen Invoice
 * Sesuai Standar Form Check List Invoice Star Energy Geothermal
 */
export const INVOICE_CHECKLIST_SECTIONS = [
  {
    number: 1,
    title: 'INVOICE BERMATERAI',
    scope: 'all', // all | po | so
    items: [
      { key: 'invoice_bermaterai', label: 'Invoice Bermaterai' },
      { key: 'rekening_bank_invoice', label: 'Rekening Bank' },
    ],
  },
  {
    number: 2,
    title: 'FAKTUR PAJAK DENGAN BARCODE / SURAT PERNYATAAN NON PKP (BERMATERAI)',
    scope: 'all',
    items: [
      {
        key: 'faktur_pajak_barcode_non_pkp',
        label: 'Faktur Pajak dengan Barcode / Surat Pernyataan Non PKP (Bermaterai)',
      },
    ],
  },
  {
    number: 3,
    title: 'ACCEPTANCE LETTER',
    scope: 'so',
    badge: 'Khusus Service Order',
    items: [
      { key: 'service_entry_ml84', label: 'Service Entry_ML84' },
      {
        key: 'bast_work_completion_timesheet',
        label: 'BAST / Work Completion / Timesheet / Dokumen Pendukung Sejenis',
      },
    ],
  },
  {
    number: 4,
    title: 'DELIVERY ORDER',
    scope: 'po',
    badge: 'Khusus Purchase Order',
    items: [{ key: 'delivery_order', label: 'Delivery Order (DO)' }],
  },
  {
    number: 5,
    title: 'PURCHASE ORDER / RELEASE ORDER / FIELD INSTRUCTION',
    scope: 'po',
    badge: 'Khusus Purchase Order',
    items: [
      {
        key: 'purchase_order_release_order',
        label: 'Purchase Order / Release Order / Field Instruction',
      },
      { key: 'po_exhibit_b', label: 'PO Exhibit B' },
    ],
  },
  {
    number: 6,
    title: 'FOTOKOPI KONTRAK',
    scope: 'so',
    badge: 'Khusus Service Order',
    items: [
      { key: 'kontrak_cover_depan', label: 'Cover Depan' },
      { key: 'kontrak_halaman_ttd', label: 'Halaman Tanda Tangan' },
      { key: 'kontrak_rekening_bank', label: 'Rekening Bank' },
      { key: 'kontrak_masa_berlaku', label: 'Masa Berlaku' },
      { key: 'kontrak_exhibit_harga', label: 'Exhibit Harga' },
    ],
  },
  {
    number: 7,
    title: 'DOKUMEN PENDUKUNG',
    scope: 'all',
    items: [
      {
        key: 'skb_pph_23',
        label: 'Fotokopi SKB (Surat Keterangan Bebas) Pajak Penghasilan Pasal 23',
        isOptional: true,
      },
      {
        key: 'suket_pph_pp23',
        label: 'Fotokopi Surat Keterangan Dikenai PPh Berdasarkan PP 23 Tahun 2018',
        isOptional: true,
      },
      {
        key: 'sertifikat_lpjk',
        label: 'Fotokopi Sertifikat LPJK (Lembaga Pengembangan Jasa Konstruksi) Beserta Perpanjangannya',
        isOptional: true,
      },
      {
        key: 'form_dgt1_eskd',
        label: 'Fotokopi Form DGT-1 atau E-SKD (Untuk Wajib Pajak Luar Negeri)',
        isOptional: true,
      },
      {
        key: 'npwp_skt_terbaru',
        label: 'Fotokopi NPWP / Surat Keterangan Terdaftar Terbaru',
      },
      { key: 'sertifikat_pkp', label: 'Fotokopi Sertifikat PKP' },
      { key: 'enofa_faktur_pajak', label: 'Fotokopi E-NOFA Faktur Pajak' },
      {
        key: 'spt_ppn_masa_sebelumnya',
        label: 'Fotokopi SPT PPN Masa Sebelumnya (Induk dan Formulir 1111 A2)',
      },
    ],
  },
];

// Helper to get initial state
export const getInitialChecklistState = () => {
  const state = {};
  INVOICE_CHECKLIST_SECTIONS.forEach((sec) => {
    sec.items.forEach((item) => {
      state[item.key] = false;
    });
  });
  return state;
};
