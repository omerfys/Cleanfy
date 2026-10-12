import { FileItem } from '../types';

export interface ZoneRect {
  x: number;
  y: number;
  width: number;
  height: number;
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
export function computeZoneArrangement(
  allFiles: FileItem[],
  matchedFiles: FileItem[],
  zone: ZoneRect,
  currentPositions: Map<string, { x: number; y: number }>,
  existingZoneTargets: Record<string, { x: number; y: number }>,
  canvasW: number,
  canvasH: number
): Record<string, { x: number; y: number }> {
  const updatedTargets: Record<string, { x: number; y: number }> = { ...existingZoneTargets };
  const matchedIds = new Set(matchedFiles.map(f => f.id));

  // 1. Seçilen kutunun içine eşleşen dosyaları ızgara (grid) olarak diz
  const N = matchedFiles.length;
  if (N > 0) {
    const padX = Math.min(38, Math.max(24, zone.width * 0.12));
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

    matchedFiles.forEach((file, idx) => {
      let col: number;
      let row: number;

      if (isVerticalStrip) {
        // Dikey alanlarda (örn. sağ köşe sütunları) yukarıdan aşağıya sütun sütun diz
        row = idx % rows;
        col = Math.floor(idx / rows);
      } else {
        // Yatay/kare alanlarda soldan sağa satır satır diz
        col = idx % cols;
        row = Math.floor(idx / cols);
      }

      const tx = Math.min(canvasW - 36, Math.max(36, Math.round(innerX + col * stepX)));
      const ty = Math.min(canvasH - 52, Math.max(34, Math.round(innerY + row * stepY)));
      updatedTargets[file.id] = { x: tx, y: ty };
    });
  }

  // 2. Seçilen kutunun içinde kalan ama eşleşmeyen dosyaları kutunun dışındaki boş yuvalara çıkar
  const margin = 24;
  const isInsideZone = (x: number, y: number) =>
    x >= zone.x - margin &&
    x <= zone.x + zone.width + margin &&
    y >= zone.y - margin &&
    y <= zone.y + zone.height + margin;

  // Halihazırda dolu olan tüm noktaları topla
  const occupiedPoints: Array<{ x: number; y: number }> = [];
  allFiles.forEach(f => {
    if (matchedIds.has(f.id)) {
      if (updatedTargets[f.id]) occupiedPoints.push(updatedTargets[f.id]);
      return;
    }
    const pos = updatedTargets[f.id] || currentPositions.get(f.id);
    if (pos && !isInsideZone(pos.x, pos.y)) {
      occupiedPoints.push(pos);
    }
  });

  // Masaüstündeki tüm olası standart ızgara yuvalarını oluştur (seçili kutunun dışında kalanlar)
  const candidateSlots: Array<{ x: number; y: number }> = [];
  const maxCols = Math.max(1, Math.floor((canvasW - 70) / 76));
  const maxRows = 10;
  const startY = 34;
  const stepY = Math.min(98, Math.floor((canvasH - 90) / maxRows));

  for (let c = 0; c < maxCols; c++) {
    for (let r = 0; r < maxRows; r++) {
      const sx = 38 + c * 76;
      const sy = startY + r * stepY;
      if (!isInsideZone(sx, sy)) {
        candidateSlots.push({ x: sx, y: sy });
      }
    }
  }

  allFiles.forEach(file => {
    if (matchedIds.has(file.id)) return;
    const cur = updatedTargets[file.id] || currentPositions.get(file.id);
    if (!cur) return;

    if (isInsideZone(cur.x, cur.y)) {
      // Bu dosya seçili alanın içinde ama istenen tipte değil -> en yakın boş yuvaya taşı
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
        updatedTargets[file.id] = bestSlot;
        occupiedPoints.push(bestSlot);
      }
    }
  });

  return updatedTargets;
}
