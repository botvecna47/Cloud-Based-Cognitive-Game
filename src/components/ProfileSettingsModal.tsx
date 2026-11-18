import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { User, Download, LogOut, Check, X, Sliders } from 'lucide-react';
import { sound } from '../utils/sound';
import { AVATAR_OPTIONS } from '../utils/avatars';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { user, updateUserProfile, signOut } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarUrl || 'brain-blue');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Keep form synced whenever user loads/switches or modal opens
  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username || '');
      setSelectedAvatar(user.avatarUrl || 'brain-blue');
      setSaveSuccess(false);
    }
  }, [user, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    sound.playClick();
    setIsSaving(true);
    await updateUserProfile({
      username: username.trim(),
      avatarUrl: selectedAvatar,
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportData = async () => {
    sound.playClick();
    const jsonStr = await dbService.exportUserData(user.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamefied_apti_profile_backup_${user.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    sound.playClick();
    await signOut();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Player Profile and Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain p-5 sm:p-8 bg-surface border border-hairline rounded-2xl shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings modal"
          className="absolute top-4 right-4 w-10 h-10 rounded-lg text-ink-muted hover:text-ink hover:bg-recessed flex items-center justify-center transition-colors duration-150 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="mb-6 pr-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-vermilion mb-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span>PROFILE & PREFERENCES</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Player Settings
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Customize your emblem, callsign, and export a local JSON archive of your rounds.
          </p>
        </div>

        {/* Rank & XP Card */}
        <div className="p-4 rounded-xl bg-paper border border-hairline mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-ink text-surface flex items-center justify-center font-mono text-xl font-bold">
              {AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.icon || '◈'}
            </div>
            <div>
              <div className="text-sm font-bold text-ink flex items-center gap-2 flex-wrap">
                <span>{user.username}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-vermilion-wash text-vermilion">
                  {user.rankTier} Tier
                </span>
              </div>
              <div className="text-xs text-ink-secondary font-mono mt-0.5">
                {user.totalXp.toLocaleString()} XP · {user.gamesPlayed} Rounds
              </div>
            </div>
          </div>

          {user.isGuest && (
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-3.5 py-2 rounded-lg bg-vermilion hover:bg-vermilion-hover text-surface font-semibold text-xs transition-colors cursor-pointer"
            >
              Link Cloud Account
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Avatar Picker */}
          <div>
            <label className="block font-mono text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-2">
              Select Profile Emblem
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_OPTIONS.map(avatar => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedAvatar(avatar.id);
                    }}
                    className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer ${
                      isSelected
                        ? 'bg-ink text-surface border-ink'
                        : 'bg-paper text-ink border-hairline hover:bg-recessed'
                    }`}
                  >
                    <span className={`font-mono text-xl font-bold ${isSelected ? 'text-vermilion' : 'text-ink'}`}>
                      {avatar.icon}
                    </span>
                    <span className={`text-[10px] font-semibold truncate max-w-full ${isSelected ? 'text-surface' : 'text-ink-secondary'}`}>
                      {avatar.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="block font-mono text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1.5">
              Callsign / Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_\-\.]+"
                title="3 to 24 characters (letters, numbers, _, -, .)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-paper border border-hairline rounded-xl text-ink text-sm focus:outline-none focus:border-ink transition-colors"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-vermilion hover:bg-vermilion-hover text-surface transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Profile Updated</span>
              </>
            ) : (
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-hairline" />

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleExportData}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-ink bg-paper hover:bg-recessed border border-hairline transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-ink-secondary" />
            <span>Download Complete Game Records (JSON Backup)</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-vermilion bg-vermilion-wash hover:bg-vermilion hover:text-surface border border-vermilion/30 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{user.isGuest ? 'Reset Guest Profile' : 'Sign Out of Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
