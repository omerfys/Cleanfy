import React, { useState } from 'react';
import { FileItem } from '../types';
import { ALL_CATEGORY_LIST, CATEGORY_COLORS } from '../services/categorization';
import { CustomZone } from '../services/zoneOrganizer';
import { X, Check, CheckSquare, Square, FolderCheck, Play, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileItem[];
  activeZones?: CustomZone[];
  onUpdateFile: (fileId: string, updates: Partial<FileItem>) => void;
  onConfirmAndClean: () => void;
  onConfirmZonePlan?: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  files,
  activeZones,
  onUpdateFile,
  onConfirmAndClean,
  onConfirmZonePlan,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Tümü');

  if (!isOpen) return null;

  // Kategori bazlı dosya gruplaması
  const categoryGroups = files.reduce((acc, file) => {
    acc[file.category] = (acc[file.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCategories = Object.keys(categoryGroups);

  const filteredFiles = files.filter(f => {
    if (selectedCategoryFilter === 'Tümü') return true;
    return f.category === selectedCategoryFilter;
  });

  const includedCount = files.filter(f => !f.isExcluded).length;

  const handleToggleAllInCategory = (category: string, exclude: boolean) => {
    files.forEach(f => {
      if (f.category === category) {
        onUpdateFile(f.id, { isExcluded: exclude });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none">
      <div className="glass-modal-panel rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Başlık */}
        <div className="px-6 py-4 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderCheck className="w-5 h-5 text-cyan-400" />
              <span>Masaüstü Düzenleme Planı ve Önizleme</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Taranan dosyaları inceleyin, kategorileri özelleştirin ve taşımak istemediklerinizi hariç tutun.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-icon-btn text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Güvenlik Notu ve Kategori Filtre Çubuğu */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800/80 flex flex-col gap-3">
          {activeZones && activeZones.length > 0 && (
            <div className="flex items-center gap-2.5 px-3 py-2 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-transparent border border-cyan-500/30 rounded-xl text-cyan-200 text-xs">
              <span className="text-base shrink-0">🎯</span>
              <div className="flex-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Özel Alan Düzenleme Planı:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {activeZones.length} Alan Belirlendi
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] mt-0.5">
                  {activeZones.map(z => `${z.label} (${z.matchedCount} dosya)`).join(' • ')}
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5 font-medium">
                  Planı onayladığınızda dosyalarınız belirlediğiniz bu alanlara göre masaüstünde hizalanacaktır.
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              <strong>Güvenlik:</strong> Hiçbir dosya silinmez. Onayladığınızda dosyalar masaüstünüzün içindeki bu Türkçe klasörlere güvenle taşınır.
            </span>
          </div>

          {/* Kategori Hapları (Pills) */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategoryFilter('Tümü')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedCategoryFilter === 'Tümü'
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({files.length})
            </button>
            {activeCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedCategoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-slate-800/70 text-slate-400 hover:text-white'
                }`}
              >
                {cat} ({categoryGroups[cat]})
              </button>
            ))}
          </div>
        </div>

        {/* Dosya Listesi Tablosu */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="divide-y divide-slate-800/80">
            {filteredFiles.map(file => {
              const catColor = CATEGORY_COLORS[file.category] || CATEGORY_COLORS['Diğer Dosyalar'];
              return (
                <div
                  key={file.id}
                  className={`py-3 px-3 rounded-xl flex items-center justify-between gap-4 transition-colors ${
                    file.isExcluded ? 'opacity-40 bg-slate-900/20' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Sol: Seçim Kutusu ve Dosya Bilgisi */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onUpdateFile(file.id, { isExcluded: !file.isExcluded })}
                      className="text-slate-400 hover:text-cyan-400 flex-shrink-0"
                    >
                      {file.isExcluded ? (
                        <Square className="w-4 h-4 text-slate-500" />
                      ) : (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-200 truncate" title={file.name}>
                          {file.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {file.sizeFormatted}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                        <span>Hedef:</span>
                        <ChevronRight className="w-3 h-3 text-cyan-500" />
                        <span className="text-cyan-300 font-semibold truncate">{file.targetRelativePath}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sağ: Kategori Değiştirme Dropdown */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={file.category}
                      disabled={file.isExcluded}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        onUpdateFile(file.id, {
                          category: newCat,
                          targetRelativePath: newCat,
                        });
                      }}
                      className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {ALL_CATEGORY_LIST.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alt: İşlem ve Onay Butonları */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <span>Dahil edilen dosya: </span>
            <strong className="text-cyan-400 font-bold">{includedCount}</strong> / {files.length}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Kapat
            </button>
            <button
              onClick={() => {
                onClose();
                if (onConfirmZonePlan && activeZones && activeZones.length > 0) {
                  onConfirmZonePlan();
                } else {
                  onConfirmAndClean();
                }
              }}
              disabled={includedCount === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {activeZones && activeZones.length > 0
                  ? 'Planı Onayla ve Alanlara Diz'
                  : 'Planı Onayla ve Temizliği Başlat'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
