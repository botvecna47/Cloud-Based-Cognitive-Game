import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';
import { Lock, Mail, User, ShieldCheck, Database, X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'signin' }) => {
  const { signIn, signUp, loginAsGuest, authError, clearAuthError, isSupabaseOnline } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearAuthError();

    if (!email || !password) {
      setFormError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    sound.playClick();

    if (tab === 'signin') {
      const res = await signIn(email.trim(), password);
      setIsSubmitting(false);
      if (res.success) {
        sound.playCorrect();
        onClose();
      }
    } else {
      if (!username.trim()) {
        setFormError('Please choose a username for your player profile.');
        setIsSubmitting(false);
        return;
      }
      const res = await signUp(email.trim(), password, username.trim());
      setIsSubmitting(false);
      if (res.success) {
        sound.playCorrect();
        onClose();
      }
    }
  };

  const handleGuestLogin = () => {
    sound.playClick();
    loginAsGuest();
    onClose();
  };

  const handleDemoLogin = async () => {
    sound.playClick();
    setIsSubmitting(true);
    await signIn('demo@gamefiedapti.app', 'DemoPass2026!');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Account Sign In"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-surface border border-hairline rounded-2xl shadow-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-recessed transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-6 pr-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-vermilion mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PLAYER AUTHENTICATION</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {tab === 'signin' ? 'Welcome back' : 'Create player account'}
          </h2>
          <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">
            Sync cognitive history and global leaderboard ranks securely via Supabase with Row Level Security.
          </p>

          {/* Cloud Database Connection Indicator */}
          <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-paper font-mono text-[11px] font-medium text-ink">
            {isSupabaseConfigured && isSupabaseOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-vermilion" />
                <span>CLOUD SYNC ONLINE</span>
              </>
            ) : (
              <>
                <Database className="w-3 h-3 text-ink-muted" />
                <span>LOCAL SANDBOX MODE</span>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mb-5 bg-recessed rounded-xl border border-hairline">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setFormError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'signin'
                ? 'bg-ink text-surface shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setFormError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-ink text-surface shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Errors */}
        {(formError || authError) && (
          <div className="flex items-start gap-2.5 p-3 mb-4 rounded-xl bg-vermilion-wash border border-vermilion/30 text-vermilion text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block font-mono text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1.5">
                Player Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                <input
                  type="text"
                  required
                  maxLength={24}
                  minLength={3}
                  pattern="[a-zA-Z0-9_\-\.]+"
                  title="3 to 24 characters (letters, numbers, _, -, .)"
                  placeholder="e.g. Brainiac42"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-paper border border-hairline rounded-xl text-ink placeholder-ink-muted text-sm focus:outline-none focus:border-ink transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="email"
                required
                maxLength={128}
                placeholder="player@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-paper border border-hairline rounded-xl text-ink placeholder-ink-muted text-sm focus:outline-none focus:border-ink transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] font-bold text-ink-secondary uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                type="password"
                required
                minLength={6}
                maxLength={72}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-paper border border-hairline rounded-xl text-ink placeholder-ink-muted text-sm focus:outline-none focus:border-ink transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-vermilion hover:bg-vermilion-hover text-surface active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="font-mono text-xs uppercase tracking-wider">Authenticating...</span>
            ) : (
              <>
                <span>{tab === 'signin' ? 'Sign In to Arena' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-hairline" />
          </div>
          <span className="relative px-3 bg-surface text-ink-muted font-mono text-[10px] uppercase tracking-[0.14em] font-bold">
            Or Play Instantly
          </span>
        </div>

        {/* Instant Guest / Demo buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-ink bg-paper hover:bg-recessed border border-hairline transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <User className="w-3.5 h-3.5 text-ink-secondary" />
            <span>Continue as Guest Player</span>
          </button>

          {!isSupabaseConfigured && (
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-ink bg-recessed hover:bg-hairline/70 border border-hairline transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-vermilion" />
              <span>One-Click Demo Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
