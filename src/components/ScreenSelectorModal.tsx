import React from 'react';
import { DisplayInfo } from '../types';
import { Monitor, Check, Sparkles, X, Layers, Cpu } from 'lucide-react';

interface ScreenSelectorModalProps {
  isOpen: boolean;
  displays: DisplayInfo[];
  currentDisplay: DisplayInfo | null;
  files?: Array<{ displayId?: number | null }>;
  onSelectDisplay: (displayId: number) => void;
  onClose: () => void;
}

export const ScreenSelectorModal: React.FC<ScreenSelectorModalProps> = ({
  isOpen,
  displays,
  currentDisplay,
  files = [],
  onSelectDisplay,
  onClose,
}) => {
  if (!isOpen) return null;

  // Monitörlerin göreceli min/max sınırlarını hesaplayarak görsel mini harita oluştur
  const minX = Math.min(...displays.map(d => d.bounds.x), 0);
  const maxX = Math.max(...displays.map(d => d.bounds.x + d.bounds.width), 1920);
  const totalSpanX = Math.max(maxX - minX, 1);
  const maxH = Math.max(...displays.map(d => d.bounds.height), 1080);

  return (
    <div
      data-zone-interactive="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl glass-card rounded-2xl p-6 shadow-2xl border border-white/20 text-white flex flex-col gap-5 overflow-hidden">
        {/* Dekoratif Işık Efekti */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Başlık ve Kapat Butonu */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Monitor className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Monitör & Masaüstü Seçimi
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {displays.length} Ekran
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Düzenlemek ve simgeleri yerleştirmek istediğiniz ekranı seçin
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg glass-icon-btn hover:!bg-red-500/20 hover:!border-red-400/30 text-slate-300 hover:text-white"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── GÖRSEL MONİTÖR YERLEŞİM DÜZENİ (Mini-Map) ── */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Fiziksel Monitör Düzeni (Tıklayarak Geçiş Yapın)
          </span>

          <div className="relative w-full h-32 rounded-xl bg-slate-900/80 border border-white/10 p-3 flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              {(() => {
                // Fiziksel sol-orta-sağ yerleşim sırası (Mini-harita düzeni)
                const physicallySorted = [...displays].sort((a, b) => a.bounds.x - b.bounds.x || a.bounds.y - b.bounds.y);
                const count = Math.max(displays.length, 1);
                const slotWidth = 100 / count;
                const relWidth = Math.max(26, slotWidth - 3);

                return displays.map((disp) => {
                  const isSelected = currentDisplay?.id === disp.id;
                  const fileCount = files.filter(f => f.displayId === disp.id).length;
                  const physicalIdx = physicallySorted.findIndex(d => d.id === disp.id);
                  const relLeft = (physicalIdx >= 0 ? physicalIdx : 0) * slotWidth + 1.5;
                  const relHeight = Math.max(50, (disp.bounds.height / maxH) * 85);

                  return (
                    <button
                      key={disp.id}
                      onClick={() => {
                        onSelectDisplay(disp.id);
                      }}
                      style={{
                        left: `${relLeft}%`,
                        width: `${relWidth}%`,
                        height: `${relHeight}%`,
                      }}
                      className={`absolute flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-400/40 z-10 scale-[1.02]'
                          : 'bg-slate-800/60 border-white/15 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Monitor className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                        <span className="font-bold text-[11px] leading-none">
                          Ekran {disp.index}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono opacity-80 mt-0.5">
                        {disp.bounds.width}×{disp.bounds.height}
                      </span>
                      <span className="text-[9px] font-semibold text-cyan-300 mt-0.5">
                        📄 {fileCount} Dosya
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* ── DETAYLI MONİTÖR KARTLARI LİSTESİ ── */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {[...displays].sort((a, b) => a.index - b.index).map((disp) => {
            const isSelected = currentDisplay?.id === disp.id;
            const fileCount = files.filter(f => f.displayId === disp.id).length;
            return (
              <div
                key={disp.id}
                onClick={() => onSelectDisplay(disp.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-white/10 hover:bg-slate-800/50 hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                        : 'bg-slate-800/80 border-white/10 text-slate-400'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">
                        Ekran {disp.index}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                        📄 {fileCount} Dosya
                      </span>
                      {disp.isPrimary && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-medium">
                          Ana Ekran
                        </span>
                      )}
                      {disp.positionHint && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-white/10">
                          {disp.positionHint} Monitör
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-300 mt-0.5">
                      {disp.name}
                      {disp.scaleFactor && disp.scaleFactor !== 1 ? ` (%${Math.round(disp.scaleFactor * 100)} ölçek)` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Aktif</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDisplay(disp.id);
                      }}
                      className="px-2.5 py-1 rounded-lg glass-btn text-cyan-300 hover:text-white text-[11px] font-semibold"
                    >
                      Buna Geç
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bilgilendirme Notu */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200">
          <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
          <span>
            Bir ekran seçtiğinizde robot süpürge tuvali o ekranın çözünürlüğüne uyarlanır.
            Seçim kutusuyla alan belirlediğinizde masaüstü simgeleri doğrudan o ekrandaki koordinatlara yerleştirilir.
          </span>
        </div>
      </div>
    </div>
  );
};
