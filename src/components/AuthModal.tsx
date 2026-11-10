import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';
import { Lock, Mail, User, ShieldCheck, Database, X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { sound } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'signin' }) => {
  const { signIn, signUp, loginAsGuest, authError, clearAuthError, isSupabaseOnline, connectionStatusMessage } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(defaultTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    await signIn('cadet.demo@mountadept.ai', 'CadetPass2026!');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-3 shadow-lg shadow-cyan-500/10">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {tab === 'signin' ? 'Welcome Back, Cadet' : 'Create Cognitive Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Secure cloud tracking powered by Supabase with Row Level Security.
          </p>

          {/* Cloud Database Connection Indicator */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border">
            {isSupabaseConfigured && isSupabaseOnline ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Cloud Database Online</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border-amber-500/30">
                <Database className="w-3 h-3 text-amber-400" />
                <span>Sandbox Mode (Offline Local DB)</span>
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 mb-5 bg-slate-800/80 rounded-xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setFormError(null);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'signin'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
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
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Errors */}
        {(formError || authError) && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError || authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Player Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                maxLength={128}
                placeholder="cadet@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                maxLength={72}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="animate-spin text-lg">⏳</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>{tab === 'signin' ? 'Sign In to Arena' : 'Initialize Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative px-3 bg-slate-900 text-slate-500 text-xs uppercase tracking-wider font-semibold">
            Or Play Instantly
          </span>
        </div>

        {/* Instant Guest / Demo buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-slate-800 hover:bg-slate-700/80 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Continue as Guest Player</span>
          </button>

          {!isSupabaseConfigured && (
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>One-Click Cadet Demo Account</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
