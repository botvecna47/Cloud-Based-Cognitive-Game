import React, { useState } from 'react';
import { Volume2, VolumeX, BarChart3, Layers, Compass, Trophy, History, Award, Database, User, LogIn, Sliders } from 'lucide-react';
import { sound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';

export type MainNavTab =
  | 'track1'
  | 'track2'
  | 'all'
  | 'leaderboards'
  | 'history'
  | 'analytics'
  | 'achievements';

interface HeaderProps {
  currentTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  isInGame: boolean;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenSupabaseSetup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isInGame,
  onOpenAuth,
  onOpenSettings,
  onOpenSupabaseSetup,
}) => {
  const { user, isSupabaseOnline } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  const toggleAudio = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  const rankBadgeColors: Record<string, string> = {
    Grandmaster: 'text-purple-300 bg-purple-950/80 border-purple-400/50',
    Master: 'text-rose-300 bg-rose-950/80 border-rose-400/50',
    Diamond: 'text-cyan-300 bg-cyan-950/80 border-cyan-400/50',
    Platinum: 'text-teal-300 bg-teal-950/80 border-teal-400/50',
    Gold: 'text-amber-300 bg-amber-950/80 border-amber-400/50',
    Silver: 'text-slate-200 bg-slate-800 border-slate-600',
    Bronze: 'text-orange-300 bg-orange-950/80 border-orange-400/50',
  };

  return (
    <header className="w-full flex flex-col gap-4 pb-4 border-b border-slate-800/80 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
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
              <span className="font-black text-white tracking-wider text-base sm:text-lg">
                MOUNT ADEPT
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/30">
                PRO ARENA
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Cognitive Aptitude & Game-Based Assessment Platform
            </p>
          </div>
        </div>

        {/* User Pill, Supabase Status & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseSetup}
            title="Click to view Supabase Cloud Database Status & Configuration"
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isSupabaseConfigured && isSupabaseOnline
                ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/40'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured && isSupabaseOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline">
              {isSupabaseConfigured && isSupabaseOnline ? 'Supabase Cloud' : 'Local DB Sandbox'}
            </span>
            <span className="sm:hidden">
              {isSupabaseConfigured && isSupabaseOnline ? 'Cloud' : 'Local'}
            </span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* User Account / Profile Button */}
          {user ? (
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer shadow"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs">
                🧠
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-white font-bold leading-tight flex items-center gap-1.5">
                  <span>{user.username}</span>
                  {user.isGuest && (
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-700 text-slate-400">
                      Guest
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {user.totalXp} XP • {user.rankTier}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden md:inline ${
                  rankBadgeColors[user.rankTier] || rankBadgeColors.Bronze
                }`}
              >
                {user.rankTier}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      {!isInGame && (
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onSelectTab('track1')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'track1'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Track 1: Cognitive Aptitude</span>
          </button>

          <button
            onClick={() => onSelectTab('track2')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'track2'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Track 2: Capgemini Round</span>
          </button>

          <button
            onClick={() => onSelectTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <span>All 12 Games</span>
          </button>

          <button
            onClick={() => onSelectTab('leaderboards')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'leaderboards'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboards</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'history'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Game History</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => onSelectTab('achievements')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              currentTab === 'achievements'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 shadow-md shadow-cyan-500/20 scale-102 font-extrabold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
            }`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>Badges</span>
          </button>
        </nav>
      )}
    </header>
  );
};
