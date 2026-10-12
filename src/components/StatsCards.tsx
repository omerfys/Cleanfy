import React from 'react';
import { CleaningStats, RobotState } from '../types';
import { FileSearch, CheckCircle2, AlertTriangle, XCircle, Clock, Cpu } from 'lucide-react';

interface StatsCardsProps {
  stats: CleaningStats;
  robotState: RobotState;
  isCleaning: boolean;
  progressPercent: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  stats,
  robotState,
  isCleaning,
  progressPercent,
}) => {
  const getRobotStatusColor = (state: RobotState) => {
    switch (state) {
      case 'Tamamlama':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Hata':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Taşıma':
      case 'Düzenleme':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'Tarama':
      case 'İnceleme':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-slate-300 bg-slate-800/60 border-slate-700/60';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* İlerleme Çubuğu ve Robot Durumu */}
      <div className="glass-card p-4 rounded-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Robot Durumu:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${getRobotStatusColor(robotState)}`}>
              {robotState}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-mono">
            <span>İlerleme:</span>
            <span className="text-cyan-400 font-bold">{Math.round(progressPercent)}%</span>
          </div>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-500/40"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      {/* İstatistik Kutuları */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
        <div className="glass-card p-3 rounded-xl flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Taranan</span>
            <FileSearch className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{stats.totalScanned}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Masaüstü dosyası</div>
        </div>

        <div className="glass-card p-3 rounded-xl flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Kategorize</span>
            <span className="text-[10px] text-cyan-400 font-mono">TR</span>
          </div>
          <div className="text-xl font-bold text-cyan-400">{stats.categorized}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Klasör hazır</div>
        </div>

        <div className="glass-card p-3 rounded-xl flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Taşınan</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{stats.moved}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Güvenli taşındı</div>
        </div>

        <div className="glass-card p-3 rounded-xl flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Atlanan</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{stats.skipped}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Hariç tutulan</div>
        </div>

        <div className="glass-card p-3 rounded-xl flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Hatalı</span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400">{stats.failed}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Eski yerde kaldı</div>
        </div>

        <div className="glass-card p-3 rounded-xl flex flex-col">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Tahmini Süre</span>
            <Clock className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono">
            {isCleaning ? `${stats.estimatedSecondsRemaining}s` : '--'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Kalan işlem</div>
        </div>
      </div>
    </div>
  );
};
