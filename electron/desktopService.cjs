const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync, execFile } = require('child_process');
const { app, shell, nativeImage } = require('electron');
const { categorizeFile, CATEGORIES } = require('./categorization.cjs');

// Sistem tarafından gizlenen ve atlanması gereken dosyalar
const IGNORED_FILES = new Set([
  'desktop.ini',
  'thumbs.db',
  '.ds_store',
  'ntuser.dat',
  'ntuser.ini',
]);

/**
 * Windows gerçek masaüstü yolunu tespit eder (OneDrive yönlendirmeleri dahil)
 * @returns {string} Gerçek masaüstü dizini yolu
 */
function getRealDesktopPath() {
  // 1. Yöntem: Electron yerel C++ API (0 ms, anında ve hafızadan)
  try {
    if (app && typeof app.getPath === 'function') {
      const electronDesktop = app.getPath('desktop');
      if (electronDesktop && fs.existsSync(electronDesktop)) {
        return path.resolve(electronDesktop);
      }
    }
  } catch (err) {}

  // 2. Yöntem: Registry kontrolü (Yedek)
  try {
    const regOutput = execSync(
      'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders" /v Desktop',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 2000 }
    );
    const match = regOutput.match(/Desktop\s+REG_(?:EXPAND_)?SZ\s+(.+)/i);
    if (match && match[1]) {
      let regPath = match[1].trim();
      regPath = regPath.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
      if (fs.existsSync(regPath)) {
        return path.resolve(regPath);
      }
    }
  } catch (err) {}

  // 3. Yöntem: OneDrive veya USERPROFILE fallback
  if (process.env.OneDrive) {
    const oneDriveDesktop = path.join(process.env.OneDrive, 'Desktop');
    if (fs.existsSync(oneDriveDesktop)) {
      return path.resolve(oneDriveDesktop);
    }
  }

  const fallback = path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'Desktop');
  return path.resolve(fallback);
}

/**
 * Dosyanın SHA-256 özetini hesaplar
 * @param {string} filePath 
 * @returns {string} SHA-256 hash
 */
function calculateSha256(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (e) {
    return '';
  }
}

/**
 * Windows Shell ve .NET System.Drawing üzerinden masaüstündeki TÜM dosyaların
 * ve kısayolların (.lnk, .url, .exe, UWP, Electron, Steam vb.) orijinal yüksek kaliteli
 * simgelerini tek seferde topluca (batch) çeker.
 * Evrenseldir; kullanıcının veya bilgisayarın adından bağımsız olarak her Windows 10/11'de çalışır.
 * @param {string} desktopPath 
 * @returns {Map<string, string>} Dosya adı -> data:image/png;base64,... haritası
 */
async function batchExtractNativeWindowsIcons(desktopPath) {
  const result = new Map();
  try {
    const escaped = desktopPath.replace(/'/g, "''");
    const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
Add-Type -AssemblyName System.Drawing;
$dict = @{};
$dir = [System.IO.DirectoryInfo]::new('${escaped}');
$files = $dir.GetFiles();
$ms = [System.IO.MemoryStream]::new(16384);
foreach ($f in $files) {
    try {
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($f.FullName);
        if ($null -ne $icon) {
            $ms.SetLength(0);
            $bmp = $icon.ToBitmap();
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png);
            $dict[$f.Name] = 'data:image/png;base64,' + [Convert]::ToBase64String($ms.ToArray());
            $bmp.Dispose();
            $icon.Dispose();
        }
    } catch {}
};
$ms.Dispose();
$dict | ConvertTo-Json -Compress;
`.replace(/\r?\n/g, ' ');

    const out = await new Promise((resolve) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
        {
          encoding: 'utf-8',
          maxBuffer: 50 * 1024 * 1024,
          windowsHide: true,
          timeout: 10000,
        },
        (err, stdout) => {
          resolve(stdout || '');
        }
      );
    });

    if (out) {
      const parsed = JSON.parse(out);
      for (const [name, dataUrl] of Object.entries(parsed)) {
        if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,')) {
          result.set(name, dataUrl);
        }
      }
    }
  } catch (err) {
    console.warn('Toplu simge çıkarma uyarısı (tekil fallback devrede):', err && err.message ? err.message : err);
  }
  return result;
}

/**
 * Tekil bir dosya için Windows .NET System.Drawing üzerinden simge çeker
 * @param {string} filePath 
 * @returns {string|null}
 */
function extractSingleFileViaDotNet(filePath) {
  try {
    const escaped = filePath.replace(/'/g, "''");
    const script = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
Add-Type -AssemblyName System.Drawing;
$icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${escaped}');
if ($null -ne $icon) {
    $ms = [System.IO.MemoryStream]::new(16384);
    $bmp = $icon.ToBitmap();
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png);
    Write-Output ('data:image/png;base64,' + [Convert]::ToBase64String($ms.ToArray()));
    $ms.Dispose();
    $bmp.Dispose();
    $icon.Dispose();
}
`.replace(/\r?\n/g, ' ');

    const out = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${script}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 4000
    }).trim();

    if (out.startsWith('data:image/png;base64,')) {
      return out;
    }
  } catch (e) {}
  return null;
}

