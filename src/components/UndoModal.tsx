import React from 'react';
import { UndoSession } from '../types';
import { X, RotateCcw, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';

interface UndoModalProps {
  isOpen: boolean;
  onClose: () => void;
  undoSessions: UndoSession[];
  onConfirmRevert: (session: UndoSession) => void;
  isReverting: boolean;
}

export const UndoModal: React.FC<UndoModalProps> = ({
  isOpen,
  onClose,
  undoSessions,
  onConfirmRevert,
  isReverting,
}) => {
  if (!isOpen) return null;

  const latestSession = undoSessions[undoSessions.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none">
      <div className="glass-modal-panel rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Başlık */}
        <div className="px-6 py-4 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Temizliği Geri Al (Undo)</h2>
              <p className="text-xs text-slate-300">
                Son temizlik işleminde taşınan dosyaları masaüstü ana dizinine güvenle geri getirin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-icon-btn text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bilgilendirme */}
        <div className="p-4 bg-amber-500/5 border-b border-slate-800 flex items-start gap-3 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong>Güvenli Geri Alma Garantisi:</strong> Yalnızca Cleanfy tarafından taşınan dosyalar geri alınır. Orijinal konumda aynı isimde yeni bir dosya varsa asla üzerine yazılmaz, güvenli bir şekilde korunur.
          </div>
        </div>

        {/* Taşınan Dosyaların Listesi */}
        <div className="flex-1 overflow-y-auto p-4">
          {!latestSession || latestSession.items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Geri alınabilecek kayıtlı bir işlem oturumu bulunamadı.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-slate-400 mb-1">
                Geri Getirilecek Dosyalar ({latestSession.items.length} adet):
              </div>
              <div className="divide-y divide-slate-800/80 bg-slate-900/60 rounded-xl border border-slate-800 p-2">
                {latestSession.items.map((item, index) => (
                  <div key={index} className="py-2 px-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-200 truncate flex-1" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <span className="text-cyan-400 truncate max-w-[140px]">{item.category}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-emerald-400">Masaüstü</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alt Butonlar */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => latestSession && onConfirmRevert(latestSession)}
            disabled={!latestSession || latestSession.items.length === 0 || isReverting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isReverting ? 'animate-spin' : ''}`} />
            <span>{isReverting ? 'Geri Alınıyor...' : 'Değişiklikleri Geri Al'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
