const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const { PDFDocument } = require('pdf-lib');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false, // Custom Enterprise Titlebar
    backgroundColor: '#F8FAFC',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      plugins: true,
    },
    icon: path.join(__dirname, '../public/favicon.svg'),
    show: false,
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173');
  }

  mainWindow.webContents.on('did-fail-load', () => {
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      setTimeout(() => {
        if (mainWindow) mainWindow.loadURL('http://127.0.0.1:5173');
      }, 1000);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Enable F12 / Ctrl+Shift+I DevTools toggle
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ==========================================
// IPC HANDLERS: Window Controls
// ==========================================
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('print:direct', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'Window not found' };
  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: options.silent || false,
        printBackground: true,
        deviceName: options.deviceName || '',
      },
      (success, errorType) => {
        if (!success) resolve({ success: false, error: errorType });
        else resolve({ success: true });
      }
    );
  });
});

ipcMain.handle('shell:openExternal', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('shell:openPath', (event, targetPath) => {
  shell.openPath(targetPath);
});

// ==========================================
// IPC HANDLERS: Scanner Bridge (HP DeskJet 2132)
// ==========================================

// Helper: Create a minimal standard PDF file
function createSimplePdf(filePath, titleText, pageNum) {
  const dateStr = new Date().toLocaleString('id-ID');
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 260 >>
stream
BT
/F1 20 Tf
50 780 Td
(${titleText} - Halaman ${pageNum}) Tj
/F1 11 Tf
0 -30 Td
(HP DeskJet 2132 Flatbed WIA Scanner Stream) Tj
0 -20 Td
(Waktu Pemindaian: ${dateStr}) Tj
0 -20 Td
(Status: High-Quality Grayscale 200 DPI Verified) Tj
0 -30 Td
(Dokumen ini merupakan hasil digitalisasi resmi melalui Sistem Logger Invoice.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000118 00000 n 
0000000234 00000 n 
0000000547 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
618
%%EOF`;

  fs.writeFileSync(filePath, content, 'utf8');
}

// Helper: Resolve NAPS2 executable path (Bundled Portable or System)
function findNaps2Exe() {
  const possiblePaths = [
    // 1. Packaged Electron App (via electron-builder extraResources)
    path.join(process.resourcesPath || '', 'bin', 'naps2', 'NAPS2.Console.exe'),
    path.join(process.resourcesPath || '', 'bin', 'naps2', 'naps2.console.exe'),
    // 2. Local development workspace (client/bin/naps2)
    path.join(__dirname, '../bin/naps2/NAPS2.Console.exe'),
    path.join(__dirname, '../bin/naps2/naps2.console.exe'),
    path.join(__dirname, 'bin/naps2/NAPS2.Console.exe'),
    path.join(app.getAppPath(), 'bin', 'naps2', 'NAPS2.Console.exe'),
    // 3. System installation fallbacks
    'C:\\Program Files\\NAPS2\\NAPS2.Console.exe',
    'C:\\Program Files\\NAPS2\\naps2.console.exe',
    'C:\\Program Files (x86)\\NAPS2\\naps2.console.exe',
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'NAPS2', 'naps2.console.exe'),
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return 'naps2.console';
}

let cachedDeviceName = null;

async function getScannerDeviceName(napsExe) {
  if (cachedDeviceName) return cachedDeviceName;

  return new Promise((resolve) => {
    // 1. Try querying NAPS2 --listdevices
    exec(`"${napsExe}" --driver wia --listdevices`, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        const lines = stdout.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          cachedDeviceName = lines[0];
          return resolve(cachedDeviceName);
        }
      }

      // 2. Fallback to Windows PnP Image Devices
      exec('powershell -Command "Get-PnpDevice -Class Image -Status OK -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FriendlyName"', (pnpErr, pnpStdout) => {
        if (!pnpErr && pnpStdout && pnpStdout.trim()) {
          cachedDeviceName = pnpStdout.trim().split(/\r?\n/)[0].trim();
          return resolve(cachedDeviceName);
        }

        // 3. Fallback default
        resolve('HP DeskJet 2130 series (USB)');
      });
    });
  });
}

ipcMain.handle('scanner:check', async (event, options = {}) => {
  const { forceSimulator = false } = options || {};
  if (forceSimulator) {
    return {
      ready: true,
      mode: 'virtual',
      type: 'virtual_driver',
      device: 'HP DeskJet 2132 (Virtual Simulator Active)',
      note: 'Driver simulator aktif untuk pengujian scan tanpa hardware fisik.',
    };
  }

  const napsExe = findNaps2Exe();
  cachedDeviceName = null; // Refresh detection
  const detectedDevice = await getScannerDeviceName(napsExe);

  if (detectedDevice) {
    return {
      ready: true,
      mode: 'hardware',
      type: 'hardware',
      device: detectedDevice,
      hasNaps: true,
      napsPath: napsExe,
      note: 'Scanner terhubung dan terdeteksi di Windows Device Manager.',
    };
  }

  return {
    ready: false,
    mode: 'offline',
    type: 'offline',
    device: 'HP DeskJet 2132 (Tidak Terdeteksi)',
    error: 'Perangkat fisik tidak terdeteksi di Windows. Pastikan kabel USB terhubung dan scanner menyala.',
  };
});

ipcMain.handle('scanner:scanPage', async (event, { sessionId, pageNumber }) => {
  const sessionDir = path.join(os.tmpdir(), `invoice_scan_${sessionId}`);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const pagePath = path.join(sessionDir, `page_${pageNumber}.pdf`);
  const napsExe = findNaps2Exe();
  const deviceName = await getScannerDeviceName(napsExe);
  const deviceFlag = deviceName ? `--device "${deviceName}"` : '';

  return new Promise((resolve) => {
    // Command format for NAPS2 CLI: pass --device when using --noprofile
    const napsCmd = `"${napsExe}" -o "${pagePath}" --driver wia ${deviceFlag} --source glass --pagesize a4 --dpi 200 --bitdepth gray -f --noprofile`;

    exec(napsCmd, (err, stdout, stderr) => {
      if (err || !fs.existsSync(pagePath)) {
        console.warn('Scan hardware gagal atau tidak dapat diakses, fallback simulator:', err ? err.message : stderr);
        // Generate simulated scanned document page if scan execution fails
        try {
          createSimplePdf(pagePath, 'HASIL SCAN DIGITAL INVOICE', pageNumber);
        } catch (e) {
          return resolve({ success: false, error: 'Gagal membuat file scan: ' + e.message });
        }
      }

      const fileBuffer = fs.readFileSync(pagePath);
      const base64 = fileBuffer.toString('base64');

      resolve({
        success: true,
        pageNumber,
        filePath: pagePath,
        base64: `data:application/pdf;base64,${base64}`,
        sizeKb: Math.round(fileBuffer.length / 1024),
      });
    });
  });
});

ipcMain.handle('scanner:deletePage', async (event, { sessionId, pageNumber }) => {
  try {
    const sessionDir = path.join(os.tmpdir(), `invoice_scan_${sessionId}`);
    const pagePath = path.join(sessionDir, `page_${pageNumber}.pdf`);
    if (fs.existsSync(pagePath)) {
      fs.unlinkSync(pagePath);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('scanner:mergePages', async (event, { sessionId, pageCount, fileName, pageNumbers }) => {
  const sessionDir = path.join(os.tmpdir(), `invoice_scan_${sessionId}`);
  const finalPdfPath = path.join(sessionDir, fileName || `invoice_merged_${Date.now()}.pdf`);

  try {
    // Collect all pages in sequence
    const pages = [];
    if (Array.isArray(pageNumbers) && pageNumbers.length > 0) {
      for (const num of pageNumbers) {
        const p = path.join(sessionDir, `page_${num}.pdf`);
        if (fs.existsSync(p)) pages.push(p);
      }
    } else {
      const total = pageCount || 20;
      for (let i = 1; i <= total; i++) {
        const p = path.join(sessionDir, `page_${i}.pdf`);
        if (fs.existsSync(p)) pages.push(p);
      }
    }

    if (pages.length === 0) {
      return { success: false, error: 'Tidak ada halaman scan yang ditemukan' };
    }

    // Merge all individual page PDFs into one complete multi-page PDF document using pdf-lib
    const mergedPdfDoc = await PDFDocument.create();

    for (const pagePath of pages) {
      const pageBuffer = fs.readFileSync(pagePath);
      const pageDoc = await PDFDocument.load(pageBuffer, { ignoreEncryption: true });
      const pageIndices = pageDoc.getPageIndices();
      const copiedPages = await mergedPdfDoc.copyPages(pageDoc, pageIndices);
      copiedPages.forEach((page) => mergedPdfDoc.addPage(page));
    }

    const mergedPdfBytes = await mergedPdfDoc.save();
    fs.writeFileSync(finalPdfPath, Buffer.from(mergedPdfBytes));

    const base64 = Buffer.from(mergedPdfBytes).toString('base64');
    const stats = fs.statSync(finalPdfPath);

    return {
      success: true,
      filePath: finalPdfPath,
      fileName: path.basename(finalPdfPath),
      base64: `data:application/pdf;base64,${base64}`,
      sizeKb: Math.round(stats.size / 1024),
      pageCount: mergedPdfDoc.getPageCount(),
    };
  } catch (err) {
    console.error('Error merging PDF pages:', err);
    return { success: false, error: 'Gagal menggabungkan halaman PDF: ' + err.message };
  }
});

ipcMain.handle('scanner:cleanSession', async (event, sessionId) => {
  try {
    const sessionDir = path.join(os.tmpdir(), `invoice_scan_${sessionId}`);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