/**
 * Windows dosyaları, kısayolları (.lnk) ve Steam/oyun (.url) bağlantıları için gerçek simgeyi çeker
 * @param {string} fullPath
 * @param {Map<string, string>} [preloadedMap]
 * @returns {Promise<string|null>}
 */
async function extractNativeWindowsIcon(fullPath, preloadedMap) {
  const fileName = path.basename(fullPath);

  // 1. Önceden toplu taranmış önbellekten kontrol et (En hızlı ve en kaliteli)
  if (preloadedMap && preloadedMap.has(fileName)) {
    const cached = preloadedMap.get(fileName);
    if (cached) return cached;
  }

  try {
    const ext = path.extname(fullPath).toLowerCase();

    // 2. Steam ve İnternet Kısayolları (.url) - Steam oyun simgeleri IconFile alanında yazar
    if (ext === '.url') {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const iconMatch = content.match(/IconFile=(.+)/i);
        if (iconMatch && iconMatch[1]) {
          let iconPath = iconMatch[1].trim();
          iconPath = iconPath.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
          if (fs.existsSync(iconPath)) {
            if (iconPath.toLowerCase().endsWith('.ico') && nativeImage) {
              const img = nativeImage.createFromPath(iconPath);
              if (!img.isEmpty()) return img.toDataURL();
            }
            if (app && typeof app.getFileIcon === 'function') {
              const icon = await app.getFileIcon(iconPath, { size: 'large' });
              const url = icon.toDataURL();
              if (url && url.length > 1000) return url;
            }
          }
        }
      } catch (err) {}
    }

    // 3. Windows Kısayolları (.lnk) - Hedef programın veya özel simgenin yolunu çözer
    if (ext === '.lnk') {
      try {
        if (shell && typeof shell.readShortcutLink === 'function') {
          const sc = shell.readShortcutLink(fullPath);
          const candidatePath = (sc.icon && fs.existsSync(sc.icon))
            ? sc.icon
            : (sc.target && fs.existsSync(sc.target) ? sc.target : null);

          if (candidatePath) {
            if (candidatePath.toLowerCase().endsWith('.ico') && nativeImage) {
              const img = nativeImage.createFromPath(candidatePath);
              if (!img.isEmpty()) return img.toDataURL();
            }
            if (app && typeof app.getFileIcon === 'function') {
              const icon = await app.getFileIcon(candidatePath, { size: 'large' });
              const url = icon.toDataURL();
              if (url && url.length > 1000) return url;
            }
          }
        }
      } catch (err) {}
    }

    // 4. Genel Dosyalar (.exe, .rar, .zip, .png, .docx, .jar, vb.) - Electron getFileIcon
    if (app && typeof app.getFileIcon === 'function') {
      const icon = await app.getFileIcon(fullPath, { size: 'large' });
      const url = icon.toDataURL();
      // Eğer dönen simge Windows varsayılan boş beyaz kağıt simgesi değilse (> 1000 karakter) kabul et
      if (url && url.length > 1000) {
        return url;
      }
    }

    // 5. Electron başarısız olduysa veya boş sayfa döndürdüyse: Windows .NET Shell ile kesin çıkarma
    const dotNetIcon = extractSingleFileViaDotNet(fullPath);
    if (dotNetIcon) {
      return dotNetIcon;
    }
  } catch (err) {}

  return null;
}

/**
 * Windows Shell.Application COM nesnesini kullanarak gerçek masaüstündeki TÜM öğeleri
 * (User Desktop, Public Desktop, Klasörler ve Sistem simgeleri) orijinal sırasıyla ve ikonlarıyla çeker.
 * @param {string} desktopPath 
 * @returns {Promise<{ files: Array, existingFolders: Array } | null>}
 */
