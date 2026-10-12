const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cleanfyApi', {
  getDesktopPath: () => ipcRenderer.invoke('desktop:getPath'),
  scanDesktop: (customPath) => ipcRenderer.invoke('desktop:scan', customPath),
  moveFile: (desktopPath, fileItem) => ipcRenderer.invoke('desktop:moveFile', desktopPath, fileItem),
  revertMoves: (desktopPath, historyItems) => ipcRenderer.invoke('desktop:revert', desktopPath, historyItems),
  openDesktop: (targetPath) => ipcRenderer.invoke('desktop:openPath', targetPath),
  
  // Şeffaf pencerede fare tıklamalarını arkadaki masaüstüne geçirme / yakalama
  setIgnoreMouse: (ignore) => ipcRenderer.invoke('window:setIgnoreMouse', ignore),
  
  // Pencere kontrolleri
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
});
