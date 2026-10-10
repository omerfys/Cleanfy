const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const {
  getRealDesktopPath,
  scanDesktop,
  safelyMoveFile,
  revertMoveHistory,
  applyDesktopPositions,
} = require('./desktopService.cjs');

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Tekil Örnek Kilidi: Uygulama zaten açıksa ikinciyi başlatmak yerine mevcudu anında ön plana getir
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
      try {
        app.focus({ steal: true });
      } catch (e) {}
    }
  });
}

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
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false, // Arka planda olsa dahi 60 FPS akıcı fizik
    },
    show: false,
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (isDev) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    // 1. Doğrudan en ön planda aç, odakla ve ekran koruyucu katmanına yerleştir
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    try {
      app.focus({ steal: true });
    } catch (e) {}

    // 2. Pencere Windows tarafından ön plana alınıp yerleştikten sonra masaüstü tıklama geçişini aktif et
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
      }
    }, 300);
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

// Gerçek masaüstü simgelerini seçili alanlara göre yeniden konumlandır
ipcMain.handle('desktop:applyPositions', async (_, positionsMap) => {
  return applyDesktopPositions(positionsMap);
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