async function scanDesktopViaShell(desktopPath) {
  if (process.platform !== 'win32') return null;

  try {
    const psScript = `
param([string]$OutFile)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$code = @"
using System;
using System.IO;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Drawing;
using System.Drawing.Imaging;
using System.Windows.Forms;

[ComImport]
[Guid("6D5140C1-7436-11CE-8034-00AA006009FA")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IServiceProvider {
    [PreserveSig]
    int QueryService(ref Guid guidService, ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out object ppvObject);
}

[ComImport]
[Guid("000214E2-0000-0000-C000-000000000046")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IShellBrowser {
    void GetWindow(out IntPtr phwnd);
    void ContextSensitiveHelp(bool fEnterMode);
    void InsertMenusSB(IntPtr hmenuShared, IntPtr lpMenuWidths);
    void SetMenuSB(IntPtr hmenuShared, IntPtr holemenuRes, IntPtr hwndActiveObject);
    void RemoveMenusSB(IntPtr hmenuShared);
    void SetStatusTextSB(IntPtr pszStatusText);
    void EnableModelessSB(bool fEnable);
    void TranslateAcceleratorSB(IntPtr pmsg, ushort wID);
    void BrowseObject(IntPtr pidl, uint wFlags);
    void GetViewStateStream(uint grfMode, out IntPtr ppStrm);
    void GetControlWindow(uint id, out IntPtr phwnd);
    void SendControlMsg(uint id, uint uMsg, IntPtr wParam, IntPtr lParam, out IntPtr pret);
    [PreserveSig]
    int QueryActiveShellView([MarshalAs(UnmanagedType.Interface)] out object ppshv);
}

[ComImport]
[Guid("cde725b0-ccc9-4519-917e-325d72fab4ce")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IFolderView {
    [PreserveSig] int GetCurrentViewMode(out uint pViewMode);
    [PreserveSig] int SetCurrentViewMode(uint ViewMode);
    [PreserveSig] int GetFolder(ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out object ppv);
    [PreserveSig] int Item(int iItemIndex, out IntPtr ppidl);
    [PreserveSig] int ItemCount(uint uFlags, out int pcItems);
    [PreserveSig] int Items(uint uFlags, ref Guid riid, [MarshalAs(UnmanagedType.Interface)] out object ppv);
    [PreserveSig] int GetSelectionMarkedItem(out int piItem);
    [PreserveSig] int GetFocusedItem(out int piItem);
    [PreserveSig] int GetItemPosition(IntPtr pidl, out POINT ppt);
    [PreserveSig] int GetSpacing(out POINT ppt);
    [PreserveSig] int GetDefaultSpacing(out POINT ppt);
    [PreserveSig] int GetAutoArrange();
    [PreserveSig] int SelectItem(int iItem, uint dwFlags);
    [PreserveSig] int SelectAndPositionItems(uint cpidl, IntPtr apidl, IntPtr apt, uint dwFlags);
}

[StructLayout(LayoutKind.Sequential)]
public struct POINT {
    public int X;
    public int Y;
}

[StructLayout(LayoutKind.Sequential)]
public struct SIZE {
    public int cx;
    public int cy;
    public SIZE(int x, int y) { cx = x; cy = y; }
}

[ComImport]
[Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IShellItemImageFactory {
    [PreserveSig]
    int GetImage(SIZE size, uint flags, out IntPtr phbm);
}

[StructLayout(LayoutKind.Sequential)]
public struct BITMAP {
    public int bmType;
    public int bmWidth;
    public int bmHeight;
    public int bmWidthBytes;
    public ushort bmPlanes;
    public ushort bmBitsPixel;
    public IntPtr bmBits;
}

[StructLayout(LayoutKind.Sequential)]
public struct BITMAPINFOHEADER {
    public uint biSize;
    public int biWidth;
    public int biHeight;
    public ushort biPlanes;
    public ushort biBitCount;
    public uint biCompression;
    public uint biSizeImage;
    public int biXPelsPerMeter;
    public int biYPelsPerMeter;
    public uint biClrUsed;
    public uint biClrImportant;
}

[StructLayout(LayoutKind.Sequential)]
public struct DIBSECTION {
    public BITMAP dsBm;
    public BITMAPINFOHEADER dsBmih;
    public uint dsBitfields1;
    public uint dsBitfields2;
    public uint dsBitfields3;
    public IntPtr dshSection;
    public uint dsOffset;
}

public class ShellIconHelper {
    [DllImport("shell32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
    public static extern void SHCreateItemFromParsingName(
        [MarshalAs(UnmanagedType.LPWStr)] string pszPath,
        IntPtr pbc,
        ref Guid riid,
        [MarshalAs(UnmanagedType.Interface)] out IShellItemImageFactory ppv
    );

    [DllImport("gdi32.dll")]
    public static extern int GetObject(IntPtr hgdiobj, int cbBuffer, ref DIBSECTION lpvObject);

    [DllImport("gdi32.dll")]
    public static extern bool DeleteObject(IntPtr hObject);

    public static string GetShellIconB64(string path, int width, int height, bool flipVertical) {
        if (string.IsNullOrEmpty(path)) return null;
        try {
            Guid IID_IShellItemImageFactory = new Guid("bcc18b79-ba16-442f-80c4-8a59c30c463b");
            IShellItemImageFactory factory;
            SHCreateItemFromParsingName(path, IntPtr.Zero, ref IID_IShellItemImageFactory, out factory);
            if (factory == null) return null;

            IntPtr hBitmap;
            int hr = factory.GetImage(new SIZE(width, height), 0, out hBitmap);
            if (hr != 0 || hBitmap == IntPtr.Zero) {
                hr = factory.GetImage(new SIZE(width, height), 4, out hBitmap);
            }

            if (hBitmap != IntPtr.Zero) {
                try {
                    DIBSECTION dib = new DIBSECTION();
                    int res = GetObject(hBitmap, Marshal.SizeOf(typeof(DIBSECTION)), ref dib);
                    if (res != 0 && dib.dsBm.bmBits != IntPtr.Zero && dib.dsBm.bmBitsPixel == 32) {
                        int w = dib.dsBm.bmWidth;
                        int h = Math.Abs(dib.dsBm.bmHeight);
                        int stride = dib.dsBm.bmWidthBytes;

                        int byteCount = Math.Abs(stride) * h;
                        byte[] rawBytes = new byte[byteCount];
                        Marshal.Copy(dib.dsBm.bmBits, rawBytes, 0, byteCount);

                        // Yapay shell belge çerçevesi (jar veya dökümanlarda etrafta oluşan 1px gri sınır) tespiti
                        bool isBorder = false;
                        if (rawBytes[3] > 0 || rawBytes[Math.Min(w * 4 - 1, stride - 1)] > 0) {
                            int gapCount = 0;
                            for (int x = 2; x < w - 2; x++) {
                                if (rawBytes[3 * stride + x * 4 + 3] > 0) gapCount++;
                                if (rawBytes[(h - 4) * stride + x * 4 + 3] > 0) gapCount++;
                            }
                            for (int y = 2; y < h - 2; y++) {
                                if (rawBytes[y * stride + 3 * 4 + 3] > 0) gapCount++;
                                if (rawBytes[y * stride + (w - 4) * 4 + 3] > 0) gapCount++;
                            }
                            if (gapCount == 0) isBorder = true;
                        }

                        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                            BitmapData data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                            for (int y = 0; y < h; y++) {
                                int srcY = flipVertical ? (h - 1 - y) : y;
                                Marshal.Copy(rawBytes, srcY * stride, IntPtr.Add(data.Scan0, y * data.Stride), Math.Min(stride, data.Stride));
                            }

                            // Eğer simge etrafında yapay bir gri çerçeve tespit edildiyse kenarları temizle
                            if (isBorder) {
                                byte[] emptyRow = new byte[data.Stride];
                                Marshal.Copy(emptyRow, 0, data.Scan0, data.Stride);
                                Marshal.Copy(emptyRow, 0, IntPtr.Add(data.Scan0, data.Stride), data.Stride);
                                Marshal.Copy(emptyRow, 0, IntPtr.Add(data.Scan0, (h - 2) * data.Stride), data.Stride);
                                Marshal.Copy(emptyRow, 0, IntPtr.Add(data.Scan0, (h - 1) * data.Stride), data.Stride);

                                byte[] rowBuf = new byte[data.Stride];
                                for (int y = 2; y < h - 2; y++) {
                                    IntPtr rowPtr = IntPtr.Add(data.Scan0, y * data.Stride);
                                    Marshal.Copy(rowPtr, rowBuf, 0, data.Stride);
                                    rowBuf[0] = 0; rowBuf[1] = 0; rowBuf[2] = 0; rowBuf[3] = 0;
                                    rowBuf[4] = 0; rowBuf[5] = 0; rowBuf[6] = 0; rowBuf[7] = 0;
                                    int r1 = (w - 2) * 4;
                                    int r2 = (w - 1) * 4;
                                    rowBuf[r1] = 0; rowBuf[r1 + 1] = 0; rowBuf[r1 + 2] = 0; rowBuf[r1 + 3] = 0;
                                    rowBuf[r2] = 0; rowBuf[r2 + 1] = 0; rowBuf[r2 + 2] = 0; rowBuf[r2 + 3] = 0;
                                    Marshal.Copy(rowBuf, 0, rowPtr, data.Stride);
                                }
                            }

                            bmp.UnlockBits(data);

                            using (MemoryStream ms = new MemoryStream()) {
                                bmp.Save(ms, ImageFormat.Png);
                                return "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
                            }
                        }
                    } else {
                        using (Bitmap bmp = Bitmap.FromHbitmap(hBitmap)) {
                            if (flipVertical) {
                                bmp.RotateFlip(RotateFlipType.RotateNoneFlipY);
                            }
                            using (MemoryStream ms = new MemoryStream()) {
                                bmp.Save(ms, ImageFormat.Png);
                                return "data:image/png;base64," + Convert.ToBase64String(ms.ToArray());
                            }
                        }
                    }
                } finally {
                    DeleteObject(hBitmap);
                }
            }
        } catch {}
        return null;
    }
}

public class ItemPos {
    public int ScreenX;
    public int ScreenY;
}

public class DesktopHelper {
    public static Dictionary<int, ItemPos> GetPositions(object desktopWin) {
        var map = new Dictionary<int, ItemPos>();
        if (desktopWin == null) return map;
        try {
            IServiceProvider sp = desktopWin as IServiceProvider;
            if (sp == null) return map;

            Guid SID_STopLevelBrowser = new Guid("4C96BE40-915C-11CF-99D3-00AA004AE837");
            Guid IID_IShellBrowser = new Guid("000214E2-0000-0000-C000-000000000046");
            object sbObj;
            if (sp.QueryService(ref SID_STopLevelBrowser, ref IID_IShellBrowser, out sbObj) != 0) return map;

            IShellBrowser sb = sbObj as IShellBrowser;
            if (sb == null) return map;

            object svObj;
            if (sb.QueryActiveShellView(out svObj) != 0) return map;

            IFolderView fv = svObj as IFolderView;
            if (fv == null) return map;

            int countAll;
            fv.ItemCount(2, out countAll);

            for (int i = 0; i < countAll; i++) {
                IntPtr pidl;
                if (fv.Item(i, out pidl) == 0) {
                    POINT pt;
                    if (fv.GetItemPosition(pidl, out pt) == 0) {
                        Screen sc = Screen.FromPoint(new Point(pt.X, pt.Y));
                        int sx = pt.X - (sc != null ? sc.Bounds.X : 0);
                        int sy = pt.Y - (sc != null ? sc.Bounds.Y : 0);
                        map[i] = new ItemPos { ScreenX = sx, ScreenY = sy };
                    }
                }
            }
        } catch {}
        return map;
    }
}
"@

try {
    Add-Type -TypeDefinition $code -ReferencedAssemblies "System.Windows.Forms", "System.Drawing" -ErrorAction SilentlyContinue
} catch {}

$shell = New-Object -ComObject Shell.Application
$desktopWin = $shell.Windows().FindWindowSW([ref]0, [ref]0, 8, [ref]0, 1)
if (-not $desktopWin) { exit 1 }

$posMap = @{}
try {
    $posMap = [DesktopHelper]::GetPositions($desktopWin)
} catch {}

$items = $desktopWin.Document.Folder.Items()

# Standart Windows 11 temiz klasör simgesi fallback (explorer.exe mavi çekmece yerine)
$defaultFolderB64 = ""
try {
    $defaultFolderB64 = [ShellIconHelper]::GetShellIconB64($env:TEMP, 64, 64, $false)
} catch {}

$res = @()
for ($i = 0; $i -lt $items.Count; $i++) {
    $item = $items.Item($i)
    $p = $item.Path
    $b64 = ""

    $isRealDir = ($p -and [System.IO.Directory]::Exists($p))
    $isVirtualFolder = ($p -and $p.StartsWith("::{"))
    $ext = ""
    if ($p -and -not $isRealDir) {
        $ext = [System.IO.Path]::GetExtension($p).ToLower()
    }
    $isMedia = ($ext -in @('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.ico', '.mp4', '.mkv', '.avi', '.mov', '.wmv'))
    # Sadece gerçek klasörlerin Windows 11 önizlemesi ve medya thumbnail'ları top-down bellekte gelir ($shouldFlip = $false).
    # Geri Dönüşüm Kutusu, WinRAR (.zip, .rar, .7z), uygulamalar ve belgeler GDI ikon çizimi nedeniyle bottom-up bellekte gelir ($shouldFlip = $true).
    $shouldFlip = (-not $isRealDir -and -not $isMedia)

    # 1. IShellItemImageFactory ile gerçek Windows simgesi ve klasör önizlemesi
    if ($p) {
        try {
            $b64 = [ShellIconHelper]::GetShellIconB64($p, 64, 64, $shouldFlip)
        } catch {}
    }

    # 2. İkon henüz alınamadıysa ExtractAssociatedIcon fallback
    if (-not $b64 -and $p -and (Test-Path $p)) {
        try {
            $ms = New-Object System.IO.MemoryStream
            $ico = [System.Drawing.Icon]::ExtractAssociatedIcon($p)
            if ($ico) {
                $ico.ToBitmap().Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                $b64 = "data:image/png;base64," + [Convert]::ToBase64String($ms.ToArray())
                $ico.Dispose()
            }
            $ms.Dispose()
        } catch {}
    }

    # 3. Klasör ise ve hala boşsa temiz Windows 11 klasör simgesi
    if (-not $b64 -and ($isRealDir -or $isVirtualFolder)) {
        $b64 = $defaultFolderB64
    }

    $sx = $null
    $sy = $null
    if ($posMap -and $posMap.ContainsKey($i)) {
        $sx = $posMap[$i].ScreenX
        $sy = $posMap[$i].ScreenY
    }

    $res += [PSCustomObject]@{
        index = $i
        name = $item.Name
        path = $item.Path
        isFolder = [bool]($isRealDir -or $isVirtualFolder)
        type = $item.Type
        size = [int64]$item.Size
        iconDataUrl = $b64
        screenX = $sx
        screenY = $sy
    }
}

$json = $res | ConvertTo-Json -Compress
if ($OutFile) {
    [System.IO.File]::WriteAllText($OutFile, $json, [System.Text.Encoding]::UTF8)
} else {
    Write-Output $json
}
`;

    const ts = Date.now();
    const tempPsFile = path.join(os.tmpdir(), `cleanfy_shell_scan_${ts}.ps1`);
    const tempJsonFile = path.join(os.tmpdir(), `cleanfy_shell_scan_${ts}.json`);
    fs.writeFileSync(tempPsFile, '\uFEFF' + psScript, 'utf8');

    let rawOutput = '';
    try {
      await new Promise((resolve) => {
        execFile(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tempPsFile, '-OutFile', tempJsonFile],
          {
            timeout: 15000,
            windowsHide: true,
          },
          () => resolve()
        );
      });
      if (fs.existsSync(tempJsonFile)) {
        rawOutput = fs.readFileSync(tempJsonFile, 'utf8');
      }
    } finally {
      if (fs.existsSync(tempPsFile)) {
        try { fs.unlinkSync(tempPsFile); } catch (e) {}
      }
      if (fs.existsSync(tempJsonFile)) {
        try { fs.unlinkSync(tempJsonFile); } catch (e) {}
      }
    }

    if (!rawOutput || !rawOutput.trim()) return null;

    const rawItems = JSON.parse(rawOutput.trim());
    if (!Array.isArray(rawItems) || rawItems.length === 0) return null;

    const files = [];
    const existingFolders = [];

    for (const rawItem of rawItems) {
      const isFolder = rawItem.isFolder;
      const itemName = rawItem.name;
      const fullPath = rawItem.path || path.join(desktopPath, itemName);

      const lowerName = itemName.toLowerCase();
      if (IGNORED_FILES.has(lowerName) || lowerName.startsWith('.')) {
        continue;
      }

      const ext = isFolder
        ? 'klasör'
        : (path.extname(fullPath).toLowerCase().replace('.', '') || 'dosya');

      if (isFolder) {
        existingFolders.push({
          name: itemName,
          path: fullPath,
          isCategoryFolder: Object.values(CATEGORIES).includes(itemName),
        });

        files.push({
          id: `folder_${Buffer.from(itemName + rawItem.index).toString('base64').replace(/=/g, '')}`,
          name: itemName,
          extension: 'klasör',
          sizeBytes: rawItem.size || 0,
          sizeFormatted: rawItem.size ? formatBytes(rawItem.size) : 'Klasör',
          modifiedTime: new Date().toISOString(),
          currentPath: fullPath,
          category: itemName.includes('Geri Dönüşüm') ? 'Sistem Klasörü' : 'Mevcut Klasörler',
          subcategory: null,
          targetRelativePath: '',
          targetPath: fullPath,
          iconDataUrl: rawItem.iconDataUrl || null,
          isExcluded: true, // Klasörler kullanıcı masaüstünde korunur
          isFolder: true,
          index: rawItem.index,
          screenX: typeof rawItem.screenX === 'number' ? rawItem.screenX : null,
          screenY: typeof rawItem.screenY === 'number' ? rawItem.screenY : null,
          status: 'Taranmış',
        });
      } else {
        const categorization = categorizeFile(path.basename(fullPath) || itemName);
        const targetPath = path.join(desktopPath, categorization.targetRelativePath, path.basename(fullPath) || itemName);

        files.push({
          id: `file_${Buffer.from(itemName + rawItem.index).toString('base64').replace(/=/g, '')}`,
          name: itemName,
          extension: ext,
          sizeBytes: rawItem.size || 0,
          sizeFormatted: formatBytes(rawItem.size || 0),
          modifiedTime: new Date().toISOString(),
          currentPath: fullPath,
          category: categorization.category,
          subcategory: categorization.subcategory || null,
          targetRelativePath: categorization.targetRelativePath,
          targetPath: targetPath,
          iconDataUrl: rawItem.iconDataUrl || null,
          isExcluded: false,
          isFolder: false,
          index: rawItem.index,
          screenX: typeof rawItem.screenX === 'number' ? rawItem.screenX : null,
          screenY: typeof rawItem.screenY === 'number' ? rawItem.screenY : null,
          status: 'Taranmış',
        });
      }
    }

    return { files, existingFolders };
  } catch (err) {
    console.warn('scanDesktopViaShell uyarısı, standart taramaya geçiliyor:', err);
    return null;
  }
}

