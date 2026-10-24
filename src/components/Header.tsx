import React, { useState } from 'react';
import { Volume2, VolumeX, BarChart3, Layers, Compass } from 'lucide-react';
import { sound } from '../utils/sound';

interface HeaderProps {
  currentTab: 'track1' | 'track2' | 'all' | 'stats';
  onSelectTab: (tab: 'track1' | 'track2' | 'all' | 'stats') => void;
  isInGame: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, isInGame }) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  const toggleAudio = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  return (
    <header className="w-full flex flex-col gap-4 pb-4 border-b border-slate-800/80 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <polygon points="8,86 40,30 56,58 66,42 92,86" fill="#20B8CF" />
              <polygon points="40,30 56,58 48,58 34,40" fill="#128FB0" />
              <circle cx="66" cy="30" r="7" fill="#E23B57" />
              <line x1="66" y1="30" x2="66" y2="10" stroke="#E23B57" strokeWidth="4" />
              <polygon points="66,4 60,14 72,14" fill="#E23B57" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white tracking-wider text-base sm:text-lg">
                MOUNT ADEPT
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                PRO ARENA
              </span>
            </div>
            <p className="text-xs text-slate-400">Campus Placement & Cognitive Aptitude Training</p>
          </div>
        </div>

        {/* Audio Toggle & Quick Stats */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Audio ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline text-slate-500">Muted</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs (if not inside an active game) */}
      {!isInGame && (
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onSelectTab('track1')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'track1'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Track 1: Cognitive Aptitude</span>
          </button>

          <button
            onClick={() => onSelectTab('track2')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'track2'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Track 2: Capgemini Game Round</span>
          </button>

          <button
            onClick={() => onSelectTab('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <span>All 12 Games</span>
          </button>

          <button
            onClick={() => onSelectTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'stats'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & History</span>
          </button>
        </nav>
      )}
    </header>
  );
};
