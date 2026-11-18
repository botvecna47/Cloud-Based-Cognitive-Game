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

  const navItems: { id: MainNavTab; label: string }[] = [
    { id: 'track1', label: 'Cognitive Track' },
    { id: 'track2', label: 'Challenge Track' },
    { id: 'all', label: 'All Games' },
    { id: 'leaderboards', label: 'Leaderboard' },
    { id: 'history', label: 'History' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'achievements', label: 'Badges' },
  ];

  const isCloud = isSupabaseConfigured && isSupabaseOnline;

  return (
    <header className="w-full flex flex-col gap-5 mb-8 sm:mb-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Brand Mark & Wordmark */}
        <button
          type="button"
          onClick={() => !isInGame && onSelectTab('track1')}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-ink flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.03]">
            <svg width="24" height="24" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="12" height="12" rx="2.5" fill="#FCFBF8" />
              <rect x="20" y="4" width="12" height="12" rx="2.5" fill="#FCFBF8" fillOpacity="0.32" />
              <rect x="4" y="20" width="12" height="12" rx="2.5" fill="#FCFBF8" fillOpacity="0.32" />
              <circle cx="26" cy="26" r="6" fill="#D9381E" />
            </svg>
          </div>
          <div>
            <div className="font-sans font-bold text-ink tracking-tight text-sm sm:text-base leading-none">
              GAMEFIED APTI
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted mt-1">
              Cognitive &amp; Aptitude Arena
            </div>
          </div>
        </button>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onOpenSupabaseSetup}
            title="View Supabase Cloud Database Status"
            className="px-3 py-1.5 rounded-full bg-surface hover:bg-recessed border border-hairline text-ink text-[11px] font-mono font-medium tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCloud ? 'bg-vermilion' : 'bg-ink-muted'
              }`}
            />
            <span className="hidden sm:inline">{isCloud ? 'Cloud Sync' : 'Local Mode'}</span>
            <span className="sm:hidden">{isCloud ? 'Cloud' : 'Local'}</span>
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className="p-2 rounded-lg bg-surface hover:bg-recessed text-ink-secondary hover:text-ink border border-hairline transition-colors cursor-pointer flex items-center justify-center"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-ink-muted" />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-3.5 py-1.5 rounded-lg bg-ink hover:bg-ink/90 text-surface text-xs font-mono font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <span className="text-vermilion font-bold" aria-hidden="true">
                {getAvatarIcon(user.avatarUrl)}
              </span>
              <span className="font-sans font-semibold tracking-normal">{user.username}</span>
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
              className="px-4 py-2 rounded-lg bg-vermilion hover:bg-vermilion-hover text-surface font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Editorial Underlined Navigation Bar */}
      {!isInGame && (
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-6 sm:gap-7 overflow-x-auto border-b border-hairline scrollbar-none"
        >
          {navItems.map(({ id, label }) => {
            const isActive = currentTab === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => onSelectTab(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative pb-3 text-sm whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus-visible:text-vermilion ${
                  isActive
                    ? 'font-semibold text-vermilion'
                    : 'font-medium text-ink-secondary hover:text-ink'
                }`}
              >
                <span>{label}</span>
                {isActive && (
                  <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-vermilion" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
