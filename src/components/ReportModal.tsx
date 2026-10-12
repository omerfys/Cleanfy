import React, { useState } from 'react';
import { ReportItem, CleaningStats } from '../types';
import { exportToJson, exportToCsv, exportToHtml } from '../services/exportService';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  Globe, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ShieldCheck
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportItems: ReportItem[];
  stats: CleaningStats;
  desktopPath: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportItems,
  stats,
  desktopPath,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tümü');

  if (!isOpen) return null;

  const filteredItems = reportItems.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tümü' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none">
      <div className="glass-modal-panel rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Başlık */}
        <div className="px-6 py-4 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">📊</span>
              <span>Ayrıntılı Masaüstü İşlem Raporu</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Tüm dosya hareketleri, SHA-256 doğrulama kayıtları ve Türkçe kategori geçmişi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl glass-icon-btn text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Üst Çubuk: İstatistikler ve Dışa Aktarma Butonları */}
        <div className="p-4 bg-slate-900/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          {/* İstatistik Özetleri */}
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              ✓ {stats.moved} Başarılı
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
              ⚠ {stats.skipped} Atlandı
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
              ✕ {stats.failed} Hata
            </span>
          </div>

          {/* Dışa Aktar Düğmeleri (JSON, CSV, HTML) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToJson(reportItems, stats, desktopPath)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => exportToCsv(reportItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV (Excel)</span>
            </button>
            <button
              onClick={() => exportToHtml(reportItems, stats, desktopPath)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>HTML Raporu</span>
            </button>
          </div>
        </div>

        {/* Filtre ve Arama */}
        <div className="px-4 py-3 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Dosya adı veya kategori ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Durum:</span>
            {['Tümü', 'Başarılı', 'Atlandı', 'Hata'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tablo */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/80 sticky top-0 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Dosya Adı</th>
                <th className="py-2.5 px-3">Boyut</th>
                <th className="py-2.5 px-3">Eski Konum</th>
                <th className="py-2.5 px-3">Yeni Konum</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3">Durum</th>
                <th className="py-2.5 px-4 text-right">Zaman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Henüz raporlanacak dosya hareketi bulunmuyor.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <div className="truncate max-w-[200px]" title={item.fileName}>
                        {item.fileName}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {item.sizeFormatted}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      <div className="truncate max-w-[160px]" title={item.oldPath}>
                        {item.oldPath}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-cyan-300">
                      <div className="truncate max-w-[180px]" title={item.newPath}>
                        {item.newPath}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.status === 'Başarılı' && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Başarılı
                        </span>
                      )}
                      {item.status === 'Atlandı' && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Atlandı
                        </span>
                      )}
                      {item.status === 'Hata' && (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold" title={item.errorExplanation}>
                          <XCircle className="w-3.5 h-3.5" /> Hata
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleTimeString('tr-TR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Alt Çubuk */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Hiçbir dosya silinmemiştir. Bütün içerikler eksiksiz korunmaktadır.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
