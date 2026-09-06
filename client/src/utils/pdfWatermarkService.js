import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import axios from 'axios';

/**
 * Apply dynamic security watermark to a PDF for external document borrowing.
 * 
 * @param {string|ArrayBuffer|Uint8Array} pdfSource - URL string, ArrayBuffer, or Uint8Array of the PDF
 * @param {Object} options - Watermarking options
 * @param {string} options.organization - Name of external organization (e.g. KAP PwC, KPP Pratama)
 * @param {string} options.borrowerName - Name of PIC / borrower
 * @param {string} options.loanCode - Loan reference code (e.g. LN-202609-0001)
 * @param {string} options.purpose - Purpose of loan (e.g. Audit Laporan Keuangan 2025)
 * @param {string} [options.date] - Date formatted string
 * @param {number} [options.opacity=0.22] - Watermark opacity (0 to 1)
 * @returns {Promise<{ pdfBytes: Uint8Array, blob: Blob, blobUrl: string, download: (filename: string) => void }>}
 */
export async function applyWatermarkToPdf(pdfSource, options = {}) {
  const {
    organization = 'PIHAK LUAR',
    borrowerName = '',
    loanCode = 'LOAN-DOKUMEN',
    purpose = 'Pemeriksaan / Audit',
    date = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    opacity = 0.22,
  } = options;

  // 1. Resolve PDF source to ArrayBuffer
  let arrayBuffer;
  if (typeof pdfSource === 'string') {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(pdfSource, {
      responseType: 'arraybuffer',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    arrayBuffer = response.data;
  } else if (pdfSource instanceof ArrayBuffer) {
    arrayBuffer = pdfSource;
  } else if (pdfSource instanceof Uint8Array) {
    arrayBuffer = pdfSource.buffer;
  } else {
    throw new Error('Format sumber PDF tidak didukung.');
  }

  // 2. Load PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const mainText = `DIPINJAMKAN KEPADA: ${organization.toUpperCase()}`;
  const subText1 = `NO. PINJAM: ${loanCode} ${borrowerName ? `| PIC: ${borrowerName}` : ''}`;
  const subText2 = `KEPERLUAN: ${purpose.toUpperCase()} | TGL: ${date}`;
  const cautionText = 'SALINAN TERBATAS & RAHASIA - DILARANG MENYEBARLUASKAN TANPA IZIN';

  // 3. Iterate each page and draw watermark
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Center coordinates
    const centerX = width / 2;
    const centerY = height / 2;

    // Font sizes
    const mainFontSize = Math.min(22, Math.max(16, width / 28));
    const subFontSize = Math.min(13, Math.max(10, width / 45));
    const smallFontSize = 9;

    const mainTextWidth = helveticaBold.widthOfTextAtSize(mainText, mainFontSize);
    const subText1Width = helvetica.widthOfTextAtSize(subText1, subFontSize);
    const subText2Width = helvetica.widthOfTextAtSize(subText2, subFontSize);
    const cautionWidth = helvetica.widthOfTextAtSize(cautionText, smallFontSize);

    // Diagonal angle (approx 35 - 45 degrees)
    const angle = degrees(38);

    // Primary diagonal watermark at center
    page.drawText(mainText, {
      x: centerX - (mainTextWidth / 2) * Math.cos(38 * Math.PI / 180),
      y: centerY - (mainTextWidth / 2) * Math.sin(38 * Math.PI / 180),
      size: mainFontSize,
      font: helveticaBold,
      color: rgb(0.85, 0.15, 0.15), // Crimson red tint
      opacity: opacity,
      rotate: angle,
    });

    page.drawText(subText1, {
      x: centerX - (subText1Width / 2) * Math.cos(38 * Math.PI / 180) - 20 * Math.sin(38 * Math.PI / 180),
      y: centerY - (subText1Width / 2) * Math.sin(38 * Math.PI / 180) - 20 * Math.cos(38 * Math.PI / 180),
      size: subFontSize,
      font: helvetica,
      color: rgb(0.2, 0.25, 0.35),
      opacity: opacity + 0.05,
      rotate: angle,
    });

    page.drawText(subText2, {
      x: centerX - (subText2Width / 2) * Math.cos(38 * Math.PI / 180) - 40 * Math.sin(38 * Math.PI / 180),
      y: centerY - (subText2Width / 2) * Math.sin(38 * Math.PI / 180) - 40 * Math.cos(38 * Math.PI / 180),
      size: subFontSize,
      font: helvetica,
      color: rgb(0.2, 0.25, 0.35),
      opacity: opacity + 0.05,
      rotate: angle,
    });

    // Secondary repeated watermark for large pages (Top Left & Bottom Right)
    if (height > 500) {
      page.drawText(`PROPERTY OF FINANCE - ${loanCode}`, {
        x: 40,
        y: height - 120,
        size: 11,
        font: helveticaBold,
        color: rgb(0.5, 0.55, 0.65),
        opacity: opacity * 0.7,
        rotate: degrees(30),
      });

      page.drawText(`PINJAMAN RESMI: ${organization}`, {
        x: width - 250,
        y: 120,
        size: 11,
        font: helveticaBold,
        color: rgb(0.5, 0.55, 0.65),
        opacity: opacity * 0.7,
        rotate: degrees(30),
      });
    }

    // Top Header Security Stamp
    page.drawRectangle({
      x: 0,
      y: height - 20,
      width: width,
      height: 20,
      color: rgb(0.06, 0.09, 0.16), // #0f172a
      opacity: 0.85,
    });

    page.drawText(`[SALINAN PEMINJAMAN DOKUMEN ARSIP] DIPINJAMKAN KEPADA: ${organization.toUpperCase()} (${loanCode})`, {
      x: 15,
      y: height - 14,
      size: 8,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    // Bottom Footer Warning Stamp
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: 18,
      color: rgb(0.95, 0.96, 0.98),
      opacity: 0.9,
    });

    page.drawText(cautionText, {
      x: Math.max(10, (width - cautionWidth) / 2),
      y: 5,
      size: smallFontSize,
      font: helveticaBold,
      color: rgb(0.7, 0.1, 0.1),
    });
  }

  // 4. Save and generate Blob
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  const download = (customFileName) => {
    const defaultName = `${loanCode}_WATERMARKED_${organization.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
    const fileName = customFileName || defaultName;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    pdfBytes,
    blob,
    blobUrl,
    download,
  };
}
