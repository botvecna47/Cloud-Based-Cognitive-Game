import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  BarChart3,
  Layers,
  Compass,
  LayoutGrid,
  Trophy,
  History,
  Award,
  LogIn,
} from 'lucide-react';
import { sound } from '../utils/sound';
import { getAvatarIcon } from '../utils/avatars';
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

  const navItems: {
    id: MainNavTab;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
    accentInactive?: string;
  }[] = [
    { id: 'track1', label: 'Cognitive Track', Icon: Compass },
    { id: 'track2', label: 'Challenge Track', Icon: Layers },
    { id: 'all', label: 'All Games', Icon: LayoutGrid },
    { id: 'leaderboards', label: 'Leaderboard', Icon: Trophy, accentInactive: 'text-amber-400' },
    { id: 'history', label: 'History', Icon: History },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
    { id: 'achievements', label: 'Badges', Icon: Award, accentInactive: 'text-amber-400' },
  ];

  return (
    <header className="w-full flex flex-col gap-4 pb-4 border-b border-slate-800/80 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 p-1.5 flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
            <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <rect x="6" y="6" width="22" height="22" rx="6" fill="#20B8CF" />
              <rect x="36" y="6" width="22" height="22" rx="6" fill="#38BDF8" fillOpacity="0.35" stroke="#20B8CF" strokeWidth="3" />
              <rect x="6" y="36" width="22" height="22" rx="6" fill="#6366F1" fillOpacity="0.45" stroke="#818CF8" strokeWidth="3" />
              <circle cx="47" cy="47" r="11" fill="#10B981" />
              <path d="M42.5 47L45.5 50L52 43.5" stroke="#020617" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-wide text-base sm:text-lg">
                GAMEFIED APTI
              </span>
              <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-extrabold border border-cyan-500/30">
                ARENA
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Cognitive & Aptitude Game Arena
            </p>
          </div>
        </div>

        {/* User Pill, Cloud Status & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* Supabase Status Pill */}
          <button
            type="button"
            onClick={onOpenSupabaseSetup}
            title="View Supabase Cloud Database Status & Configuration"
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
              {isSupabaseConfigured && isSupabaseOnline ? 'Cloud Sync' : 'Local Sandbox'}
            </span>
            <span className="sm:hidden">
              {isSupabaseConfigured && isSupabaseOnline ? 'Cloud' : 'Local'}
            </span>
          </button>

          {/* Audio Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer flex items-center justify-center"
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
              type="button"
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer shadow"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs">
                {getAvatarIcon(user.avatarUrl)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-white font-bold leading-tight flex items-center gap-1.5">
                  <span>{user.username}</span>
                  {user.isGuest && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      Guest
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono tabular-nums">
                  {user.totalXp.toLocaleString()} XP • {user.rankTier}
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
              type="button"
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
        <nav aria-label="Main navigation" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map(({ id, label, Icon, accentInactive }) => {
            const isActive = currentTab === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => onSelectTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/20 font-extrabold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : accentInactive || ''}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
