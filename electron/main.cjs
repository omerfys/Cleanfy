const { app, BrowserWindow, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync, execFileSync } = require('child_process');
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

let cachedWinScreens = null;
let lastWinScreensTime = 0;

function getWindowsScreens() {
  const now = Date.now();
  if (cachedWinScreens && (now - lastWinScreensTime < 5000)) {
    return cachedWinScreens;
  }
  try {
    const psCmd = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::AllScreens | ForEach-Object { "$($_.DeviceName)|$($_.Bounds.X)|$($_.Bounds.Y)|$($_.Bounds.Width)|$($_.Bounds.Height)|$($_.Primary)" }`;
    const out = execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCmd], { encoding: 'utf-8', timeout: 5000 }).trim();
    if (out) {
      cachedWinScreens = out.split(/\r?\n/).map((line, idx) => {
        const parts = line.trim().split('|');
        return {
          windowsIndex: idx + 1,
          deviceName: parts[0],
          x: parseInt(parts[1], 10),
          y: parseInt(parts[2], 10),
          width: parseInt(parts[3], 10),
          height: parseInt(parts[4], 10),
          isPrimary: parts[5]?.toLowerCase() === 'true',
        };
      });
      lastWinScreensTime = now;
      return cachedWinScreens;
    }
  } catch (e) {}
  return [];
}

function getDisplaysList() {
  const primaryId = screen.getPrimaryDisplay().id;
  const allDisplays = screen.getAllDisplays();
  const winScreens = getWindowsScreens();

  // Fiziksel sol-orta-sağ yerleşim sırası:
  // Ekran 1: Sol Monitör (x < 0)
  // Ekran 2: Orta Monitör (x == 0 / Ana Ekran)
  // Ekran 3: Sağ Monitör (x > 0)
  const sorted = [...allDisplays].sort((a, b) => a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y);

  return sorted.map((d, index) => {
    const isPrimary = d.id === primaryId;

    const winMatch = winScreens.find(ws => {
      if (isPrimary && ws.isPrimary) return true;
      if (Math.abs(ws.x - d.bounds.x) < 500 && Math.abs(ws.y - d.bounds.y) < 100) return true;
      return false;
    }) || winScreens[index];

    const winIndex = index + 1; // 1: Sol, 2: Orta (x=0), 3: Sağ
    const winDeviceName = winMatch ? winMatch.deviceName : `\\\\.\\DISPLAY${index + 1}`;

    let positionHint = 'Orta';
    if (d.bounds.x < 0) positionHint = 'Sol';
    else if (d.bounds.x > 0) positionHint = 'Sağ';

    const monitorLabel = d.label ? ` • ${d.label}` : '';
    const label = `Ekran ${winIndex} (${d.bounds.width}x${d.bounds.height}${monitorLabel})${isPrimary ? ' • Ana Ekran' : ''}`;

    return {
      id: d.id,
      index: winIndex,
      name: label,
      deviceName: winDeviceName,
      positionHint,
      bounds: d.bounds,
      physicalBounds: winMatch ? {
        x: winMatch.x,
        y: winMatch.y,
        width: winMatch.width,
        height: winMatch.height,
      } : d.bounds,
      workArea: d.workArea,
      scaleFactor: d.scaleFactor,
      isPrimary,
    };
  });
}

function createMainWindow() {
  const displays = getDisplaysList();
  // Öncelikli olarak Ekran 2 (Orta Monitör / Masaüstü Dosyalarının Bulunduğu Ekran) üzerinde aç
  const targetDisplay = displays.find(d => d.index === 2) || screen.getPrimaryDisplay();
  const { x, y, width, height } = targetDisplay.bounds;

  mainWindow = new BrowserWindow({
    x,
    y,
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
  const result = await scanDesktop(customPath);
  const displaysList = getDisplaysList();
  const screen1 = displaysList.find(d => d.index === 1);
  const screen2 = displaysList.find(d => d.index === 2) || displaysList[0]; // Orta Monitör (x=0)
  const screen3 = displaysList.find(d => d.index === 3);

  // Dosyaları Windows çoklu monitör sınırlarına ve yerleşimine göre Ekran 1, Ekran 2, Ekran 3'e eşle
  if (result && Array.isArray(result.files)) {
    result.files = result.files.map(file => {
      let matchedDisplay = screen2;

      const dev = (file.screenDevice || '').toLowerCase();
      const vx = typeof file.virtualX === 'number' ? file.virtualX : null;

      // 1. Ekran 1 (Sol Monitör: vx < 0 veya DISPLAY1)
      if (screen1 && (vx !== null ? vx < 0 : ((screen1.deviceName && dev === screen1.deviceName.toLowerCase()) || dev.includes('display1')))) {
        matchedDisplay = screen1;
      }
      // 2. Ekran 3 (Sağ Monitör: vx >= 1920 veya DISPLAY6)
      else if (screen3 && (vx !== null ? vx >= 1920 : ((screen3.deviceName && dev === screen3.deviceName.toLowerCase()) || dev.includes('display6')))) {
        matchedDisplay = screen3;
      }
      // 3. Ekran 2 (Orta / Ana Ekran: 0 <= vx < 1920 veya DISPLAY5)
      else {
        matchedDisplay = screen2;
      }

      let localX = file.screenX;
      let localY = file.screenY;

      // Monitörün yerel (0..width, 0..height) koordinatlarına göre normalize et
      const offsetX = matchedDisplay.physicalBounds?.x ?? (matchedDisplay.bounds.x ?? 0);
      if (vx !== null) {
        let relX = vx - offsetX;
        if (relX >= matchedDisplay.bounds.width) {
          relX = relX % matchedDisplay.bounds.width;
        }
        if (relX < 0) relX = 100;
        localX = relX;
      }
      if (typeof file.virtualY === 'number') {
        localY = file.virtualY % matchedDisplay.bounds.height;
      }

      // Güvenlik sınırları: simgelerin ekran kenarına taşmasını önle
      if (typeof localX !== 'number' || isNaN(localX)) localX = 100;
      if (typeof localY !== 'number' || isNaN(localY)) localY = 100;

      localX = Math.max(30, Math.min(localX, matchedDisplay.bounds.width - 100));
      localY = Math.max(28, Math.min(localY, matchedDisplay.bounds.height - 100));

      return {
        ...file,
        displayId: matchedDisplay.id,
        displayIndex: matchedDisplay.index,
        screenDevice: matchedDisplay.deviceName || file.screenDevice,
        screenX: localX,
        screenY: localY,
      };
    });
  }

  return result;
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

// Çoklu Monitör ve Ekran Seçimi IPC İşleyicileri
ipcMain.handle('window:getDisplays', async () => {
  return getDisplaysList();
});

ipcMain.handle('window:switchDisplay', async (_, displayId) => {
  if (!mainWindow || mainWindow.isDestroyed()) return null;

  const allDisplays = screen.getAllDisplays();
  const targetDisplay = allDisplays.find(d => d.id === displayId) || screen.getPrimaryDisplay();
  const { x, y, width, height } = targetDisplay.bounds;

  mainWindow.setBounds({ x, y, width, height });
  mainWindow.show();
  mainWindow.focus();
  mainWindow.moveTop();
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  const displays = getDisplaysList();
  return displays.find(d => d.id === targetDisplay.id) || displays[0];
});

// Güncel Masaüstü Duvar Kağıdını Tespit Et (Windows Kopya Modu İçin)
ipcMain.handle('desktop:getWallpaper', async () => {
  try {
    const regOutput = execSync(
      'reg query "HKCU\\Control Panel\\Desktop" /v WallPaper',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000 }
    );
    const match = regOutput.match(/WallPaper\s+REG_SZ\s+(.+)/i);
    if (match && match[1]) {
      const wpPath = match[1].trim();
      if (fs.existsSync(wpPath)) {
        const ext = path.extname(wpPath).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
        const buffer = fs.readFileSync(wpPath);
        return `data:${mime};base64,${buffer.toString('base64')}`;
      }
    }
  } catch (e) {}

  try {
    const transcoded = path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Themes\\TranscodedWallpaper');
    if (fs.existsSync(transcoded)) {
      const buffer = fs.readFileSync(transcoded);
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
  } catch (e) {}

  return null;
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

  // Monitör takılıp çıkarıldığında veya çözünürlük değiştiğinde renderer'a haber ver
  const notifyDisplaysChanged = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('displays:changed', getDisplaysList());
    }
  };

  screen.on('display-added', notifyDisplaysChanged);
  screen.on('display-removed', notifyDisplaysChanged);
  screen.on('display-metrics-changed', notifyDisplaysChanged);

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
