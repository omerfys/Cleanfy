import { FileItem } from '../types';

export interface ZoneRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZoneColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  border: string;
  bgFill: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  badgeGlow: string;
  tailwindBorder: string;
  tailwindBg: string;
  tailwindText: string;
}

export const ZONE_COLOR_THEMES: ZoneColorTheme[] = [
  // 1. Cyan (Neon Mavi - 1. Alan)
  {
    id: 'cyan',
    name: 'Cyan Mavi',
    primary: '#06b6d4',
    secondary: '#22d3ee',
    border: 'rgba(34, 211, 238, 0.85)',
    bgFill: 'rgba(6, 182, 212, 0.11)',
    badgeBg: 'rgba(8, 20, 36, 0.94)',
    badgeBorder: 'rgba(34, 211, 238, 0.70)',
    badgeText: '#67e8f9',
    badgeGlow: 'rgba(6, 182, 212, 0.45)',
    tailwindBorder: 'border-cyan-400',
    tailwindBg: 'bg-cyan-500/20',
    tailwindText: 'text-cyan-300',
  },
  // 2. Emerald (Neon Zümrüt Yeşili - 2. Alan)
  {
    id: 'emerald',
    name: 'Zümrüt Yeşili',
    primary: '#10b981',
    secondary: '#34d399',
    border: 'rgba(52, 211, 153, 0.85)',
    bgFill: 'rgba(16, 185, 129, 0.11)',
    badgeBg: 'rgba(8, 30, 20, 0.94)',
    badgeBorder: 'rgba(52, 211, 153, 0.70)',
    badgeText: '#6ee7b7',
    badgeGlow: 'rgba(16, 185, 129, 0.45)',
    tailwindBorder: 'border-emerald-400',
    tailwindBg: 'bg-emerald-500/20',
    tailwindText: 'text-emerald-300',
  },
  // 3. Purple (Neon Mor / Lavanta - 3. Alan)
  {
    id: 'purple',
    name: 'Neon Mor',
    primary: '#a855f7',
    secondary: '#c084fc',
    border: 'rgba(192, 132, 252, 0.85)',
    bgFill: 'rgba(168, 85, 247, 0.11)',
    badgeBg: 'rgba(26, 12, 44, 0.94)',
    badgeBorder: 'rgba(192, 132, 252, 0.70)',
    badgeText: '#d8b4fe',
    badgeGlow: 'rgba(168, 85, 247, 0.45)',
    tailwindBorder: 'border-purple-400',
    tailwindBg: 'bg-purple-500/20',
    tailwindText: 'text-purple-300',
  },
  // 4. Amber (Sıcak Altın Sarısı - 4. Alan)
  {
    id: 'amber',
    name: 'Altın Kehribar',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.85)',
    bgFill: 'rgba(245, 158, 11, 0.11)',
    badgeBg: 'rgba(34, 22, 8, 0.94)',
    badgeBorder: 'rgba(251, 191, 36, 0.70)',
    badgeText: '#fde68a',
    badgeGlow: 'rgba(245, 158, 11, 0.45)',
    tailwindBorder: 'border-amber-400',
    tailwindBg: 'bg-amber-500/20',
    tailwindText: 'text-amber-300',
  },
  // 5. Rose (Mercan Pembesi - 5. Alan)
  {
    id: 'rose',
    name: 'Mercan Pembesi',
    primary: '#f43f5e',
    secondary: '#fb7185',
    border: 'rgba(251, 113, 133, 0.85)',
    bgFill: 'rgba(244, 63, 94, 0.11)',
    badgeBg: 'rgba(36, 10, 18, 0.94)',
    badgeBorder: 'rgba(251, 113, 133, 0.70)',
    badgeText: '#fecdd3',
    badgeGlow: 'rgba(244, 63, 94, 0.45)',
    tailwindBorder: 'border-rose-400',
    tailwindBg: 'bg-rose-500/20',
    tailwindText: 'text-rose-300',
  },
  // 6. Indigo (Kraliyet Mavisi - 6. Alan)
  {
    id: 'indigo',
    name: 'İndigo',
    primary: '#6366f1',
    secondary: '#818cf8',
    border: 'rgba(129, 140, 248, 0.85)',
    bgFill: 'rgba(99, 102, 241, 0.11)',
    badgeBg: 'rgba(16, 16, 40, 0.94)',
    badgeBorder: 'rgba(129, 140, 248, 0.70)',
    badgeText: '#c7d2fe',
    badgeGlow: 'rgba(99, 102, 241, 0.45)',
    tailwindBorder: 'border-indigo-400',
    tailwindBg: 'bg-indigo-500/20',
    tailwindText: 'text-indigo-300',
  },
];

