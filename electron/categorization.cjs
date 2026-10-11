/**
 * Türkçe Akıllı Masaüstü Robot Süpürgesi - Kategorilendirme Motoru
 * Kurallar, uzantılar ve akıllı sezgisel eşleştirmeler
 */

const CATEGORIES = {
  PHOTOS: 'Fotoğraflar ve Görseller',
  VIDEOS: 'Videolar',
  MUSIC: 'Müzikler ve Sesler',
  DOCUMENTS: 'Belgeler',
  SOFTWARE: 'Yazılımlar ve Kurulum Dosyaları',
  ARCHIVES: 'Sıkıştırılmış Dosyalar',
  CODE: 'Yazılım ve Kod Projeleri',
  DESIGN: 'Tasarım ve Çizim Dosyaları',
  GAMES: 'Oyunlar ve Oyun Kısayolları',
  INTERNET: 'İnternet Kısayolları',
  BACKUP: 'Yedekleme Dosyaları',
  TEMP: 'Geçici ve İncelenecek Dosyalar',
  OTHER: 'Diğer Dosyalar',
};

const SUBCATEGORIES = {
  // Belgeler alt kategorileri
  DOC_PDF: 'PDF Belgeleri',
  DOC_WORD: 'Word Belgeleri',
  DOC_SHEETS: 'Tablolar ve Hesaplamalar',
  DOC_TEXT: 'Metin Dosyaları',
  DOC_OTHER: 'Diğer Belgeler',

  // Kod alt kategorileri
  CODE_PYTHON: 'Python Projeleri',
  CODE_WEB: 'Web Projeleri',
  CODE_JAVA: 'Java Projeleri',
  CODE_OTHER: 'Diğer Kod Dosyaları',
};