/**
 * Masaüstündeki dosyaları tarar ve envanter çıkarır
 * @param {string} [customPath] 
 * @returns {{ desktopPath: string, files: Array, existingFolders: Array, scanTime: string }}
 */
async function scanDesktop(customPath) {
  const desktopPath = customPath || getRealDesktopPath();

  if (!fs.existsSync(desktopPath)) {
    throw new Error(`Masaüstü dizini bulunamadı: ${desktopPath}`);
  }

  // 1. Önce canlı Windows Shell API ile masaüstündeki tüm dosya, klasör ve kısayolları orijinal sırayla al
  if (process.platform === 'win32' && (!customPath || customPath === getRealDesktopPath())) {
    const shellResult = await scanDesktopViaShell(desktopPath);
    if (shellResult && shellResult.files.length > 0) {
      return {
        desktopPath,
        files: shellResult.files,
        existingFolders: shellResult.existingFolders,
        scanTime: new Date().toISOString(),
      };
    }
  }

  // 2. Standart dosya sistemi taraması (Yedek veya test ortamı)
  const batchIcons = await batchExtractNativeWindowsIcons(desktopPath);

  const entries = fs.readdirSync(desktopPath, { withFileTypes: true });
  const files = [];
  const existingFolders = [];

  for (const entry of entries) {
    const fullPath = path.join(desktopPath, entry.name);

    if (entry.isDirectory()) {
      // Mevcut klasörleri koruma kuralı: Mevcut klasörleri kaydet ama içeriğine zorla girme
      existingFolders.push({
        name: entry.name,
        path: fullPath,
        isCategoryFolder: Object.values(CATEGORIES).includes(entry.name),
      });
      continue;
    }

    if (entry.isFile()) {
      const lowerName = entry.name.toLowerCase();
      if (IGNORED_FILES.has(lowerName) || lowerName.startsWith('.')) {
        continue;
      }

      try {
        const stats = fs.statSync(fullPath);
        const categorization = categorizeFile(entry.name);
        const targetPath = path.join(desktopPath, categorization.targetRelativePath, entry.name);

        // Windows sisteminin orijinal, gerçek simgesini çekiyoruz (.lnk ve Steam oyun .url dahil)
        const iconDataUrl = await extractNativeWindowsIcon(fullPath, batchIcons);

        files.push({
          id: `file_${Buffer.from(entry.name).toString('base64').replace(/=/g, '')}`,
          name: entry.name,
          extension: path.extname(entry.name).toLowerCase().replace('.', ''),
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size),
          modifiedTime: stats.mtime.toISOString(),
          currentPath: fullPath,
          category: categorization.category,
          subcategory: categorization.subcategory || null,
          targetRelativePath: categorization.targetRelativePath,
          targetPath: targetPath,
          iconDataUrl: iconDataUrl,
          isExcluded: false,
          status: 'Taranmış', // 'Taranmış' | 'Kuyrukta' | 'Taşınıyor' | 'Başarılı' | 'Atlandı' | 'Hata'
        });
      } catch (err) {
        console.error(`Dosya stat hatası: ${entry.name}`, err);
      }
    }
  }

  return {
    desktopPath,
    files,
    existingFolders,
    scanTime: new Date().toISOString(),
  };
}

