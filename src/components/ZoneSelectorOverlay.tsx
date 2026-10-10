import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import {
  ZONE_PRESETS,
  ZoneRect,
  CustomZone,
  ZONE_COLOR_THEMES,
  matchFilesByCustomRequest,
} from '../services/zoneOrganizer';
import { Sparkles, X, Crosshair, RotateCcw, CheckCircle2, Plus, Check } from 'lucide-react';

interface ZoneSelectorOverlayProps {
  isOpen: boolean;
  files: FileItem[];
  activeZones: CustomZone[];
  onClose: () => void;
  onUpdateZones: (newZones: CustomZone[]) => void;
}

export const ZoneSelectorOverlay: React.FC<ZoneSelectorOverlayProps> = ({
  isOpen,
  files,
  activeZones,
  onClose,
  onUpdateZones,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [currentPt, setCurrentPt] = useState<{ x: number; y: number } | null>(null);
  const [finalZone, setFinalZone] = useState<ZoneRect | null>(null);
  const [promptText, setPromptText] = useState<string>('Buraya sadece oyunları koy');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sıradaki yeni alanın rengi: daha önce seçilenlerle karışmaması için renk döngüsünden seçilir
  const nextColorIndex = activeZones.length % ZONE_COLOR_THEMES.length;
  const nextColorTheme = ZONE_COLOR_THEMES[nextColorIndex];

  useEffect(() => {
    if (isOpen) {
      setIsDragging(false);
      setStartPt(null);
      setCurrentPt(null);
      setFinalZone(null);
      // Hazır öneri: daha önce oyun seçilmişse klasör öner, vb.
      if (activeZones.length === 0) {
        setPromptText('Buraya sadece oyunları koy');
      } else if (activeZones.length === 1) {
        setPromptText('Buraya sadece klasörleri koy');
      } else if (activeZones.length === 2) {
        setPromptText('Buraya sadece arşivleri koy');
      } else {
        setPromptText('Buraya sadece jar ve kod dosyalarını koy');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (finalZone) {
          setFinalZone(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, finalZone, onClose]);

  useEffect(() => {
    if (finalZone && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [finalZone]);

  if (!isOpen) return null;

  const activeRect: ZoneRect | null = (() => {
    if (isDragging && startPt && currentPt) {
      const x = Math.min(startPt.x, currentPt.x);
      const y = Math.min(startPt.y, currentPt.y);
      const width = Math.abs(currentPt.x - startPt.x);
      const height = Math.abs(currentPt.y - startPt.y);
      return { x, y, width, height };
    }
    return finalZone;
  })();

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Açılan diyalog veya butonlara tıklandıysa yeni kutu çizimini tetikleme
    if ((e.target as HTMLElement).closest('[data-zone-interactive="true"]')) {
      return;
    }
    setFinalZone(null);
    setIsDragging(true);
    setStartPt({ x: e.clientX, y: e.clientY });
    setCurrentPt({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setCurrentPt({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isDragging || !startPt || !currentPt) return;
    setIsDragging(false);
    const x = Math.min(startPt.x, currentPt.x);
    const y = Math.min(startPt.y, currentPt.y);
    const width = Math.abs(currentPt.x - startPt.x);
    const height = Math.abs(currentPt.y - startPt.y);

    // En az 150x160 boyutunda anlamlı bir kutu oluştur
    const finalW = Math.max(150, width);
    const finalH = Math.max(160, height);
    const clampedX = Math.min(window.innerWidth - finalW - 16, Math.max(16, x));
    const clampedY = Math.min(window.innerHeight - finalH - 48, Math.max(16, y));

    setFinalZone({
      x: clampedX,
      y: clampedY,
      width: finalW,
      height: finalH,
    });
  };

  const { matched, label } = matchFilesByCustomRequest(files, promptText);

  // Yeni alanı ekle ve listeye dahil et (Ekrandan silinmez, bir sonraki alanı seçmeye hazır kalır)
  const handleAddZone = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!finalZone || matched.length === 0) return;

    const newZone: CustomZone = {
      id: `zone_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: finalZone.x,
      y: finalZone.y,
      width: finalZone.width,
      height: finalZone.height,
      prompt: promptText,
      label: label,
      colorIndex: nextColorIndex,
      colorTheme: nextColorTheme,
      matchedCount: matched.length,
      matchedFileIds: matched.map(f => f.id),
    };

    const updatedZones = [...activeZones, newZone];
    onUpdateZones(updatedZones);
    setFinalZone(null); // Diyaloğu kapat, overlay açık kalsın ve yeni alan seçilebilir olsun
  };

  const handleDeleteZone = (zoneId: string) => {
    const updated = activeZones.filter(z => z.id !== zoneId);
    onUpdateZones(updated);
  };

  // Diyalog kutusunun ekran dışına taşmaması için akıllı konumlandırma
  const getDialogStyle = (): React.CSSProperties => {
    if (!finalZone) return {};
    const dialogW = 340;
    const dialogH = 300;
    const W = window.innerWidth || 1920;
    const H = window.innerHeight || 1080;

    let left = finalZone.x + finalZone.width + 14;
    if (left + dialogW > W - 16) {
      left = finalZone.x - dialogW - 14;
    }
    if (left < 16) {
      left = Math.max(16, Math.min(W - dialogW - 16, finalZone.x + (finalZone.width - dialogW) / 2));
    }

    let top = finalZone.y;
    if (top + dialogH > H - 24) {
      top = Math.max(16, H - dialogH - 24);
    }

    return { left, top, width: dialogW };
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="pointer-events-auto fixed inset-0 z-50 cursor-crosshair select-none bg-slate-950/25 backdrop-blur-[1.5px] transition-opacity"
    >
      {/* ── 1. ÜST KONTROL & BİLGİ DOCK'U ── */}
      <div
        data-zone-interactive="true"
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 glass-dock rounded-2xl text-xs text-white shadow-2xl cursor-default max-w-[92vw] overflow-x-auto"
      >
        <div className="flex items-center gap-2 shrink-0">
          <Crosshair className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold text-white text-[12px]">
            {activeZones.length === 0 ? 'Alan Seçimi' : `${activeZones.length} Özel Alan Aktif`}
          </span>
        </div>

        {/* Tanımlanmış Mevcut Alanların Küçük Çiğleri */}
        {activeZones.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 border-l border-white/15 pl-2.5">
            {activeZones.map((z, idx) => {
              const th = z.colorTheme || ZONE_COLOR_THEMES[z.colorIndex % ZONE_COLOR_THEMES.length];
              return (
                <div
                  key={z.id}
                  style={{
                    backgroundColor: th.bgFill,
                    borderColor: th.border,
                    color: th.badgeText,
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold whitespace-nowrap shadow-sm"
                >
                  <span>{idx + 1}. {z.label} ({z.matchedCount})</span>
                  <button
                    onClick={() => handleDeleteZone(z.id)}
                    className="p-0.5 hover:bg-white/20 rounded-md cursor-pointer transition-colors"
                    title="Bu Alanı Sil"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2 border-l border-white/15 pl-2.5 shrink-0">
          {/* Sıradaki Alanın Renk Belirteci */}
          <div className="flex items-center gap-1 text-[11px] text-slate-300">
            <span
              style={{ backgroundColor: nextColorTheme.primary }}
              className="w-2.5 h-2.5 rounded-full inline-block animate-pulse shadow-sm"
            />
            <span className="hidden sm:inline">Yeni Alan: {nextColorTheme.name}</span>
          </div>

          {/* Tamamla Butonu */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 hover:from-emerald-500 hover:to-emerald-600 border border-white/25 text-white text-[11px] font-bold shadow-lg shadow-emerald-500/30 cursor-pointer transition-all"
            title="Seçimleri Onayla ve Masaüstüne Dön"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tamamla</span>
          </button>

          {/* Kapat Butonu */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-icon-btn text-slate-300 hover:text-white cursor-pointer"
            title="Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. DAHA ÖNCE ONAYLANMIŞ TÜM ALANLAR (SİLİNMEDEN EKRANDA GÖRÜNÜR KALIR) ── */}
      {activeZones.map((zone, idx) => {
        const theme = zone.colorTheme || ZONE_COLOR_THEMES[zone.colorIndex % ZONE_COLOR_THEMES.length];
        return (
          <div
            key={zone.id}
            data-zone-interactive="true"
            style={{
              left: zone.x,
              top: zone.y,
              width: zone.width,
              height: zone.height,
              borderColor: theme.border,
              backgroundColor: theme.bgFill,
              boxShadow: `0 0 25px ${theme.badgeGlow}, inset 0 0 15px ${theme.bgFill}`,
            }}
            className="absolute rounded-2xl border-2 border-dashed transition-all cursor-default"
          >
            {/* Üst Alan Etiketi (Kullanıcının isteği: üzerinde ne koy dediğim yazsın) */}
            <div
              style={{
                backgroundColor: theme.badgeBg,
                borderColor: theme.badgeBorder,
                color: theme.badgeText,
              }}
              className="absolute -top-7 left-2 flex items-center gap-2 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold shadow-lg whitespace-nowrap"
            >
              <span>🎯 {idx + 1}. {zone.label} ({zone.matchedCount})</span>
              <button
                onClick={() => handleDeleteZone(zone.id)}
                className="p-0.5 hover:bg-white/20 rounded cursor-pointer transition-colors"
                title="Bu Alanı Kaldır"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Boyut Bilgisi */}
            <div
              style={{ color: theme.badgeText }}
              className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/80 border border-white/10 text-[9px] font-mono"
            >
              {Math.round(zone.width)} × {Math.round(zone.height)} px
            </div>
          </div>
        );
      })}

      {/* ── 3. ŞU ANDA ÇİZİLMEKTE OLAN SELECTION BOX (FARKLI SIRADAKİ RENK İLE) ── */}
      {activeRect && (
        <div
          style={{
            left: activeRect.x,
            top: activeRect.y,
            width: activeRect.width,
            height: activeRect.height,
            borderColor: nextColorTheme.primary,
            backgroundColor: nextColorTheme.bgFill,
            boxShadow: `0 0 35px ${nextColorTheme.badgeGlow}, inset 0 0 20px ${nextColorTheme.bgFill}`,
          }}
          className="absolute rounded-2xl border-2 pointer-events-none"
        >
          {/* Köşe Tutamaçları */}
          <span
            style={{ backgroundColor: nextColorTheme.secondary }}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-sm border border-slate-900 shadow"
          />
          <span
            style={{ backgroundColor: nextColorTheme.secondary }}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-sm border border-slate-900 shadow"
          />
          <span
            style={{ backgroundColor: nextColorTheme.secondary }}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-sm border border-slate-900 shadow"
          />
          <span
            style={{ backgroundColor: nextColorTheme.secondary }}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm border border-slate-900 shadow"
          />

          {/* Boyut Etiketi */}
          <div
            style={{
              backgroundColor: nextColorTheme.badgeBg,
              borderColor: nextColorTheme.badgeBorder,
              color: nextColorTheme.badgeText,
            }}
            className="absolute -top-6 left-2 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold"
          >
            {activeZones.length + 1}. Alan ({nextColorTheme.name}): {Math.round(activeRect.width)} × {Math.round(activeRect.height)} px
          </div>
        </div>
      )}

      {/* ── 4. SEÇİM TAMAMLANDIĞINDA AÇILAN ÖZEL İSTEK KARTI ── */}
      {finalZone && (
        <div
          data-zone-interactive="true"
          style={getDialogStyle()}
          className="absolute p-3.5 glass-dock rounded-2xl flex flex-col gap-3 text-slate-100 cursor-default menu-popover menu-popover-open border-2"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <div
                style={{ backgroundColor: nextColorTheme.primary }}
                className="w-6 h-6 rounded-lg border border-white/30 flex items-center justify-center shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3
                  style={{ color: nextColorTheme.badgeText }}
                  className="text-xs font-bold leading-tight"
                >
                  {activeZones.length + 1}. Alan İsteği ({nextColorTheme.name})
                </h3>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Bu alana hangi dosyaların dizileceğini yazın
                </p>
              </div>
            </div>
            <button
              onClick={() => setFinalZone(null)}
              className="p-1 rounded-lg glass-icon-btn text-slate-300 hover:text-white cursor-pointer"
              title="Alanı Yeniden Çiz"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Doğal Dil İstek Girişi */}
          <form onSubmit={handleAddZone} className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="text"
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="Örn: Buraya sadece oyunları koy..."
              style={{
                borderColor: nextColorTheme.badgeBorder,
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border focus:outline-none text-xs text-white placeholder-slate-400 font-medium shadow-inner"
            />

            {/* Hızlı Hazır İstek Çipleri */}
            <div className="flex flex-wrap gap-1">
              {ZONE_PRESETS.map(preset => {
                const isSelected = promptText.toLowerCase() === preset.prompt.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPromptText(preset.prompt)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: nextColorTheme.bgFill,
                            borderColor: nextColorTheme.border,
                            color: nextColorTheme.badgeText,
                          }
                        : undefined
                    }
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'border shadow-sm font-bold'
                        : 'glass-pill text-slate-300 hover:text-white'
                    }`}
                  >
                    {preset.emoji} {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Eşleşen Dosya Sayısı Özeti */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CheckCircle2
                  style={{ color: matched.length > 0 ? nextColorTheme.primary : '#fbbf24' }}
                  className="w-3.5 h-3.5"
                />
                <span>Kategori: <strong style={{ color: nextColorTheme.badgeText }}>{label}</strong></span>
              </span>
              <span className="font-mono font-bold text-white">
                {matched.length} öğe bulundu
              </span>
            </div>

            {/* Ekle ve İptal Butonları */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFinalZone(null)}
                className="glass-btn px-3 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={matched.length === 0}
                style={{
                  background: `linear-gradient(135deg, ${nextColorTheme.primary}, #2563eb)`,
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-lg transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Bu Alanı Ekle & Diz ({matched.length})</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
