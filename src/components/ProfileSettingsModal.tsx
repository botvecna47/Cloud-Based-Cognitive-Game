import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { User, Volume2, Download, LogOut, Check, X, Shield, Sparkles, Sliders } from 'lucide-react';
import { sound } from '../utils/sound';

const AVATAR_OPTIONS = [
  { id: 'brain-blue', label: 'Cyan Brain', icon: '🧠' },
  { id: 'crown-gold', label: 'Gold Champion', icon: '👑' },
  { id: 'lightning', label: 'Reflex', icon: '⚡' },
  { id: 'rocket', label: 'Stratosphere', icon: '🚀' },
  { id: 'diamond', label: 'Diamond Mind', icon: '💎' },
  { id: 'robot', label: 'Neural Bot', icon: '🤖' },
  { id: 'fire', label: 'Hot Streak', icon: '🔥' },
  { id: 'star', label: 'Superstar', icon: '⭐' },
];

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
    a.download = `mount_adept_profile_backup_${user.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = async () => {
    sound.playClick();
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close settings modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            <Sliders className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Cadet Profile & Settings</h2>
            <p className="text-xs text-slate-400">Manage identity, rank progression, and audio</p>
          </div>
        </div>

        {/* Rank & XP Card */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-2xl shadow-md">
              {AVATAR_OPTIONS.find(a => a.id === selectedAvatar)?.icon || '🧠'}
            </div>
            <div>
              <div className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>{user.username}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  {user.rankTier} Tier
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {user.totalXp.toLocaleString()} Total XP • {user.gamesPlayed} Rounds
              </div>
            </div>
          </div>

          {user.isGuest && (
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs shadow cursor-pointer"
            >
              Link Cloud Account
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Profile Avatar
            </label>
            <div className="grid grid-cols-4 gap-2.5">
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
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-400/40 scale-105 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700/80'
                    }`}
                  >
                    <span className="text-2xl">{avatar.icon}</span>
                    <span className="text-[10px] font-semibold text-slate-300 truncate max-w-full">
                      {avatar.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Callsign / Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_\-\.]+"
                title="3 to 24 characters (letters, numbers, _, -, .)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Profile Updated!</span>
              </>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-slate-800" />

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleExportData}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700/80 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download Complete Game Records (JSON Backup)</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>{user.isGuest ? 'Reset Guest Profile' : 'Sign Out of Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