/**
 * Çakışma olmadan benzersiz hedef dosya adı üretir (Örn: rapor.pdf -> rapor (1).pdf)
 * @param {string} targetDir 
 * @param {string} fileName 
 * @returns {string} Güvenli dosya adı
 */
function getUniqueFileName(targetDir, fileName) {
  const ext = path.extname(fileName);
  const baseName = path.basename(fileName, ext);
  let newName = fileName;
  let counter = 1;

  while (fs.existsSync(path.join(targetDir, newName))) {
    newName = `${baseName} (${counter})${ext}`;
    counter++;
  }

  return newName;
}

/**
 * Güvenli dosya taşıma işlemi
 * Asla dosya silmez. Asla üzerine yazmaz.
 * @param {string} desktopPath 
 * @param {Object} fileItem 
 * @returns {Promise<Object>} Taşıma işlem sonucu
 */
async function safelyMoveFile(desktopPath, fileItem) {
  const result = {
    fileId: fileItem.id,
    fileName: fileItem.name,
    originalPath: fileItem.currentPath,
    destinationPath: '',
    category: fileItem.category,
    status: 'Başarısız',
    errorMessage: null,
    sizeBytes: fileItem.sizeBytes,
    sourceSha256: '',
    destSha256: '',
    timestamp: new Date().toISOString(),
  };

  try {
    // 1. Kaynak dosyanın hâlâ mevcut olduğunu doğrula
    if (!fs.existsSync(fileItem.currentPath)) {
      result.errorMessage = 'Kaynak dosya bulunamadı veya taşınmış.';
      result.status = 'Başarısız';
      return result;
    }

    // 2. Güvenlik: Hedef dizinin masaüstünün İÇİNDE olduğunu garanti et
    const resolvedDesktop = path.resolve(desktopPath);
    const targetFolder = path.resolve(desktopPath, fileItem.targetRelativePath);
    if (!targetFolder.startsWith(resolvedDesktop)) {
      result.errorMessage = 'Güvenlik ihlali: Hedef masaüstünün dışına çıkamaz!';
      result.status = 'Hata';
      return result;
    }

    // 3. Hedef klasörü oluştur (gerekirse alt klasörleri de)
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // 4. Çakışma kontrolü: Aynı isimli dosya varsa üzerine yazma, numaralandır
    const safeName = getUniqueFileName(targetFolder, fileItem.name);
    const finalTargetPath = path.join(targetFolder, safeName);

    // 5. İçerik güvenliği için işlem öncesi SHA-256 (büyük dosyalarda isteğe bağlı)
    result.sourceSha256 = calculateSha256(fileItem.currentPath);

    // 6. Güvenli taşıma (Aynı diskte fs.renameSync atomiktir)
    fs.renameSync(fileItem.currentPath, finalTargetPath);

    // 7. Doğrulama: Yeni dosya mevcut mu ve boyutu eşleşiyor mu?
    if (!fs.existsSync(finalTargetPath)) {
      result.errorMessage = 'Taşıma sonrası hedef dosya doğrulanamadı.';
      result.status = 'Başarısız';
      return result;
    }

    const newStats = fs.statSync(finalTargetPath);
    if (newStats.size !== fileItem.sizeBytes) {
      result.errorMessage = 'Taşıma sonrası dosya boyutu uyuşmuyor!';
      result.status = 'Hata';
      return result;
    }

    result.destSha256 = calculateSha256(finalTargetPath);
    if (result.sourceSha256 && result.destSha256 && result.sourceSha256 !== result.destSha256) {
      result.errorMessage = 'SHA-256 özeti uyuşmuyor!';
      result.status = 'Hata';
      return result;
    }

    result.destinationPath = finalTargetPath;
    result.status = 'Başarılı';
    return result;
  } catch (err) {
    result.errorMessage = err.message || 'Bilinmeyen taşıma hatası';
    result.status = 'Başarısız';
    return result;
  }
}

