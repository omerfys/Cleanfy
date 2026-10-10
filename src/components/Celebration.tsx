import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CleaningStats } from '../types';
import { Bot, CheckCircle, ShieldCheck, FileText, Download, ExternalLink, X } from 'lucide-react';

interface CelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CleaningStats;
  onOpenReport: () => void;
  onExportReport: () => void;
  onOpenDesktop: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({
  isOpen,
  onClose,
  stats,
  onOpenReport,
  onExportReport,
  onOpenDesktop,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Coşkulu kutlama konfetisi patlat
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
        });
      } catch (e) {
        // Tarayıcı veya test ortamında sessizce geç
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none">
      <div className="glass-modal-panel rounded-3xl w-full max-w-lg p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden animate-bounce-subtle">
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl glass-icon-btn text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Robot İkonu ve Kutlama Başlığı */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 mb-4">
          <Bot className="w-9 h-9 text-white animate-pulse" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          Masaüstü Temizliği Tamamlandı!
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Masaüstündeki dosyaların Türkçe kategorilere düzenlenmesi başarıyla bitti.
        </p>

        {/* Özet Kutusu */}
        <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-4 mb-4 text-xs">
          <div className="grid grid-cols-2 gap-3 mb-3 text-left">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Taranan dosya:</span>
              <strong className="text-white font-bold">{stats.totalScanned}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Başarıyla taşınan:</span>
              <strong className="text-emerald-400 font-bold">{stats.moved}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Atlanan dosya:</span>
              <strong className="text-amber-400 font-bold">{stats.skipped}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Başarısız işlem:</span>
              <strong className="text-rose-400 font-bold">{stats.failed}</strong>
            </div>
          </div>

          <div className="flex justify-between items-center py-1.5 px-2 bg-slate-800/40 rounded-lg text-[11px]">
            <span className="text-slate-400">Oluşturulan Türkçe klasörler:</span>
            <strong className="text-cyan-400 font-bold">{stats.createdFolders.length} adet</strong>
          </div>
        </div>

        {/* Kesin Güvenlik Rozeti */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Hiçbir dosya silinmedi. İçerikler korundu.</span>
        </div>

        {/* Eylem Düğmeleri */}
        <div className="w-full grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenReport();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Ayrıntılı Rapor</span>
          </button>

          <button
            onClick={() => {
              onExportReport();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Raporu Dışa Aktar</span>
          </button>

          <button
            onClick={() => {
              onOpenDesktop();
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400" />
            <span>Masaüstünü Aç</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <span>Kapat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
