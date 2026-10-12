const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const { getRealDesktopPath, scanDesktop, safelyMoveFile, revertMoveHistory } = require('./desktopService.cjs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    title: 'Cleanfy - Masaüstü Robot Süpürgesi',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  // Windows masaüstünün üzerinde kalma ve fare tıklamalarını varsayılan olarak masaüstü simgelerine iletme
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (isDev) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC İşleyicileri
ipcMain.handle('desktop:getPath', async () => {
  return getRealDesktopPath();
});

ipcMain.handle('desktop:scan', async (_, customPath) => {
  return scanDesktop(customPath);
});

ipcMain.handle('desktop:moveFile', async (_, desktopPath, fileItem) => {
  return safelyMoveFile(desktopPath, fileItem);
});

ipcMain.handle('desktop:revert', async (_, desktopPath, historyItems) => {
  return revertMoveHistory(desktopPath, historyItems);
});

ipcMain.handle('desktop:openPath', async (_, targetPath) => {
  const p = targetPath || getRealDesktopPath();
  await shell.openPath(p);
  return true;
});

// Fare tıklama geçiş kontrolü
ipcMain.handle('window:setIgnoreMouse', (_, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// Pencere kontrolleri
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