export interface CustomZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prompt: string;
  label: string;
  colorIndex: number;
  colorTheme: ZoneColorTheme;
  matchedCount: number;
  matchedFileIds: string[];
}

export interface ZonePreset {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
}

export const ZONE_PRESETS: ZonePreset[] = [
  { id: 'games', label: 'Sadece Oyunlar', emoji: '🎮', prompt: 'Buraya sadece oyunları koy' },
  { id: 'folders', label: 'Sadece Klasörler', emoji: '📁', prompt: 'Buraya sadece klasörleri koy' },
  { id: 'archives', label: 'Sadece Arşivler', emoji: '📦', prompt: 'Buraya sadece arşivleri koy' },
  { id: 'code', label: 'Jar & Kodlar', emoji: '☕', prompt: 'Buraya sadece jar ve kod dosyalarını koy' },
  { id: 'images', label: 'Sadece Görseller', emoji: '🖼️', prompt: 'Buraya sadece görselleri koy' },
  { id: 'docs', label: 'Sadece Belgeler', emoji: '📄', prompt: 'Buraya sadece belgeleri koy' },
  { id: 'apps', label: 'Uygulamalar', emoji: '🚀', prompt: 'Buraya sadece uygulamaları koy' },
];

const GAME_KEYWORDS = [
  'valorant',
  'roblox',
  'modrinth',
  'aniimo',
  'steam',
  'epic',
  'riot',
  'minecraft',
  'lunar',
  'feather',
  'curseforge',
  'battle.net',
  'ubisoft',
  'genshin',
  'league of legends',
  'cs2',
  'counter-strike',
  'dota',
  'gta',
  'fifa',
  'cyberpunk',
  'stardew',
  'chivalry',
  'rounds',
  'goose',
  'soccer',
  'peak',
  'how to fish',
  'battle golf',
  'hackhub',
  'tlauncher',
  'badlion',
  'oyun',
  'game',
];

export function isGameItem(file: FileItem): boolean {
  if (file.isFolder) return false;
  const ext = (file.extension || '').toLowerCase();
  const nameLower = (file.name || '').toLowerCase();

  // Windows masaüstündeki Steam / Epic oyun kısayolları (.url)
  if (ext === '.url') return true;

  // Bilinen oyun ve oyun başlatıcı isimleri (.lnk veya .exe)
  if (ext === '.lnk' || ext === '.exe' || ext === '') {
    if (GAME_KEYWORDS.some(kw => nameLower.includes(kw))) {
      return true;
    }
  }

  return false;
}

export function isRecycleBinItem(file: FileItem): boolean {
  const nameLower = (file.name || '').toLowerCase();
  return (
    Boolean(file.currentPath && file.currentPath.startsWith('::{')) ||
    nameLower.includes('geri dönüşüm') ||
    nameLower.includes('recycle bin')
  );
}

/**
 * Kullanıcının doğal dilde yazdığı özel isteği ("buraya sadece oyunları koy", "sadece klasörleri diz" vb.)
 * analiz ederek eşleşen masaüstü öğelerini döndürür.
 */
