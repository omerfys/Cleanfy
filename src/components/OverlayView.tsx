import React, { useState } from 'react';
import { RobotCanvas } from './RobotCanvas';
import { FileItem, RobotState } from '../types';
import { Bot, X, Play, Pause, ExternalLink } from 'lucide-react';

interface OverlayViewProps {
  files: FileItem[];
  robotState: RobotState;
  activeFileId: string | null;
  onCloseOverlay: () => void;
  onToggleClean: () => void;
  isCleaning: boolean;
}

export const OverlayView: React.FC<OverlayViewProps> = ({
  files,
  robotState,
  activeFileId,
  onCloseOverlay,
  onToggleClean,
  isCleaning,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Fare kontrol çubuğu üzerindeyken tıklamaları al, masaüstündeyken tıklamaları Windows Explorer'a geçir
  const handleMouseEnter = () => {
    setIsHovered(true);
    window.cleanfyApi?.setIgnoreMouse(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    window.cleanfyApi?.setIgnoreMouse(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-transparent select-none pointer-events-none">
      {/* 2D Canvas Robot Animasyonu ve Fizik Çarpışmaları */}
      <div className="absolute inset-0">
        <RobotCanvas
          files={files}
          robotState={robotState}
          activeFileId={activeFileId}
          isOverlay={true}
        />
      </div>

      {/* Şeffaf Masaüstü Üzerindeki Yüzen Kontrol Rozeti (Glassmorphism) */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="pointer-events-auto absolute top-3.5 right-3.5 flex items-center gap-2.5 px-3 py-2 glass-dock rounded-2xl shadow-2xl text-xs text-white"
      >
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/80 to-blue-600/80 border border-white/30 flex items-center justify-center shadow-md shadow-cyan-500/30">
          <Bot className="w-4 h-4 text-white animate-spin-slow" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 border border-slate-900 animate-ping" />
        </div>

        <div className="flex flex-col">
          <span className="font-bold text-cyan-200 tracking-wide">Cleanfy Canlı Katman</span>
          <span className="text-[10px] text-slate-300 font-medium">Durum: {robotState}</span>
        </div>

        <div className="flex items-center gap-1.5 ml-2 border-l border-white/15 pl-2.5">
          <button
            onClick={onToggleClean}
            className="p-1.5 rounded-xl glass-btn text-cyan-300 hover:text-white"
            title={isCleaning ? 'Duraklat' : 'Temizliği Başlat'}
          >
            {isCleaning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onCloseOverlay}
            className="p-1.5 rounded-xl glass-icon-btn hover:!bg-red-500/30 hover:!border-red-400/40 text-slate-300 hover:text-white"
            title="Şeffaf Katmanı Kapat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