// Uzantı haritası
const EXTENSION_MAP = {
  // Görseller
  jpg: { category: CATEGORIES.PHOTOS },
  jpeg: { category: CATEGORIES.PHOTOS },
  png: { category: CATEGORIES.PHOTOS },
  webp: { category: CATEGORIES.PHOTOS },
  gif: { category: CATEGORIES.PHOTOS },
  bmp: { category: CATEGORIES.PHOTOS },
  tiff: { category: CATEGORIES.PHOTOS },
  tif: { category: CATEGORIES.PHOTOS },
  ico: { category: CATEGORIES.PHOTOS },
  heic: { category: CATEGORIES.PHOTOS },
  raw: { category: CATEGORIES.PHOTOS },
  cr2: { category: CATEGORIES.PHOTOS },
  nef: { category: CATEGORIES.PHOTOS },

  // Videolar
  mp4: { category: CATEGORIES.VIDEOS },
  mkv: { category: CATEGORIES.VIDEOS },
  mov: { category: CATEGORIES.VIDEOS },
  avi: { category: CATEGORIES.VIDEOS },
  webm: { category: CATEGORIES.VIDEOS },
  wmv: { category: CATEGORIES.VIDEOS },
  flv: { category: CATEGORIES.VIDEOS },
  m4v: { category: CATEGORIES.VIDEOS },
  mpeg: { category: CATEGORIES.VIDEOS },
  mpg: { category: CATEGORIES.VIDEOS },

  // Müzik ve Ses
  mp3: { category: CATEGORIES.MUSIC },
  wav: { category: CATEGORIES.MUSIC },
  flac: { category: CATEGORIES.MUSIC },
  aac: { category: CATEGORIES.MUSIC },
  ogg: { category: CATEGORIES.MUSIC },
  m4a: { category: CATEGORIES.MUSIC },
  wma: { category: CATEGORIES.MUSIC },
  mid: { category: CATEGORIES.MUSIC },
  midi: { category: CATEGORIES.MUSIC },

  // Belgeler (Alt kategorili)
  pdf: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_PDF },
  doc: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_WORD },
  docx: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_WORD },
  odt: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_WORD },
  
  xls: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_SHEETS },
  xlsx: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_SHEETS },
  csv: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_SHEETS },
  ods: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_SHEETS },
  tsv: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_SHEETS },

  txt: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_TEXT },
  md: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_TEXT },
  rtf: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_TEXT },
  log: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_TEXT },

  ppt: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_OTHER },
  pptx: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_OTHER },
  odp: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_OTHER },
  epub: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_OTHER },
  mobi: { category: CATEGORIES.DOCUMENTS, subcategory: SUBCATEGORIES.DOC_OTHER },

  // Yazılımlar ve Kurulum
  exe: { category: CATEGORIES.SOFTWARE },
  msi: { category: CATEGORIES.SOFTWARE },
  msix: { category: CATEGORIES.SOFTWARE },
  bat: { category: CATEGORIES.SOFTWARE },
  cmd: { category: CATEGORIES.SOFTWARE },
  ps1: { category: CATEGORIES.SOFTWARE },
  iso: { category: CATEGORIES.SOFTWARE },
  img: { category: CATEGORIES.SOFTWARE },
  vhd: { category: CATEGORIES.SOFTWARE },

  // Sıkıştırılmış
  zip: { category: CATEGORIES.ARCHIVES },
  rar: { category: CATEGORIES.ARCHIVES },
  '7z': { category: CATEGORIES.ARCHIVES },
  tar: { category: CATEGORIES.ARCHIVES },
  gz: { category: CATEGORIES.ARCHIVES },
  bz2: { category: CATEGORIES.ARCHIVES },
  xz: { category: CATEGORIES.ARCHIVES },
  tgz: { category: CATEGORIES.ARCHIVES },

  // Kod Projeleri (Alt kategorili)
  py: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_PYTHON },
  pyw: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_PYTHON },
  ipynb: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_PYTHON },

  html: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  htm: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  css: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  scss: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  sass: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  js: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  jsx: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  ts: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  tsx: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  json: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  xml: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  vue: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },
  svelte: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_WEB },

  java: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_JAVA },
  jar: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_JAVA },
  class: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_JAVA },

  c: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  cpp: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  h: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  hpp: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  cs: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  rs: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  go: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  php: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  rb: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  sql: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  sh: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  yaml: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },
  yml: { category: CATEGORIES.CODE, subcategory: SUBCATEGORIES.CODE_OTHER },

  // Tasarım ve Çizim
  psd: { category: CATEGORIES.DESIGN },
  ai: { category: CATEGORIES.DESIGN },
  blend: { category: CATEGORIES.DESIGN },
  svg: { category: CATEGORIES.DESIGN },
  xd: { category: CATEGORIES.DESIGN },
  fig: { category: CATEGORIES.DESIGN },
  sketch: { category: CATEGORIES.DESIGN },
  cdr: { category: CATEGORIES.DESIGN },
  dwg: { category: CATEGORIES.DESIGN },
  dxf: { category: CATEGORIES.DESIGN },

  // Oyun ve Mod Dosyaları
  mrpack: { category: CATEGORIES.GAMES },
  mcworld: { category: CATEGORIES.GAMES },
  mcpack: { category: CATEGORIES.GAMES },
  mcaddon: { category: CATEGORIES.GAMES },
  mctemplate: { category: CATEGORIES.GAMES },
  schem: { category: CATEGORIES.GAMES },
  schematic: { category: CATEGORIES.GAMES },
  litematic: { category: CATEGORIES.GAMES },
  nbt: { category: CATEGORIES.GAMES },
  jem: { category: CATEGORIES.GAMES },
  jpm: { category: CATEGORIES.GAMES },
  rom: { category: CATEGORIES.GAMES },

  // İnternet Kısayolları
  url: { category: CATEGORIES.INTERNET },
  webloc: { category: CATEGORIES.INTERNET },
  website: { category: CATEGORIES.INTERNET },

  // Yedekleme
  bak: { category: CATEGORIES.BACKUP },
  old: { category: CATEGORIES.BACKUP },
  backup: { category: CATEGORIES.BACKUP },
  dump: { category: CATEGORIES.BACKUP },
  orig: { category: CATEGORIES.BACKUP },
  sav: { category: CATEGORIES.BACKUP },

  // Geçici
  tmp: { category: CATEGORIES.TEMP },
  temp: { category: CATEGORIES.TEMP },
  crdownload: { category: CATEGORIES.TEMP },
  part: { category: CATEGORIES.TEMP },
};

/**
 * Dosya adı ve uzantısına göre akıllı kategori tespiti
 * @param {string} filename 
 * @returns {{ category: string, subcategory?: string, targetRelativePath: string, confidence: number }}
 */
