import React from 'react';
import { CleaningMode } from '../types';
import { 
  Play, 
  Pause, 
  Square, 
  Search, 
  ListFilter, 
  FileText, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert,
  Sliders
} from 'lucide-react';

interface ControlPanelProps {
  mode: CleaningMode;
  onModeChange: (mode: CleaningMode) => void;
  isScanning: boolean;
  isCleaning: boolean;
  isPaused: boolean;
  hasScanData: boolean;
  hasReportData: boolean;
  hasUndoData: boolean;
  onScanDesktop: () => void;
  onStartCleaning: () => void;
  onTogglePause: () => void;
  onStopCleaning: () => void;
  onOpenPreview: () => void;
  onOpenReport: () => void;
  onOpenUndo: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  onModeChange,
  isScanning,
  isCleaning,
  isPaused,
  hasScanData,
  hasReportData,
  hasUndoData,
  onScanDesktop,
  onStartCleaning,
  onTogglePause,
  onStopCleaning,
  onOpenPreview,
  onOpenReport,
  onOpenUndo,
}) => {
  return (
    <div className="glass-dock p-4 rounded-3xl flex flex-col gap-4 select-none">
      {/* Butonlar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Masaüstünü Tara */}
          <button
            onClick={onScanDesktop}
            disabled={isCleaning || isScanning}
            className="glass-btn flex items-center gap-2 px-4 py-2 rounded-xl text-cyan-300 hover:text-cyan-100 text-xs font-semibold disabled:opacity-50"
          >
            <Search className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Taranıyor...' : 'Masaüstünü Tara'}</span>
          </button>

          {/* Temizliği Başlat / Duraklat / Durdur */}
          {!isCleaning ? (
            <button
              onClick={onStartCleaning}
              disabled={isScanning || !hasScanData}
              className="glass-btn-primary flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-cyan-100" />
              <span>Temizliği Başlat</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onTogglePause}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/80 to-amber-600/80 backdrop-blur-md border border-white/25 text-white text-xs font-semibold shadow-md shadow-amber-500/20 hover:from-amber-400/90 hover:to-amber-500/90 transition-all"
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Devam Et' : 'Duraklat'}</span>
              </button>

              <button
                onClick={onStopCleaning}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500/80 to-rose-600/80 backdrop-blur-md border border-white/25 text-white text-xs font-semibold shadow-md shadow-rose-500/20 hover:from-rose-400/90 hover:to-rose-500/90 transition-all"
              >
                <Square className="w-3.5 h-3.5" />
                <span>İşlemi Durdur</span>
              </button>
            </div>
          )}

          {/* Düzenleme Planını Gör */}
          <button
            onClick={onOpenPreview}
            disabled={!hasScanData}
            className="glass-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-200 hover:text-white text-xs font-medium disabled:opacity-50"
          >
            <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Düzenleme Planı</span>
          </button>
        </div>

        {/* Sağ: Rapor ve Geri Al */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReport}
            disabled={!hasReportData}
            className="glass-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-200 hover:text-white text-xs font-medium disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>İşlem Raporu</span>
          </button>

          <button
            onClick={onOpenUndo}
            disabled={!hasUndoData || isCleaning}
            className="glass-btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-amber-400 hover:text-amber-300 !border-amber-500/25 text-xs font-medium disabled:opacity-50"
            title="Son temizlikte taşınan dosyaları orijinal masaüstü konumuna geri getir"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Geri Al</span>
          </button>
        </div>
      </div>
    </div>
  );
};
