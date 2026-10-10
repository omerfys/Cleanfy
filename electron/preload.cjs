const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cleanfyApi', {
  getDesktopPath: () => ipcRenderer.invoke('desktop:getPath'),
  scanDesktop: (customPath) => ipcRenderer.invoke('desktop:scan', customPath),
  moveFile: (desktopPath, fileItem) => ipcRenderer.invoke('desktop:moveFile', desktopPath, fileItem),
  revertMoves: (desktopPath, historyItems) => ipcRenderer.invoke('desktop:revert', desktopPath, historyItems),
  openDesktop: (targetPath) => ipcRenderer.invoke('desktop:openPath', targetPath),
  applyDesktopPositions: (positionsMap) => ipcRenderer.invoke('desktop:applyPositions', positionsMap),
  
  // Şeffaf pencerede fare tıklamalarını arkadaki masaüstüne geçirme / yakalama
  setIgnoreMouse: (ignore) => ipcRenderer.invoke('window:setIgnoreMouse', ignore),
  
  // Çoklu Monitör & Ekran Seçimi API'leri
  getDisplays: () => ipcRenderer.invoke('window:getDisplays'),
  switchDisplay: (displayId) => ipcRenderer.invoke('window:switchDisplay', displayId),
  getWallpaper: () => ipcRenderer.invoke('desktop:getWallpaper'),
  onDisplaysChanged: (callback) => {
    const listener = (_, displays) => callback(displays);
    ipcRenderer.on('displays:changed', listener);
    return () => ipcRenderer.removeListener('displays:changed', listener);
  },

  // Pencere kontrolleri
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
});