function categorizeFile(filename) {
  const lowerName = filename.toLowerCase();

  const softwareExceptions = [
    'visual studio', 'vscode', 'intellij', 'pycharm', 'webstorm', 'sublime', 'notepad',
    'photoshop', 'illustrator', 'premiere', 'blender', 'aseprite', 'wallpaper engine',
    'obs studio', 'discord', 'telegram', 'spotify', 'chrome', 'firefox', 'edge', 'brave', 'opera'
  ];
  if (softwareExceptions.some(sw => lowerName.includes(sw))) {
    if (lowerName.includes('aseprite') || lowerName.includes('photoshop') || lowerName.includes('illustrator') || lowerName.includes('blender')) {
      return {
        category: CATEGORIES.DESIGN,
        targetRelativePath: CATEGORIES.DESIGN,
        confidence: 0.95,
      };
    }
    return {
      category: CATEGORIES.SOFTWARE,
      targetRelativePath: CATEGORIES.SOFTWARE,
      confidence: 0.95,
    };
  }

  const gameKeywords = [
    'oyun', 'game', 'steam', 'epic', 'riot', 'valorant', 'minecraft', 'roblox', 'gta',
    'witcher', 'counter-strike', 'csgo', 'cs2', 'fifa', 'pes', 'pubg', 'league of legends',
    'lol', 'battle.net', 'origin', 'ubisoft', 'modrinth', 'curseforge', 'lunar', 'feather',
    'badlion', 'tlauncher', 'cyberpunk', 'stardew', 'chivalry', 'rounds', 'goose', 'soccer',
    'peak', 'how to fish', 'battle golf', 'hackhub', 'aniimo', 'dota', 'apex', 'fortnite',
    'genshin', 'star rail', 'honkai', 'warzone', 'call of duty', 'rust', 'palworld',
    'boatrace', 'blokoyun'
  ];

  // Kısayollar (.lnk veya .url) için akıllı kontrol: Oyun mu, Uygulama mı, İnternet mi?
  if (lowerName.endsWith('.lnk') || lowerName.endsWith('.url')) {
    const isGame = gameKeywords.some(kw => lowerName.includes(kw));
    if (isGame) {
      return {
        category: CATEGORIES.GAMES,
        targetRelativePath: CATEGORIES.GAMES,
        confidence: 0.95,
      };
    }

    if (lowerName.endsWith('.url')) {
      const nonGameSites = ['google', 'youtube', 'facebook', 'twitter', 'instagram', 'linkedin', 'github', 'e-devlet', 'edevlet'];
      if (!nonGameSites.some(site => lowerName.includes(site))) {
        // Windows masaüstündeki Steam / Epic / bağımsız oyun URL kısayolları
        return {
          category: CATEGORIES.GAMES,
          targetRelativePath: CATEGORIES.GAMES,
          confidence: 0.90,
        };
      }
      return {
        category: CATEGORIES.INTERNET,
        targetRelativePath: CATEGORIES.INTERNET,
        confidence: 0.85,
      };
    }

    // Genel yazılım kısayolu
    return {
      category: CATEGORIES.SOFTWARE,
      targetRelativePath: CATEGORIES.SOFTWARE,
      confidence: 0.85,
    };
  }

  // Uzantıyı bul
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === filename.length - 1) {
    // Uzantısız dosya -> Geçici ve İncelenecek
    return {
      category: CATEGORIES.TEMP,
      targetRelativePath: CATEGORIES.TEMP,
      confidence: 0.5,
    };
  }

  const ext = filename.slice(dotIndex + 1).toLowerCase();
  const rule = EXTENSION_MAP[ext];

  if (!rule) {
    return {
      category: CATEGORIES.OTHER,
      targetRelativePath: CATEGORIES.OTHER,
      confidence: 0.7,
    };
  }

  if (rule.subcategory) {
    return {
      category: rule.category,
      subcategory: rule.subcategory,
      targetRelativePath: `${rule.category}\\${rule.subcategory}`,
      confidence: 0.98,
    };
  }

  return {
    category: rule.category,
    targetRelativePath: rule.category,
    confidence: 0.98,
  };
}

module.exports = {
  CATEGORIES,
  SUBCATEGORIES,
  EXTENSION_MAP,
  categorizeFile,
};