/**
 * Geri Alma (Undo) işlemi
 * @param {string} desktopPath 
 * @param {Array} historyItems 
 * @returns {Array} Geri alma sonuçları
 */
async function revertMoveHistory(desktopPath, historyItems) {
  const revertResults = [];

  for (const item of [...historyItems].reverse()) {
    const rev = {
      fileName: item.fileName,
      fromPath: item.destinationPath,
      toPath: item.originalPath,
      status: 'Başarısız',
      errorMessage: null,
    };

    try {
      if (!fs.existsSync(item.destinationPath)) {
        rev.errorMessage = 'Taşınmış dosya hedef konumda bulunamadı.';
        revertResults.push(rev);
        continue;
      }

      // Orijinal konumda dosya var mı? Varsa üstüne yazma
      const targetDir = path.dirname(item.originalPath);
      const safeName = getUniqueFileName(targetDir, path.basename(item.originalPath));
      const safeOriginalPath = path.join(targetDir, safeName);

      fs.renameSync(item.destinationPath, safeOriginalPath);

      if (fs.existsSync(safeOriginalPath)) {
        rev.status = 'Başarılı';
        rev.toPath = safeOriginalPath;
      } else {
        rev.errorMessage = 'Geri taşıma doğrulanamadı.';
      }
    } catch (err) {
      rev.errorMessage = err.message;
    }

    revertResults.push(rev);
  }

  return revertResults;
}

/**
 * Bayt cinsinden dosya boyutunu okunabilir formata çevirir
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
  getRealDesktopPath,
  scanDesktop,
  safelyMoveFile,
  revertMoveHistory,
  calculateSha256,
  formatBytes,
};
