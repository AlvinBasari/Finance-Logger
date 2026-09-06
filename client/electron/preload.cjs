const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  
  // Printing
  print: (options) => ipcRenderer.invoke('print:direct', options),
  printToPDF: (options) => ipcRenderer.invoke('print:toPDF', options),

  // File and OS helpers
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  openPath: (path) => ipcRenderer.invoke('shell:openPath', path),
});

contextBridge.exposeInMainWorld('scannerAPI', {
  // Scanner Bridge (HP DeskJet 2132 Flatbed via WIA)
  checkScanner: (options) => ipcRenderer.invoke('scanner:check', options),
  scanPage: (sessionId, pageNumber) => ipcRenderer.invoke('scanner:scanPage', { sessionId, pageNumber }),
  deletePage: (sessionId, pageNumber) => ipcRenderer.invoke('scanner:deletePage', { sessionId, pageNumber }),
  mergePages: (sessionId, pageCount, fileName, pageNumbers) => ipcRenderer.invoke('scanner:mergePages', { sessionId, pageCount, fileName, pageNumbers }),
  cleanSession: (sessionId) => ipcRenderer.invoke('scanner:cleanSession', sessionId),
});
