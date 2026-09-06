import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, FileText, ExternalLink } from 'lucide-react';

export const PdfViewer = ({ fileUrl, fileName = 'Dokumen Pindaian', filePath = null }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeUrl, setActiveUrl] = useState('');
  const currentBlobRef = useRef(null);

  useEffect(() => {
    if (!fileUrl) {
      setActiveUrl('');
      return;
    }

    // If it's already an HTTP URL or blob URL
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('blob:')) {
      setActiveUrl(fileUrl);
      return;
    }

    // Convert Base64 data URL to a persistent Blob URL without premature revocation
    try {
      const base64Clean = fileUrl.includes(',') ? fileUrl.split(',')[1] : fileUrl;
      const binary = window.atob(base64Clean);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const newBlobUrl = URL.createObjectURL(blob);

      // Clean previous blob reference safely
      if (currentBlobRef.current && currentBlobRef.current.startsWith('blob:')) {
        const oldUrl = currentBlobRef.current;
        setTimeout(() => {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch (_) {}
        }, 15000);
      }
      currentBlobRef.current = newBlobUrl;
      setActiveUrl(newBlobUrl);
    } catch (e) {
      console.error('Error converting PDF base64 to Blob URL:', e);
      setActiveUrl(fileUrl);
    }

    return () => {
      // Grace period before revoking blob URL so Chromium iframe has finished loading
      if (currentBlobRef.current && currentBlobRef.current.startsWith('blob:')) {
        const urlToRevoke = currentBlobRef.current;
        setTimeout(() => {
          try {
            URL.revokeObjectURL(urlToRevoke);
          } catch (_) {}
        }, 20000);
      }
    };
  }, [fileUrl]);

  const handleOpenExternal = () => {
    if (filePath && window.electronAPI?.openPath) {
      window.electronAPI.openPath(filePath);
    } else if (activeUrl) {
      window.open(activeUrl, '_blank');
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  if (!fileUrl) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-8 rounded-lg border border-slate-700">
        <FileText className="w-12 h-12 stroke-[1.5] mb-3 text-slate-500" />
        <p className="text-sm font-medium text-slate-300">Belum ada file dokumen digital</p>
        <p className="text-xs text-slate-500 mt-1 text-center max-w-xs">
          Lakukan pemindaian melalui Tahap 4 atau unggah berkas PDF/Image pendukung.
        </p>
      </div>
    );
  }

  const isImage = fileUrl.match(/\.(jpeg|jpg|png|gif|webp)($|\?)/i) || fileUrl.startsWith('data:image/');

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
      {/* Viewer Toolbar */}
      <div className="h-11 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-slate-200 text-xs shrink-0 select-none">
        <div className="flex items-center gap-2 truncate max-w-[280px]">
          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-medium truncate text-slate-200" title={fileName}>{fileName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-12 text-center">{zoom}%</span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Rotate (+90°)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium text-[11px] transition ml-2 cursor-pointer shadow-xs"
            title="Buka PDF di Aplikasi Sistem Windows"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka PDF</span>
          </button>
        </div>
      </div>

      {/* Viewer Canvas */}
      <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-slate-900/90">
        <div
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
            width: '100%',
            height: '100%',
          }}
          className="shadow-2xl rounded bg-white flex items-center justify-center min-h-[480px]"
        >
          {isImage ? (
            <img
              src={activeUrl || fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded"
            />
          ) : activeUrl ? (
            <iframe
              src={`${activeUrl}#toolbar=1&navpanes=1`}
              title={fileName}
              className="w-full h-full min-h-[500px] border-0 rounded bg-white"
            />
          ) : (
            <div className="flex items-center justify-center text-slate-500 text-xs">
              Memuat pratinjau dokumen PDF...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
