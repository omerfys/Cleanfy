import React, { useState, useEffect, useRef } from 'react';
import { FileItem } from '../types';
import { ZONE_PRESETS, ZoneRect, matchFilesByCustomRequest } from '../services/zoneOrganizer';
import { Sparkles, X, Crosshair, RotateCcw, CheckCircle2 } from 'lucide-react';

interface ZoneSelectorOverlayProps {
  isOpen: boolean;
  files: FileItem[];
  onClose: () => void;
  onApplyZone: (zone: ZoneRect, matchedFiles: FileItem[], label: string) => void;
}

export const ZoneSelectorOverlay: React.FC<ZoneSelectorOverlayProps> = ({
  isOpen,
  files,
  onClose,
  onApplyZone,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [currentPt, setCurrentPt] = useState<{ x: number; y: number } | null>(null);
  const [finalZone, setFinalZone] = useState<ZoneRect | null>(null);
  const [promptText, setPromptText] = useState<string>('Buraya sadece oyunları koy');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsDragging(false);
      setStartPt(null);
      setCurrentPt(null);
      setFinalZone(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    // Eğer açılan kontrol kartının içine tıklandıysa yeni kutu çizimini başlatma
    if ((e.target as HTMLElement).closest('[data-zone-dialog="true"]')) {
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

    // Çok küçük tıklamaları en az 180x220 boyutunda anlamlı bir kutuya tamamla
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

  const handleConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!finalZone || matched.length === 0) return;
    onApplyZone(finalZone, matched, `${label} (${matched.length})`);
  };

  // Diyalog kutusunun ekran dışına taşmaması için akıllı konumlandırma
  const getDialogStyle = (): React.CSSProperties => {
    if (!finalZone) return {};
    const dialogW = 340;
    const dialogH = 290;
    const W = window.innerWidth || 1920;
    const H = window.innerHeight || 1080;

    // Önce kutunun soluna veya sağına koymayı dene
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
      className="pointer-events-auto fixed inset-0 z-50 cursor-crosshair select-none bg-slate-950/20 backdrop-blur-[1px] transition-opacity"
    >
      {/* Üst Bilgi Çubuğu */}
      <div
        data-zone-dialog="true"
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 glass-dock rounded-full text-xs text-white shadow-2xl cursor-default"
      >
        <Crosshair className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span className="font-medium text-slate-100">
          {finalZone
            ? 'Seçili alana hangi dosyaların yerleştirileceğini yazın veya seçin'
            : 'Masaüstünde düzenlemek istediğiniz alanı (Selection Box) fareyle sürükleyerek seçin'}
        </span>
        <button
          onClick={onClose}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full glass-icon-btn hover:!bg-red-500/30 text-[11px] text-slate-200 hover:text-white cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>İptal</span>
        </button>
      </div>

      {/* Çizilen Selection Box */}
      {activeRect && (
        <div
          style={{
            left: activeRect.x,
            top: activeRect.y,
            width: activeRect.width,
            height: activeRect.height,
          }}
          className="absolute rounded-2xl border-2 border-cyan-400 bg-cyan-500/15 shadow-[0_0_35px_rgba(6,182,212,0.3),inset_0_0_20px_rgba(6,182,212,0.15)] pointer-events-none"
        >
          {/* Köşe Tutamaçları */}
          <span className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-sm bg-cyan-300 border border-slate-900 shadow" />
          <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-sm bg-cyan-300 border border-slate-900 shadow" />
          <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-sm bg-cyan-300 border border-slate-900 shadow" />
          <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm bg-cyan-300 border border-slate-900 shadow" />

          {/* Boyut Etiketi */}
          <div className="absolute -top-6 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 border border-cyan-400/40 text-[10px] font-mono text-cyan-300">
            {Math.round(activeRect.width)} × {Math.round(activeRect.height)} px
          </div>
        </div>
      )}

      {/* Seçim Tamamlandığında Açılan Glassmorphism Özel İstek Kartı */}
      {finalZone && (
        <div
          data-zone-dialog="true"
          style={getDialogStyle()}
          className="absolute p-3.5 glass-dock rounded-2xl flex flex-col gap-3 text-slate-100 cursor-default menu-popover menu-popover-open"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500/80 to-blue-600/80 border border-white/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">Özel Alan İsteği</h3>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Seçili bölgeye sadece istediğiniz dosyaları dizer
                </p>
              </div>
            </div>
            <button
              onClick={() => setFinalZone(null)}
              className="p-1 rounded-lg glass-icon-btn text-slate-300 hover:text-white"
              title="Alanı Yeniden Çiz"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Doğal Dil İstek Girişi */}
          <form onSubmit={handleConfirm} className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="text"
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="Örn: Buraya sadece oyunları koy..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/60 border border-cyan-400/40 focus:border-cyan-300 focus:outline-none text-xs text-white placeholder-slate-400 font-medium shadow-inner"
            />

            {/* Hızlı Hazır İstek Etiketleri */}
            <div className="flex flex-wrap gap-1">
              {ZONE_PRESETS.map(preset => {
                const isSelected = promptText.toLowerCase() === preset.prompt.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPromptText(preset.prompt)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/60 shadow-sm'
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
                <CheckCircle2 className={`w-3.5 h-3.5 ${matched.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                <span>Kategori: <strong className="text-cyan-300">{label}</strong></span>
              </span>
              <span className="font-mono font-bold text-white">
                {matched.length} öğe bulundu
              </span>
            </div>

            {/* Uygula / İptal Butonları */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="glass-btn px-3 py-1.5 rounded-xl text-slate-300 hover:text-white text-xs font-medium cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={matched.length === 0}
                className="glass-btn-primary flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-100" />
                <span>Seçili Alana Diz ({matched.length})</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
