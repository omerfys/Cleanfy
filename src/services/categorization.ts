export const CATEGORIES = {
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
} as const;

export const ALL_CATEGORY_LIST = Object.values(CATEGORIES);

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  'Fotoğraflar ve Görseller': { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40', glow: '#f43f5e' },
  'Videolar': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40', glow: '#a855f7' },
  'Müzikler ve Sesler': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/40', glow: '#ec4899' },
  'Belgeler': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', glow: '#3b82f6' },
  'Yazılımlar ve Kurulum Dosyaları': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', glow: '#10b981' },
  'Sıkıştırılmış Dosyalar': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', glow: '#f59e0b' },
  'Yazılım ve Kod Projeleri': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40', glow: '#06b6d4' },
  'Tasarım ve Çizim Dosyaları': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/40', glow: '#6366f1' },
  'Oyunlar ve Oyun Kısayolları': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', glow: '#ef4444' },
  'İnternet Kısayolları': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40', glow: '#14b8a6' },
  'Yedekleme Dosyaları': { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/40', glow: '#64748b' },
  'Geçici ve İncelenecek Dosyalar': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', glow: '#f97316' },
  'Diğer Dosyalar': { bg: 'bg-zinc-500/20', text: 'text-zinc-300', border: 'border-zinc-500/40', glow: '#71717a' },
};
