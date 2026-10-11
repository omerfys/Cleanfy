import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RobotCanvas } from './components/RobotCanvas';
import { PreviewModal } from './components/PreviewModal';
import { ReportModal } from './components/ReportModal';
import { UndoModal } from './components/UndoModal';
import { Celebration } from './components/Celebration';
import { ZoneSelectorOverlay } from './components/ZoneSelectorOverlay';
import { ScreenSelectorModal } from './components/ScreenSelectorModal';
import {
  computeMultiZoneArrangement,
  CustomZone,
  ZoneTargetsMap,
} from './services/zoneOrganizer';
import { exportToHtml } from './services/exportService';
import { FileItem, ExistingFolder, CleaningMode, RobotState, CleaningStats, ReportItem, UndoSession, DisplayInfo } from './types';
import { 
  Bot, 
  Search, 
  Sparkles, 
  Pause, 
  Play, 
  Square, 
  ListFilter, 
  FileText, 
  RotateCcw, 
  Folder, 
  ShieldCheck, 
  X, 
  Minus, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  Crosshair,
  Monitor,
  GripVertical
} from 'lucide-react';

export const App: React.FC = () => {
  // Masaüstü ve Dosya Durumları
  const [desktopPath, setDesktopPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [existingFolders, setExistingFolders] = useState<ExistingFolder[]>([]);
  const [mode, setMode] = useState<CleaningMode>('safe_clean');
  const [robotState, setRobotState] = useState<RobotState>('Bekleme');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Çoklu Monitör ve Ekran Seçimi Durumları
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [currentDisplay, setCurrentDisplay] = useState<DisplayInfo | null>(null);
  const [isScreenModalOpen, setIsScreenModalOpen] = useState<boolean>(false);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [screenFilterMode, setScreenFilterMode] = useState<'current_screen' | 'all_screens'>('current_screen');

  // Aktif Monitördeki Dosyalar: Farklı bir ekrana geçince SADECE o ekranın üzerindeki dosyaları simüle et
  const activeDisplayFiles = useMemo(() => {
    if (screenFilterMode === 'all_screens' || !currentDisplay) return files;
    return files.filter(f => f.displayId === currentDisplay.id);
  }, [files, currentDisplay, screenFilterMode]);

  // İşlem Durumları
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  isPausedRef.current = isPaused;

  const isStoppedRef = useRef<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // HUD Panelini Daraltma / Genişletme (İlk açılışta varsayılan olarak kapalı)
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(true);
  const [cleanedFileIds, setCleanedFileIds] = useState<Set<string>>(new Set());

  // HUD Konumu ve Sürükleme (Drag & Drop) Durumu
  const [hudPos, setHudPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('cleanfy_hud_pos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isDraggingHud, setIsDraggingHud] = useState<boolean>(false);
  const isDraggingHudRef = useRef<boolean>(false);
  const draggedJustNowRef = useRef<boolean>(false);
  const hudContainerRef = useRef<HTMLDivElement>(null);
  const hudTriggerRef = useRef<HTMLDivElement>(null);
  const hudPopoverRef = useRef<HTMLDivElement>(null);

  // Özel Alan Seçimi (Selection Box) & Çoklu Bölgesel Yerleşim Durumları
  const [isZoneSelectorOpen, setIsZoneSelectorOpen] = useState<boolean>(false);
  const [activeZones, setActiveZones] = useState<CustomZone[]>([]);
  const [zoneTargets, setZoneTargets] = useState<ZoneTargetsMap>({});
  const filePositionsRef = useRef<Record<string, { x: number; y: number }>>({});

  // Modallar
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isUndoOpen, setIsUndoOpen] = useState<boolean>(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);

  const hasAnyModalOpen = isPreviewOpen || isReportOpen || isUndoOpen || isCelebrationOpen || isZoneSelectorOpen || isScreenModalOpen;

  // Rapor ve Geri Alma Geçmişi
  const [reportItems, setReportItems] = useState<ReportItem[]>([]);
  const [undoSessions, setUndoSessions] = useState<UndoSession[]>([]);
  const [isReverting, setIsReverting] = useState<boolean>(false);

  // İstatistikler
  const [stats, setStats] = useState<CleaningStats>({
    totalScanned: 0,
    categorized: 0,
    moved: 0,
    skipped: 0,
    failed: 0,
    createdFolders: [],
    estimatedSecondsRemaining: 0,
  });

  // Modal açıkken fare tıklamalarını yakala, kapalıyken masaüstüne geçir
  useEffect(() => {
    if (window.cleanfyApi) {
      if (hasAnyModalOpen) {
        window.cleanfyApi.setIgnoreMouse(false);
      } else {
        window.cleanfyApi.setIgnoreMouse(true);
      }
    }
  }, [hasAnyModalOpen]);

  // Başlangıç: Gerçek Masaüstünü Tespit Et, Monitörleri ve Duvar Kağıdını Yükle
  useEffect(() => {
    async function initDesktop() {
      if (window.cleanfyApi) {
        try {
          const path = await window.cleanfyApi.getDesktopPath();
          setDesktopPath(path);
          handleScan(path);
        } catch (err) {
          console.error('Masaüstü yolu alınamadı:', err);
        }

        try {
          const dispList = await window.cleanfyApi.getDisplays();
          if (dispList && dispList.length > 0) {
            setDisplays(dispList);
            const target = dispList.find(d => d.isPrimary) || dispList.find(d => d.index === 2) || dispList[0];
            setCurrentDisplay(target);
          }
        } catch (err) {
          console.error('Ekran listesi alınamadı:', err);
        }

        try {
          const wp = await window.cleanfyApi.getWallpaper();
          if (wp) setWallpaperUrl(wp);
        } catch (err) {}
      }
    }
    initDesktop();

    if (window.cleanfyApi?.onDisplaysChanged) {
      const unsub = window.cleanfyApi.onDisplaysChanged((updated) => {
        setDisplays(updated);
        setCurrentDisplay(prev => {
          if (!prev) return updated.find(d => d.isPrimary) || updated[0];
          return updated.find(d => d.id === prev.id) || updated[0];
        });
      });
      return () => unsub();
    }
  }, []);

  // Masaüstünü Tara Fonksiyonu
  const handleScan = async (targetDesktop?: string) => {
    setIsScanning(true);
    setRobotState('Tarama');

    const scanPath = targetDesktop || desktopPath;

    try {
      if (window.cleanfyApi) {
        const result = await window.cleanfyApi.scanDesktop(scanPath);
        setDesktopPath(result.desktopPath);
        setExistingFolders(result.existingFolders);
        setFiles(result.files);

        const targetFiles = currentDisplay ? result.files.filter(f => f.displayId === currentDisplay.id) : result.files;
        setStats(prev => ({
          ...prev,
          totalScanned: targetFiles.length,
          categorized: targetFiles.length,
          moved: 0,
          skipped: 0,
          failed: 0,
        }));
      }
    } catch (err) {
      console.error('Tarama hatası:', err);
      setRobotState('Hata');
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setRobotState('Dolaşma');
      }, 1200);
    }
  };

  // Temizliği Başlat
  const handleStartCleaning = async () => {
    if (mode === 'animation_only') {
      setIsCleaning(true);
      setRobotState('Dolaşma');
      return;
    }

    if (mode === 'scan_preview' && !isPreviewOpen) {
      setIsPreviewOpen(true);
      return;
    }

    // Mod 3: Güvenli Temizlik
    setIsCleaning(true);
    setIsPaused(false);
    isStoppedRef.current = false;
    setProgressPercent(0);
    setCleanedFileIds(new Set());

    const activeFilesToClean = activeDisplayFiles.filter(f => !f.isExcluded);
    const totalToClean = activeFilesToClean.length;

    if (totalToClean === 0) {
      setIsCleaning(false);
      return;
    }

    const currentSessionItems: Array<{ fileName: string; originalPath: string; destinationPath: string; category: string }> = [];
    const newReportItems: ReportItem[] = [];
    const createdFolderSet = new Set<string>();

    let movedCount = 0;
    let skippedCount = activeDisplayFiles.filter(f => f.isExcluded).length;
    let failedCount = 0;

    // Hariç tutulanları kaydet
    activeDisplayFiles.filter(f => f.isExcluded).forEach(f => {
      newReportItems.push({
        fileName: f.name,
        extension: f.extension,
        sizeFormatted: f.sizeFormatted,
        oldPath: f.currentPath,
        newPath: f.currentPath,
        category: f.category,
        status: 'Atlandı',
        timestamp: new Date().toISOString(),
        errorExplanation: 'Kullanıcı tarafından önizleme planında hariç tutuldu.',
      });
    });

    for (let i = 0; i < activeFilesToClean.length; i++) {
      if (isStoppedRef.current) break;

      // Duraklatma beklemesi
      while (isPausedRef.current && !isStoppedRef.current) {
        await new Promise(r => setTimeout(r, 200));
      }

      const fileItem = activeFilesToClean[i];
      setActiveFileId(fileItem.id);

      // Kalan süre tahmini
      const remainingItems = totalToClean - i;
      setStats(prev => ({
        ...prev,
        estimatedSecondsRemaining: Math.max(1, remainingItems * 2),
      }));

      // 1. Robot hedefe yöneliyor
      setRobotState('İnceleme');
      await new Promise(r => setTimeout(r, 700));

      // 2. Robot LiDAR ile tarıyor
      setRobotState('Tarama');
      await new Promise(r => setTimeout(r, 600));

      // 3. Kategori etiketi gösteriliyor
      setRobotState('Düzenleme');
      await new Promise(r => setTimeout(r, 500));

      // 4. Robot taşıma animasyonu yapıyor ve gerçek dosyayı taşıyor
      setRobotState('Taşıma');

      let moveResult = {
        status: 'Başarılı',
        destinationPath: fileItem.targetPath,
        errorMessage: null as string | null,
      };

      if (window.cleanfyApi) {
        const res = await window.cleanfyApi.moveFile(desktopPath, fileItem);
        moveResult = {
          status: res.status,
          destinationPath: res.destinationPath,
          errorMessage: res.errorMessage,
        };
      }

      if (moveResult.status === 'Başarılı') {
        movedCount++;
        setCleanedFileIds(prev => new Set(prev).add(fileItem.id));
        createdFolderSet.add(fileItem.targetRelativePath);
        currentSessionItems.push({
          fileName: fileItem.name,
          originalPath: fileItem.currentPath,
          destinationPath: moveResult.destinationPath,
          category: fileItem.category,
        });

        newReportItems.push({
          fileName: fileItem.name,
          extension: fileItem.extension,
          sizeFormatted: fileItem.sizeFormatted,
          oldPath: fileItem.currentPath,
          newPath: moveResult.destinationPath,
          category: fileItem.category,
          status: 'Başarılı',
          timestamp: new Date().toISOString(),
        });
      } else {
        failedCount++;
        setRobotState('Hata');
        await new Promise(r => setTimeout(r, 800));

        newReportItems.push({
          fileName: fileItem.name,
          extension: fileItem.extension,
          sizeFormatted: fileItem.sizeFormatted,
          oldPath: fileItem.currentPath,
          newPath: fileItem.currentPath,
          category: fileItem.category,
          status: 'Hata',
          timestamp: new Date().toISOString(),
          errorExplanation: moveResult.errorMessage || 'Dosya taşınamadı.',
        });
      }

      const currentProgress = Math.round(((i + 1) / totalToClean) * 100);
      setProgressPercent(currentProgress);

      setStats(prev => ({
        ...prev,
        moved: movedCount,
        skipped: skippedCount,
        failed: failedCount,
        createdFolders: Array.from(createdFolderSet),
      }));
    }

    setActiveFileId(null);

    // Geri alma geçmişine ekle
    if (currentSessionItems.length > 0) {
      setUndoSessions(prev => [
        ...prev,
        {
          id: `session_${Date.now()}`,
          timestamp: new Date().toISOString(),
          items: currentSessionItems,
        },
      ]);
    }

    setReportItems(newReportItems);

    // Temizlik bitti: Yeni oluşturulan kategori klasörlerini temizliğin yapıldığı aktif ekranda konumlandır
    if (createdFolderSet.size > 0 && window.cleanfyApi?.applyDesktopPositions) {
      const folderPositions: Record<string, { x: number; y: number }> = {};
      let screenOffsetX = 0;
      if (currentDisplay?.index === 2) {
        screenOffsetX = 1920;
      } else if (currentDisplay?.index === 3) {
        screenOffsetX = 3840;
      } else {
        screenOffsetX = 0;
      }
      const screenOffsetY = currentDisplay?.physicalBounds?.y ?? (currentDisplay?.bounds.y ?? 0);
      const scale = currentDisplay?.scaleFactor ?? 1;

      let folderIdx = 0;
      createdFolderSet.forEach(folderName => {
        const fullFolderPath = `${desktopPath}\\${folderName}`;
        let localX = 35;
        let localY = 35 + folderIdx * 102;

        if (activeZones.length > 0) {
          const firstZone = activeZones[0];
          localX = Math.round(firstZone.x + 30 + (folderIdx % 3) * 85);
          localY = Math.round(firstZone.y + 30 + Math.floor(folderIdx / 3) * 100);
        }

        const virtualX = Math.round(screenOffsetX + localX * scale);
        const virtualY = Math.round(screenOffsetY + localY * scale);

        folderPositions[fullFolderPath] = { x: virtualX, y: virtualY };
        folderPositions[folderName] = { x: virtualX, y: virtualY };
        folderIdx++;
      });

      // Windows Explorer'ın yeni oluşturulan klasörleri indexlemesi için kısa bekleme
      await new Promise(r => setTimeout(r, 450));
      try {
        await window.cleanfyApi.applyDesktopPositions(folderPositions);
      } catch (e) {
        console.warn('Klasör konumu yerleştirme uyarısı:', e);
      }
    }

    // Masaüstünü temizlik sonrası güncel durumla yeniden tara
    if (desktopPath) {
      await new Promise(r => setTimeout(r, 350));
      handleScan(desktopPath);
    }

    // Eve dön ve Kutlama yap
    setRobotState('Geri dönüş');
    await new Promise(r => setTimeout(r, 1200));

    setRobotState('Tamamlama');
    setIsCleaning(false);
    setProgressPercent(100);
    setIsCelebrationOpen(true);
  };

  const handleTogglePause = () => setIsPaused(prev => !prev);

  const handleStopCleaning = () => {
    isStoppedRef.current = true;
    setIsCleaning(false);
    setIsPaused(false);
    setActiveFileId(null);
    setRobotState('Dolaşma');
  };

  const handleUpdateFile = (fileId: string, updates: Partial<FileItem>) => {
    setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, ...updates } : f)));
  };

  const handleConfirmRevert = async (session: UndoSession) => {
    setIsReverting(true);
    try {
      if (window.cleanfyApi) {
        await window.cleanfyApi.revertMoves(desktopPath, session.items);
      }
      setUndoSessions(prev => prev.filter(s => s.id !== session.id));
      setIsUndoOpen(false);
      setCleanedFileIds(new Set());
      handleScan();
    } catch (err) {
      console.error('Geri alma hatası:', err);
    } finally {
      setIsReverting(false);
    }
  };

  const handleOpenDesktop = () => {
    if (window.cleanfyApi) {
      window.cleanfyApi.openDesktop(desktopPath);
    }
  };

  // Çoklu Monitör Değişimi: Seçilen Ekranın Boyutlarına ve Masaüstüne Uyarla
  const handleSelectDisplay = async (displayId: number) => {
    if (window.cleanfyApi?.switchDisplay) {
      try {
        const switched = await window.cleanfyApi.switchDisplay(displayId);
        if (switched) {
          setCurrentDisplay(switched);
          const wp = await window.cleanfyApi.getWallpaper?.();
          if (wp) setWallpaperUrl(wp);

          // İstatistikleri seçilen ekranın dosya sayısına göre anında güncelle
          const nextScreenFiles = files.filter(f => f.displayId === switched.id);
          setStats(prev => ({
            ...prev,
            totalScanned: nextScreenFiles.length,
            categorized: nextScreenFiles.length,
            moved: 0,
            skipped: 0,
            failed: 0,
          }));

          // Eğer seçili alanlar varsa yeni ekranın boyutlarına ve dosyalarına göre uyarla
          if (activeZones.length > 0) {
            const { targets, zonesWithCounts } = computeMultiZoneArrangement(
              nextScreenFiles,
              activeZones,
              filePositionsRef.current,
              switched.bounds.width,
              switched.bounds.height
            );
            setActiveZones(zonesWithCounts);
            setZoneTargets(targets);
          }
        }
      } catch (err) {
        console.error('Ekran değiştirme hatası:', err);
      }
    }
    setIsScreenModalOpen(false);
  };

  // Çoklu Alan Güncellemesi (Ekleme / Silme / Düzenleme)
  const handleUpdateZones = (newZones: CustomZone[]) => {
    if (newZones.length === 0) {
      setActiveZones([]);
      setZoneTargets({});
      return;
    }

    const screenW = currentDisplay?.bounds.width || window.innerWidth || 1920;
    const screenH = currentDisplay?.bounds.height || window.innerHeight || 1080;

    const { targets, zonesWithCounts } = computeMultiZoneArrangement(
      activeDisplayFiles,
      newZones,
      filePositionsRef.current,
      screenW,
      screenH
    );

    setActiveZones(zonesWithCounts);
    setZoneTargets(targets);

    // 1. Gerçek Windows masaüstündeki simgeleri doğrudan seçilen alan ve ekran koordinatlarına yerleştir
    const realDesktopPositions: Record<string, { x: number; y: number }> = {};
    let screenOffsetX = 0;
    if (currentDisplay?.index === 2) {
      screenOffsetX = 1920;
    } else if (currentDisplay?.index === 3) {
      screenOffsetX = 3840;
    } else {
      screenOffsetX = 0;
    }
    const screenOffsetY = currentDisplay?.physicalBounds?.y ?? (currentDisplay?.bounds.y ?? 0);
    const scale = currentDisplay?.scaleFactor ?? 1;

    activeDisplayFiles.forEach(f => {
      const t = targets[f.id];
      if (t) {
        const virtualX = Math.round(screenOffsetX + t.x * scale);
        const virtualY = Math.round(screenOffsetY + t.y * scale);
        realDesktopPositions[f.currentPath] = { x: virtualX, y: virtualY };
        realDesktopPositions[f.name] = { x: virtualX, y: virtualY };
      }
    });

    if (window.cleanfyApi?.applyDesktopPositions) {
      window.cleanfyApi.applyDesktopPositions(realDesktopPositions).catch(err => {
        console.warn('Masaüstü simge yerleştirme uyarısı:', err);
      });
    }

    // 2. Dosyaların hedef kategorilerini ve gerçek hedef klasör yollarını seçilen alanlara göre güncelle
    // Böylece robot süpürge düzenleme/temizleme yaptığında dosyalar simülasyonda kalmayıp o alanlara taşınır
    const fileIdToZone = new Map<string, CustomZone>();
    zonesWithCounts.forEach(zone => {
      zone.matchedFileIds.forEach(id => {
        fileIdToZone.set(id, zone);
      });
    });

    setFiles(prevFiles =>
      prevFiles.map(f => {
        const assignedZone = fileIdToZone.get(f.id);
        if (assignedZone) {
          const cleanFolder = assignedZone.label.replace(/^[^\w\s\u00C0-\u017F]+/, '').trim() || 'Özel Düzenleme';
          const newTargetPath = desktopPath ? `${desktopPath}\\${cleanFolder}\\${f.name}` : f.targetPath;
          return {
            ...f,
            category: cleanFolder,
            targetRelativePath: cleanFolder,
            targetPath: newTargetPath,
          };
        }
        return f;
      })
    );

    setRobotState('Düzenleme');
    setTimeout(() => {
      setRobotState('Dolaşma');
    }, 3200);
  };

  const handleClearZones = () => {
    setActiveZones([]);
    setZoneTargets({});
    if (desktopPath) {
      handleScan(desktopPath);
    }
  };

  const handleMouseEnterControls = () => {
    window.cleanfyApi?.setIgnoreMouse(false);
  };

  const handleMouseLeaveControls = () => {
    if (!hasAnyModalOpen && !isDraggingHudRef.current) {
      window.cleanfyApi?.setIgnoreMouse(true);
    }
  };

  // Menü Konumunu Sıfırla (Sağ Üst Köşe)
  const handleResetHudPos = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setHudPos(null);
    try {
      localStorage.removeItem('cleanfy_hud_pos');
    } catch {}
  };

  // Menüyü Açarken Ekran Sınırlarını Kontrol Et ve Gerekirse Taşan Kısmı İçeri Çek
  const handleExpandHud = () => {
    if (draggedJustNowRef.current) return;
    if (hudPos) {
      const maxExpandX = Math.max(10, window.innerWidth - 298);
      const maxExpandY = Math.max(10, window.innerHeight - 480);
      if (hudPos.x > maxExpandX || hudPos.y > maxExpandY) {
        const adjusted = {
          x: Math.min(hudPos.x, maxExpandX),
          y: Math.min(hudPos.y, maxExpandY),
        };
        setHudPos(adjusted);
        try {
          localStorage.setItem('cleanfy_hud_pos', JSON.stringify(adjusted));
        } catch {}
      }
    }
    setIsHudCollapsed(false);
  };

  // Ekran Değiştiğinde Menünün Görünür Alanda Kalmasını Sağla
  useEffect(() => {
    if (hudPos) {
      const maxX = Math.max(10, window.innerWidth - 298);
      const maxY = Math.max(10, window.innerHeight - 80);
      if (hudPos.x > maxX || hudPos.y > maxY) {
        const adjusted = {
          x: Math.min(hudPos.x, maxX),
          y: Math.min(hudPos.y, maxY),
        };
        setHudPos(adjusted);
        try {
          localStorage.setItem('cleanfy_hud_pos', JSON.stringify(adjusted));
        } catch {}
      }
    }
  }, [currentDisplay]);

  // Menüyü Ekranda Serbestçe Sürükleme Mantığı (Pointer Events ile Akıcı Taşıma)
  const handleHudPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Sadece sol tık
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return;
    }

    const pointerId = e.pointerId;
    try {
      (e.target as HTMLElement).setPointerCapture(pointerId);
    } catch {}

    window.cleanfyApi?.setIgnoreMouse(false);
    isDraggingHudRef.current = true;

    const startClientX = e.clientX;
    const startClientY = e.clientY;

    const container = hudContainerRef.current;
    if (!container) return;

    const activeEl = isHudCollapsed ? (hudTriggerRef.current || container) : container;
    const rect = activeEl.getBoundingClientRect();
    const startElemX = rect.left;
    const startElemY = rect.top;

    let hasDragged = false;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = moveEv.clientX - startClientX;
      const dy = moveEv.clientY - startClientY;

      if (!hasDragged && Math.hypot(dx, dy) > 4) {
        hasDragged = true;
        setIsDraggingHud(true);
      }

      if (hasDragged) {
        const hudWidth = isHudCollapsed ? (hudTriggerRef.current?.offsetWidth || 230) : 288;
        const hudHeight = isHudCollapsed ? (hudTriggerRef.current?.offsetHeight || 40) : (hudPopoverRef.current?.offsetHeight || 440);

        const minX = 10;
        const maxX = Math.max(10, window.innerWidth - (isHudCollapsed ? hudWidth + 10 : 298));
        const minY = 10;
        const maxY = Math.max(10, window.innerHeight - (isHudCollapsed ? hudHeight + 10 : 470));

        const newX = Math.round(Math.min(Math.max(minX, startElemX + dx), maxX));
        const newY = Math.round(Math.min(Math.max(minY, startElemY + dy), maxY));

        setHudPos({ x: newX, y: newY });
      }
    };

    const onPointerUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      try {
        (e.target as HTMLElement).releasePointerCapture(pointerId);
      } catch {}

      isDraggingHudRef.current = false;
      setIsDraggingHud(false);

      if (hasDragged) {
        draggedJustNowRef.current = true;
        setTimeout(() => {
          draggedJustNowRef.current = false;
        }, 120);

        setHudPos(current => {
          if (current) {
            try {
              localStorage.setItem('cleanfy_hud_pos', JSON.stringify(current));
            } catch {}
          }
          return current;
        });
      }

      const elem = document.elementFromPoint(upEv.clientX, upEv.clientY);
      const isOver = elem && container.contains(elem);
      if (!isOver && !hasAnyModalOpen) {
        window.cleanfyApi?.setIgnoreMouse(true);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none pointer-events-none">
      {/* 1. TÜM MASAÜSTÜNÜ KAPLAYAN 2D FİZİK ROBOT TUVALİ */}
      <div className="absolute inset-0 z-0">
        <RobotCanvas
          files={activeDisplayFiles}
          robotState={robotState}
          activeFileId={activeFileId}
          cleanedFileIds={cleanedFileIds}
          isOverlay={true}
          zoneTargets={zoneTargets}
          activeZones={activeZones}
          filePositionsRef={filePositionsRef}
          currentDisplay={currentDisplay}
          wallpaperUrl={wallpaperUrl}
        />
      </div>

      {/* 2. TAŞINABİLİR GLASSMORPHISM ROBOT MENÜSÜ */}
      <div
        ref={hudContainerRef}
        style={hudPos ? { left: `${hudPos.x}px`, top: `${hudPos.y}px` } : { top: '14px', right: '14px' }}
        className={`pointer-events-none absolute z-40 select-none ${
          isDraggingHud ? 'opacity-95' : ''
        }`}
      >
        {/* Kapalı Durum: Küçük Glassmorphism Rozet Butonu */}
        <div
          ref={hudTriggerRef}
          key="hud-trigger"
          onMouseEnter={handleMouseEnterControls}
          onMouseLeave={handleMouseLeaveControls}
          onPointerDown={handleHudPointerDown}
          onClick={handleExpandHud}
          style={{ transformOrigin: hudPos ? 'top left' : 'top right' }}
          className={`absolute top-0 ${hudPos ? 'left-0' : 'right-0'} flex items-center gap-1.5 px-2.5 py-1.5 glass-badge rounded-full cursor-grab active:cursor-grabbing text-white group menu-trigger ${
            isHudCollapsed ? 'menu-trigger-open hover:scale-105' : 'menu-trigger-closed'
          }`}
          title="Sürükleyerek konumu değiştirin. Menüyü açmak için tıklayın."
        >
          <div
            className="text-slate-400/80 group-hover:text-cyan-300 transition-colors p-0.5 cursor-grab active:cursor-grabbing shrink-0"
            onDoubleClick={handleResetHudPos}
            title="Sürükleyin (Varsayılan sağ üst konuma dönmek için çift tıklayın)"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500/85 to-blue-600/85 border border-white/30 flex items-center justify-center shadow-sm shadow-cyan-500/40 group-hover:rotate-12 transition-transform shrink-0">
            <Bot className="w-3.5 h-3.5 text-white animate-spin-slow" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border border-slate-900" />
          </div>
          <span className="text-[11px] font-bold text-cyan-100 tracking-wide whitespace-nowrap">Cleanfy</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 whitespace-nowrap">
            {robotState}
          </span>
          {currentDisplay && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 whitespace-nowrap flex items-center gap-1">
              <Monitor className="w-2.5 h-2.5" />
              <span>Ekran {currentDisplay.index}</span>
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-300 group-hover:translate-y-0.5 transition-transform shrink-0" />
        </div>

        {/* Açık Durum: Kompakt Glassmorphism Kontrol Menüsü */}
        <div
          ref={hudPopoverRef}
          key="hud-popover"
          onMouseEnter={handleMouseEnterControls}
          onMouseLeave={handleMouseLeaveControls}
          style={{ transformOrigin: hudPos ? 'top left' : 'top right' }}
          className={`w-72 p-3 glass-dock rounded-2xl flex flex-col gap-2.5 text-slate-100 menu-popover ${
            isHudCollapsed ? 'menu-popover-closed' : 'menu-popover-open'
          }`}
        >
          {/* Üst Başlık & Sürükleme Tutamacı & Gizle / Kapat Düğmeleri */}
          <div
            onPointerDown={handleHudPointerDown}
            className="flex items-center justify-between border-b border-white/10 pb-2 cursor-grab active:cursor-grabbing select-none"
            title="Başlıktan tutarak menüyü sürükleyebilirsiniz"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="text-slate-400/80 hover:text-cyan-300 transition-colors p-0.5 cursor-grab active:cursor-grabbing shrink-0"
                onDoubleClick={handleResetHudPos}
                title="Sürükleyin (Varsayılan sağ üst konuma dönmek için çift tıklayın)"
              >
                <GripVertical className="w-3.5 h-3.5" />
              </div>
              <div
                onClick={() => {
                  if (!draggedJustNowRef.current) setIsHudCollapsed(true);
                }}
                className="flex items-center gap-2 cursor-pointer group"
                title="Menüyü Gizle"
              >
                <div className="relative w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500/80 to-blue-600/80 border border-white/30 flex items-center justify-center shadow-sm shadow-cyan-500/30 shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 border border-slate-900 animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 border border-slate-900" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-[11px] leading-tight group-hover:text-cyan-200 transition-colors">
                    Cleanfy Robot
                  </span>
                  <span className="text-[9px] text-cyan-300/90 font-medium leading-tight">
                    Durum: {robotState}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {hudPos && (
                <button
                  onClick={handleResetHudPos}
                  className="p-1 rounded-lg glass-icon-btn text-slate-400 hover:text-cyan-300 text-[10px]"
                  title="Varsayılan Konuma Sıfırla (Sağ Üst)"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => setIsHudCollapsed(true)}
                className="p-1 rounded-lg glass-icon-btn text-slate-300 hover:text-white"
                title="Menüyü Gizle"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => window.cleanfyApi?.closeWindow()}
                className="p-1 rounded-lg glass-icon-btn hover:!bg-red-500/30 hover:!border-red-400/40 text-slate-300 hover:text-white"
                title="Uygulamayı Kapat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Monitör / Ekran Seçimi ve Aktif Dosya Sayısı */}
          <div className="flex items-center justify-between gap-1.5 text-[10px]">
            <button
              onClick={() => setIsScreenModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg glass-pill text-cyan-200 hover:text-white hover:!border-cyan-400/40 transition-colors cursor-pointer shrink-0"
              title="Monitör / Masaüstü Seç (Ekran 1, Ekran 2, Ekran 3)"
            >
              <Monitor className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="font-semibold truncate">
                {currentDisplay ? `Ekran ${currentDisplay.index}` : 'Ekran 1'}
              </span>
              <span className="font-mono text-[9px] text-cyan-300/80">
                ({currentDisplay ? `${currentDisplay.bounds.width}×${currentDisplay.bounds.height}` : '1920×1080'})
              </span>
              {displays.length > 1 && (
                <span className="text-[9px] px-1 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  {displays.length}
                </span>
              )}
            </button>

            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass-pill font-mono text-cyan-200 text-[10px] select-none cursor-default shrink-0"
              title={`Bu ekrandaki dosya sayısı: ${activeDisplayFiles.length}`}
            >
              <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
              <span><strong>{activeDisplayFiles.length}</strong> Dosya</span>
            </div>
          </div>

          {/* İlerleme Çubuğu (Temizlik Sırasında) */}
          {isCleaning && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] text-cyan-300 font-mono">
                <span>İlerleme: %{progressPercent}</span>
                <span>~{stats.estimatedSecondsRemaining}s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Ana Aksiyon Butonları (Tara & Başlat/Durdur) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleScan()}
              disabled={isCleaning || isScanning}
              className="glass-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-cyan-300 hover:text-cyan-100 text-[11px] font-semibold disabled:opacity-50"
            >
              <Search className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Taranıyor' : 'Tara'}</span>
            </button>

            {!isCleaning ? (
              <button
                onClick={handleStartCleaning}
                disabled={isScanning || activeDisplayFiles.length === 0}
                className="glass-btn-primary flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-white text-[11px] font-bold disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-cyan-100" />
                <span>Başlat</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleTogglePause}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500/80 to-amber-600/80 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold"
                >
                  {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  <span>{isPaused ? 'Devam' : 'Duraklat'}</span>
                </button>
                <button
                  onClick={handleStopCleaning}
                  className="flex items-center justify-center p-1.5 rounded-xl bg-gradient-to-r from-rose-500/80 to-rose-600/80 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold"
                  title="Durdur"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Özel Alan Seçimi (Selection Box ile Çoklu Bölgesel Dizilim) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setIsHudCollapsed(true);
                setIsZoneSelectorOpen(true);
              }}
              disabled={activeDisplayFiles.length === 0 || isCleaning}
              className="glass-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-cyan-200 hover:text-white text-[11px] font-semibold disabled:opacity-50"
              title="Selection Box ile ekranda birden fazla alan seçip 'buraya oyunlar', 'buraya klasörler' gibi özel istekler tanımlayın"
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-300" />
              <span>
                {activeZones.length > 0 ? `Alanlar (${activeZones.length})` : 'Alan Seç & Özel Diz'}
              </span>
            </button>

            {activeZones.length > 0 && (
              <button
                onClick={handleClearZones}
                className="px-2 py-1.5 rounded-xl glass-icon-btn text-amber-300 hover:text-amber-100 !border-amber-400/30 text-[10px] font-semibold shrink-0"
                title="Tüm Özel Alanları ve Sabitlemeleri Sıfırla"
              >
                Sıfırla
              </button>
            )}
          </div>

          {/* Alt Hızlı Araçlar (Plan, Rapor, Geri Al) */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
            <button
              onClick={() => setIsPreviewOpen(true)}
              disabled={files.length === 0}
              className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg glass-icon-btn text-slate-300 hover:text-white text-[10px] font-medium disabled:opacity-40"
              title="Düzenleme Planı ve Önizleme"
            >
              <ListFilter className="w-3 h-3 text-cyan-400" />
              <span>Plan</span>
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              disabled={reportItems.length === 0}
              className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg glass-icon-btn text-slate-300 hover:text-white text-[10px] font-medium disabled:opacity-40"
              title="İşlem Raporu"
            >
              <FileText className="w-3 h-3 text-blue-400" />
              <span>Rapor</span>
            </button>

            <button
              onClick={() => setIsUndoOpen(true)}
              disabled={undoSessions.length === 0 || isCleaning}
              className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg glass-icon-btn text-amber-300 hover:text-amber-200 !border-amber-500/25 text-[10px] font-medium disabled:opacity-40"
              title="Son Temizliği Geri Al"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Geri Al</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MODALLAR (ÖNİZLEME, RAPOR, GERİ ALMA, KUTLAMA, ALAN SEÇİMİ, EKRAN SEÇİMİ) */}
      <div className="pointer-events-auto">
        <ZoneSelectorOverlay
          isOpen={isZoneSelectorOpen}
          files={activeDisplayFiles}
          activeZones={activeZones}
          currentDisplay={currentDisplay}
          onClose={() => setIsZoneSelectorOpen(false)}
          onUpdateZones={handleUpdateZones}
        />

        <ScreenSelectorModal
          isOpen={isScreenModalOpen}
          displays={displays}
          currentDisplay={currentDisplay}
          files={files}
          onSelectDisplay={handleSelectDisplay}
          onClose={() => setIsScreenModalOpen(false)}
        />

        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          files={activeDisplayFiles}
          onUpdateFile={handleUpdateFile}
          onConfirmAndClean={handleStartCleaning}
        />

        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportItems={reportItems}
          stats={stats}
          desktopPath={desktopPath}
        />

        <UndoModal
          isOpen={isUndoOpen}
          onClose={() => setIsUndoOpen(false)}
          undoSessions={undoSessions}
          onConfirmRevert={handleConfirmRevert}
          isReverting={isReverting}
        />

        <Celebration
          isOpen={isCelebrationOpen}
          onClose={() => setIsCelebrationOpen(false)}
          stats={stats}
          onOpenReport={() => setIsReportOpen(true)}
          onExportReport={() => exportToHtml(reportItems, stats, desktopPath)}
          onOpenDesktop={handleOpenDesktop}
        />
      </div>
    </div>
  );
};
