import React, { useState } from 'react';
import { Volume2, VolumeX, LogIn } from 'lucide-react';
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

  const navItems: { id: MainNavTab; label: string; shortLabel: string }[] = [
    { id: 'track1', label: 'Cognitive Track', shortLabel: 'Cognitive' },
    { id: 'track2', label: 'Challenge Track', shortLabel: 'Challenge' },
    { id: 'all', label: 'All Games', shortLabel: 'All (12)' },
    { id: 'leaderboards', label: 'Leaderboard', shortLabel: 'Ranks' },
    { id: 'history', label: 'History', shortLabel: 'History' },
    { id: 'analytics', label: 'Analytics', shortLabel: 'Stats' },
    { id: 'achievements', label: 'Badges', shortLabel: 'Badges' },
  ];

  const isCloud = isSupabaseConfigured && isSupabaseOnline;

  return (
    <header className="w-full flex flex-col gap-4 sm:gap-5 mb-6 sm:mb-10">
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Brand Mark & Wordmark */}
        <button
          type="button"
          onClick={() => !isInGame && onSelectTab('track1')}
          disabled={isInGame}
          className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer disabled:cursor-default min-w-0 rounded-lg"
        >
          <div className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center shrink-0 motion-safe:transition-transform duration-150 ease-out group-hover:scale-[1.03] group-disabled:scale-100">
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="12" height="12" rx="2.5" fill="#FCFBF8" />
              <rect x="20" y="4" width="12" height="12" rx="2.5" fill="#FCFBF8" fillOpacity="0.32" />
              <rect x="4" y="20" width="12" height="12" rx="2.5" fill="#FCFBF8" fillOpacity="0.32" />
              <circle cx="26" cy="26" r="6" fill="#D9381E" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-sans font-bold text-ink tracking-tight text-sm sm:text-base leading-none truncate">
              GAMEFIED APTI
            </div>
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.12em] text-ink-muted mt-1 truncate">
              Cognitive &amp; Aptitude Arena
            </div>
          </div>
        </button>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSupabaseSetup}
            title={isCloud ? 'Supabase Cloud Sync Online' : 'Local Sandbox Mode'}
            aria-label={isCloud ? 'Supabase Cloud Sync Online' : 'Local Sandbox Mode'}
            className="h-9 px-2.5 sm:px-3 rounded-lg bg-surface hover:bg-recessed border border-hairline text-ink text-[11px] font-mono font-medium tracking-wider uppercase flex items-center gap-1.5 sm:gap-2 transition-colors duration-150 motion-safe:enabled:active:scale-[0.96] cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isCloud ? 'bg-vermilion' : 'bg-ink-muted'
              }`}
            />
            <span className="hidden md:inline">{isCloud ? 'Cloud Sync' : 'Local Mode'}</span>
            <span className="hidden sm:inline md:hidden">{isCloud ? 'Cloud' : 'Local'}</span>
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="w-9 h-9 rounded-lg bg-surface hover:bg-recessed text-ink-secondary hover:text-ink border border-hairline transition-colors duration-150 motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-ink-muted" />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="h-9 px-2.5 sm:px-3.5 rounded-lg bg-ink hover:bg-ink/90 text-surface text-xs font-mono font-medium flex items-center gap-2 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
            >
              <span className="text-vermilion font-bold shrink-0" aria-hidden="true">
                {getAvatarIcon(user.avatarUrl)}
              </span>
              <span className="font-sans font-semibold tracking-normal max-w-[78px] sm:max-w-[140px] truncate">
                {user.username}
              </span>
              <span className="text-surface/40 hidden sm:inline">•</span>
              <span className="tabular-nums hidden sm:inline text-surface/90">
                {user.totalXp.toLocaleString()} XP
              </span>
              <span className="text-surface/40 hidden md:inline">•</span>
              <span className="uppercase tracking-wider text-[10px] hidden md:inline text-surface/80">
                {user.rankTier}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="h-9 px-3 sm:px-4 rounded-lg bg-vermilion hover:bg-vermilion-hover text-surface font-semibold text-xs flex items-center gap-1.5 transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Editorial Underlined Navigation Bar with mobile scroll-fade hint */}
      {!isInGame && (
        <div className="relative border-b border-hairline">
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none pr-8 sm:pr-0"
          >
            {navItems.map(({ id, label, shortLabel }) => {
              const isActive = currentTab === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => onSelectTab(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative min-h-[42px] pb-2.5 pt-1 text-xs sm:text-sm whitespace-nowrap transition-colors duration-150 cursor-pointer flex items-end ${
                    isActive
                      ? 'font-semibold text-vermilion'
                      : 'font-medium text-ink-secondary hover:text-ink'
                  }`}
                >
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                  {isActive && (
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-vermilion" />
                  )}
                </button>
              );
            })}
          </nav>
          {/* Mobile right-edge scroll hint */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-paper to-transparent sm:hidden"
          />
        </div>
      )}
    </header>
  );
};