export function matchFilesByCustomRequest(
  files: FileItem[],
  rawPrompt: string
): { matched: FileItem[]; label: string } {
  const q = rawPrompt.trim().toLowerCase();
  if (!q) {
    return { matched: [], label: 'Seçim Yok' };
  }

  // 1. Oyunlar
  if (q.includes('oyun') || q.includes('game') || q.includes('steam')) {
    return {
      matched: files.filter(f => isGameItem(f)),
      label: 'Oyunlar',
    };
  }

  // 2. Klasörler
  if (q.includes('klasör') || q.includes('klasor') || q.includes('folder') || q.includes('dizin')) {
    return {
      matched: files.filter(f => Boolean(f.isFolder) && !isRecycleBinItem(f)),
      label: 'Klasörler',
    };
  }

  // 3. Arşivler (.zip, .rar, .7z)
  if (
    q.includes('arşiv') ||
    q.includes('arsiv') ||
    q.includes('zip') ||
    q.includes('rar') ||
    q.includes('7z') ||
    q.includes('winrar') ||
    q.includes('sıkıştır')
  ) {
    const archiveExts = new Set(['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz']);
    return {
      matched: files.filter(
        f => !f.isFolder && (archiveExts.has(f.extension.toLowerCase()) || f.category === 'Arşivler')
      ),
      label: 'Arşiv Dosyaları',
    };
  }

  // 4. Sadece JAR istendiyse
  if (q.includes('jar') && !q.includes('kod')) {
    return {
      matched: files.filter(f => !f.isFolder && f.extension.toLowerCase() === '.jar'),
      label: 'JAR Dosyaları',
    };
  }

  // 5. Kod / Yazılım / Plugin / Jar
  if (
    q.includes('kod') ||
    q.includes('yazılım') ||
    q.includes('yazilim') ||
    q.includes('plugin') ||
    q.includes('script') ||
    q.includes('jar') ||
    q.includes('yml') ||
    q.includes('json')
  ) {
    const codeExts = new Set([
      '.jar', '.yml', '.yaml', '.jem', '.json', '.py', '.js', '.ts', '.tsx', '.jsx',
      '.cs', '.cpp', '.c', '.h', '.html', '.css', '.sql', '.sh', '.bat', '.ps1', '.xml', '.toml',
    ]);
    return {
      matched: files.filter(
        f => !f.isFolder && (codeExts.has(f.extension.toLowerCase()) || f.category === 'Yazılım ve Kod Projeleri')
      ),
      label: 'Yazılım & Kodlar',
    };
  }

  // 6. Görseller / Resimler / Fotoğraflar
  if (
    q.includes('görsel') ||
    q.includes('gorsel') ||
    q.includes('resim') ||
    q.includes('foto') ||
    q.includes('png') ||
    q.includes('jpg') ||
    q.includes('image')
  ) {
    const imgExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico']);
    return {
      matched: files.filter(
        f => !f.isFolder && (imgExts.has(f.extension.toLowerCase()) || f.category === 'Fotoğraflar ve Görseller')
      ),
      label: 'Görseller',
    };
  }

  // 7. Belgeler / Metinler / Notlar
  if (
    q.includes('belge') ||
    q.includes('metin') ||
    q.includes('txt') ||
    q.includes('not') ||
    q.includes('pdf') ||
    q.includes('word') ||
    q.includes('excel') ||
    q.includes('doküman') ||
    q.includes('dokuman') ||
    q.includes('yazı')
  ) {
    const docExts = new Set(['.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.md', '.rtf', '.csv']);
    return {
      matched: files.filter(
        f => !f.isFolder && (docExts.has(f.extension.toLowerCase()) || f.category === 'Belgeler')
      ),
      label: 'Belgeler',
    };
  }

  // 8. Videolar ve Sesler
  if (q.includes('video') || q.includes('film') || q.includes('mp4') || q.includes('kayıt') || q.includes('ses') || q.includes('mp3')) {
    const mediaExts = new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm', '.wmv', '.mp3', '.wav', '.ogg', '.flac']);
    return {
      matched: files.filter(
        f => !f.isFolder && (mediaExts.has(f.extension.toLowerCase()) || f.category === 'Videolar' || f.category === 'Ses Dosyaları')
      ),
      label: 'Medya & Video',
    };
  }

  // 9. Uygulamalar / Kısayollar / Kurulumlar
  if (
    q.includes('uygulama') ||
    q.includes('program') ||
    q.includes('exe') ||
    q.includes('kısayol') ||
    q.includes('kisayol') ||
    q.includes('kurulum')
  ) {
    const appExts = new Set(['.exe', '.msi', '.lnk']);
    return {
      matched: files.filter(
        f => !f.isFolder && !isGameItem(f) && (appExts.has(f.extension.toLowerCase()) || f.category === 'Kurulum Dosyaları' || f.category === 'Kısayollar')
      ),
      label: 'Uygulamalar',
    };
  }

  // 10. Hepsi / Tümü
  if (q.includes('hepsi') || q.includes('tümü') || q.includes('tüm dosya') || q.includes('her şey')) {
    return {
      matched: files.filter(f => !isRecycleBinItem(f)),
      label: 'Tüm Öğeler',
    };
  }

  // 11. Serbest Kelime / Dosya Adı / Uzantı Eşleşmesi
  const stopWords = new Set([
    'buraya', 'sadece', 'koy', 'listele', 'diz', 'getir', 'topla', 'yerleştir',
    'alana', 'köşeye', 'seçili', 'olan', 'dosyaları', 'dosyalarını', 've', 'ile',
  ]);
  const tokens = q
    .replace(/[.,!?;:]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !stopWords.has(t));

  if (tokens.length > 0) {
    const matched = files.filter(f => {
      const nameL = f.name.toLowerCase();
      const extL = f.extension.toLowerCase();
      const catL = f.category.toLowerCase();
      return tokens.some(tok => nameL.includes(tok) || extL.includes(tok) || catL.includes(tok));
    });
    return {
      matched,
      label: `"${tokens.join(' ')}"`,
    };
  }

  return { matched: [], label: 'Özel Seçim' };
}

