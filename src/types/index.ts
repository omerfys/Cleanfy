export type RobotState =
  | 'Bekleme'
  | 'Tarama'
  | 'Dolaşma'
  | 'Çarpışma'
  | 'İtme'
  | 'İnceleme'
  | 'Düzenleme'
  | 'Taşıma'
  | 'Geri dönüş'
  | 'Tamamlama'
  | 'Hata';

export type CleaningMode = 'animation_only' | 'scan_preview' | 'safe_clean';

export type FileStatus = 'Taranmış' | 'Kuyrukta' | 'İnceleniyor' | 'Taşınıyor' | 'Başarılı' | 'Atlandı' | 'Hata';

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedTime: string;
  currentPath: string;
  category: string;
  subcategory: string | null;
  targetRelativePath: string;
  targetPath: string;
  isExcluded: boolean;
  status: FileStatus;
  iconDataUrl?: string | null;
  sourceSha256?: string;
  destSha256?: string;
  isFolder?: boolean;
  index?: number;
  screenX?: number | null;
  screenY?: number | null;
  // Fizik simülasyonu için geçici koordinatlar
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface ExistingFolder {
  name: string;
  path: string;
  isCategoryFolder: boolean;
}

export interface CleaningStats {
  totalScanned: number;
  categorized: number;
  moved: number;
  skipped: number;
  failed: number;
  createdFolders: string[];
  estimatedSecondsRemaining: number;
}

export interface ReportItem {
  fileName: string;
  extension: string;
  sizeFormatted: string;
  oldPath: string;
  newPath: string;
  category: string;
  status: 'Başarılı' | 'Atlandı' | 'Hata';
  timestamp: string;
  errorExplanation?: string;
}

export interface UndoSession {
  id: string;
  timestamp: string;
  items: Array<{
    fileName: string;
    originalPath: string;
    destinationPath: string;
    category: string;
  }>;
}

// Window cleanfyApi type tanımı
declare global {
  interface Window {
    cleanfyApi?: {
      getDesktopPath: () => Promise<string>;
      scanDesktop: (customPath?: string) => Promise<{
        desktopPath: string;
        files: FileItem[];
        existingFolders: ExistingFolder[];
        scanTime: string;
      }>;
      moveFile: (desktopPath: string, fileItem: FileItem) => Promise<{
        fileId: string;
        fileName: string;
        originalPath: string;
        destinationPath: string;
        category: string;
        status: 'Başarılı' | 'Hata' | 'Başarısız';
        errorMessage: string | null;
        sourceSha256: string;
        destSha256: string;
        timestamp: string;
      }>;
      revertMoves: (desktopPath: string, historyItems: any[]) => Promise<any[]>;
      openDesktop: (targetPath?: string) => Promise<boolean>;
      toggleOverlay: (enable: boolean) => Promise<boolean>;
      setIgnoreMouse: (ignore: boolean) => Promise<void>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      onOverlaySync: (callback: (data: any) => void) => () => void;
      sendOverlaySync: (data: any) => void;
    };
  }
}
