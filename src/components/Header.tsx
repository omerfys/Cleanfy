import React from 'react';
import { Bot, Folder, Eye, Minus, Square, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  desktopPath: string;
  isOverlayActive: boolean;
  onToggleOverlay: () => void;
  onOpenDesktop: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  desktopPath,
  isOverlayActive,
  onToggleOverlay,
  onOpenDesktop,
}) => {
  const isOneDrive = desktopPath.toLowerCase().includes('onedrive');

  const handleMinimize = () => window.cleanfyApi?.minimizeWindow();
  const handleMaximize = () => window.cleanfyApi?.maximizeWindow();
  const handleClose = () => window.cleanfyApi?.closeWindow();

  return (
    <header className="h-16 px-6 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 select-none">
      {/* Sol: Logo ve Başlık */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Bot className="w-6 h-6 text-white animate-pulse-fast" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg text-white tracking-wide">Cleanfy</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Masaüstü Robot Süpürgesi
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Folder className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[11px] truncate max-w-[320px]" title={desktopPath}>
              {desktopPath || 'Masaüstü taranıyor...'}
            </span>
            {isOneDrive && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-medium">
                OneDrive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Orta: Güvenlik Garantisi Rozeti */}
      <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="font-medium">Sıfır Silme & SHA-256 Koruması Aktif</span>
      </div>

      {/* Sağ: Eylemler ve Pencere Kontrolleri */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenDesktop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700/60"
          title="Masaüstü Klasörünü Aç"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Masaüstü</span>
        </button>

        <button
          onClick={onToggleOverlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            isOverlayActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
          }`}
          title="Masaüstünün üzerinde şeffaf katmanda robotu dolaştır"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{isOverlayActive ? 'Şeffaf Katman: Açık' : 'Şeffaf Katman'}</span>
        </button>

        {/* Pencere Düğmeleri (Electron) */}
        <div className="flex items-center ml-2 border-l border-slate-800 pl-2">
          <button
            onClick={handleMinimize}
            className="w-8 h-8 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-8 rounded hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded hover:bg-red-500/80 hover:text-white flex items-center justify-center text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