/**
 * Seçilen dikdörtgen alana (ZoneRect) sadece eşleşen dosyaları düzenli bir ızgara (grid) halinde yerleştirir;
 * o alanın içinde bulunan diğer (eşleşmeyen) dosyaları ise alanın dışındaki boş masaüstü yuvalarına taşır.
 */
export interface ZoneTargetsMap {
  [fileId: string]: {
    x: number;
    y: number;
    zoneId?: string;
    zoneLabel?: string;
    colorTheme?: ZoneColorTheme;
  };
}

/**
 * Birden fazla bölgeyi (CustomZone[]) aynı anda hesaplar:
 * 1. Her bölgeye sadece o bölgenin isteğine uyan dosyalar atanır (önceki bölgelere atanan dosyalar tekrar atanmaz).
 * 2. Her bölge kendi sınırları içinde düzenli bir ızgaraya (grid) yerleştirilir.
 * 3. Hiçbir bölgeyle eşleşmeyen ama herhangi bir bölgenin içinde bulunan dosyalar ise,
 *    TÜM BÖLGELERİN DIŞINDA kalan en yakın boş masaüstü yuvalarına (slot) tahliye edilir.
 */
export function computeMultiZoneArrangement(
  allFiles: FileItem[],
  zones: CustomZone[],
  currentPositions: Record<string, { x: number; y: number }>,
  canvasW: number = 1920,
  canvasH: number = 1080
): {
  targets: ZoneTargetsMap;
  zonesWithCounts: CustomZone[];
} {
  const targets: ZoneTargetsMap = {};
  const assignedFileIds = new Set<string>();

  const margin = 20;
  const isInsideAnyZone = (x: number, y: number) => {
    return zones.some(
      z =>
        x >= z.x - margin &&
        x <= z.x + z.width + margin &&
        y >= z.y - margin &&
        y <= z.y + z.height + margin
    );
  };

  const zonesWithCounts: CustomZone[] = zones.map((zone, zIdx) => {
    const { matched, label } = matchFilesByCustomRequest(allFiles, zone.prompt);
    // Önceki bölgelere atanmış olan dosyaları tekrar atama
    const eligible = matched.filter(f => !assignedFileIds.has(f.id));
    eligible.forEach(f => assignedFileIds.add(f.id));

    const colorTheme = zone.colorTheme || ZONE_COLOR_THEMES[zone.colorIndex % ZONE_COLOR_THEMES.length];
    const N = eligible.length;

    if (N > 0) {
      const padX = Math.min(38, Math.max(22, zone.width * 0.10));
      const padY = Math.min(42, Math.max(28, zone.height * 0.10));

      const innerX = Math.max(34, zone.x + padX);
      const innerY = Math.max(34, zone.y + padY);
      const usableW = Math.max(10, zone.width - padX * 2);
      const usableH = Math.max(10, zone.height - padY * 2);

      const idealStepX = 76;
      const idealStepY = 94;

      const isVerticalStrip = zone.height > zone.width * 1.25;
      let cols = Math.max(1, Math.floor(usableW / idealStepX) + 1);
      let rows = Math.max(1, Math.floor(usableH / idealStepY) + 1);

      if (cols * rows < N) {
        const aspect = Math.max(0.2, Math.min(5, usableW / Math.max(1, usableH)));
        cols = Math.max(1, Math.ceil(Math.sqrt(N * aspect)));
        rows = Math.max(1, Math.ceil(N / cols));
      }

      const stepX = cols > 1 ? Math.min(idealStepX, usableW / (cols - 1)) : 0;
      const stepY = rows > 1 ? Math.min(idealStepY, usableH / (rows - 1)) : 0;

      eligible.forEach((file, idx) => {
        let col: number;
        let row: number;

        if (isVerticalStrip) {
          row = idx % rows;
          col = Math.floor(idx / rows);
        } else {
          col = idx % cols;
          row = Math.floor(idx / cols);
        }

        const tx = Math.min(canvasW - 36, Math.max(36, Math.round(innerX + col * stepX)));
        const ty = Math.min(canvasH - 52, Math.max(34, Math.round(innerY + row * stepY)));

        targets[file.id] = {
          x: tx,
          y: ty,
          zoneId: zone.id,
          zoneLabel: zone.label || label,
          colorTheme,
        };
      });
    }

    return {
      ...zone,
      label: zone.label || label,
      colorTheme,
      matchedCount: eligible.length,
      matchedFileIds: eligible.map(f => f.id),
    };
  });

  // 2. Bölgelerin içine düşen ama o bölgelerin hiçbirine ait olmayan dosyaları tahliye et
  if (zones.length > 0) {
    const occupiedPoints: Array<{ x: number; y: number }> = [];
    allFiles.forEach(f => {
      if (assignedFileIds.has(f.id)) {
        if (targets[f.id]) occupiedPoints.push(targets[f.id]);
        return;
      }
      const pos = targets[f.id] || currentPositions[f.id];
      if (pos && !isInsideAnyZone(pos.x, pos.y)) {
        occupiedPoints.push(pos);
      }
    });

    // Masaüstünde tüm bölgelerin dışında kalan boş ızgara noktaları
    const candidateSlots: Array<{ x: number; y: number }> = [];
    const maxCols = Math.max(1, Math.floor((canvasW - 70) / 76));
    const maxRows = 10;
    const startY = 34;
    const stepY = Math.min(98, Math.floor((canvasH - 90) / maxRows));

    for (let c = 0; c < maxCols; c++) {
      for (let r = 0; r < maxRows; r++) {
        const sx = 38 + c * 76;
        const sy = startY + r * stepY;
        if (!isInsideAnyZone(sx, sy)) {
          candidateSlots.push({ x: sx, y: sy });
        }
      }
    }

    allFiles.forEach(file => {
      if (assignedFileIds.has(file.id)) return;
      const cur = targets[file.id] || currentPositions[file.id];
      if (!cur) return;

      if (isInsideAnyZone(cur.x, cur.y)) {
        let bestSlot: { x: number; y: number } | null = null;
        let bestDist = Infinity;

        for (const slot of candidateSlots) {
          const isTaken = occupiedPoints.some(p => Math.hypot(p.x - slot.x, p.y - slot.y) < 52);
          if (!isTaken) {
            const d = Math.hypot(slot.x - cur.x, slot.y - cur.y);
            if (d < bestDist) {
              bestDist = d;
              bestSlot = slot;
            }
          }
        }

        if (bestSlot) {
          targets[file.id] = bestSlot;
          occupiedPoints.push(bestSlot);
        }
      }
    });
  }

  return { targets, zonesWithCounts };
}

/**
 * Geriye dönük uyumluluk: Tek bir bölge için çağrıldığında computeMultiZoneArrangement üzerinden çalışır
 */
export function computeZoneArrangement(
  allFiles: FileItem[],
  zone: ZoneRect,
  rawPrompt: string,
  currentPositions: Record<string, { x: number; y: number }>,
  existingZoneTargets: Record<string, { x: number; y: number }>,
  canvasW: number,
  canvasH: number
): { targets: Record<string, { x: number; y: number }>; matchedCount: number; label: string } {
  const { matched, label } = matchFilesByCustomRequest(allFiles, rawPrompt);
  const colorTheme = ZONE_COLOR_THEMES[0];
  const customZone: CustomZone = {
    id: `zone_${Date.now()}`,
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    prompt: rawPrompt,
    label: label,
    colorIndex: 0,
    colorTheme,
    matchedCount: matched.length,
    matchedFileIds: matched.map(f => f.id),
  };

  const { targets } = computeMultiZoneArrangement(allFiles, [customZone], currentPositions, canvasW, canvasH);
  return {
    targets,
    matchedCount: matched.length,
    label,
  };
}
