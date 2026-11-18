import React, { useState, useEffect } from 'react';
import { isSupabaseConfigured, testSupabaseConnection } from '../services/supabase';
import { Database, ShieldCheck, Copy, Check, ExternalLink, X, RefreshCw } from 'lucide-react';
import { sound } from '../utils/sound';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusResult, setStatusResult] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyEnv = () => {
    sound.playClick();
    const envTemplate = `# Supabase Cloud Credentials\nVITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key-here`;
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    sound.playClick();
    setTesting(true);
    const res = await testSupabaseConnection();
    setTesting(false);
    setStatusResult(res.message);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Supabase Cloud Database Setup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-surface border border-hairline rounded-2xl shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close setup modal"
          className="absolute top-5 right-5 p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-recessed transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="mb-6 pr-8">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-vermilion mb-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>CLOUD INFRASTRUCTURE</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Supabase Database & Security
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1.5 leading-relaxed">
            Connect a persistent PostgreSQL cloud database with Row Level Security for profiles, sessions, and leaderboards.
          </p>
        </div>

        {/* Current Status Box */}
        <div className="p-4 mb-6 rounded-xl bg-paper border border-hairline flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-vermilion' : 'bg-ink-muted'}`} />
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Current Status
              </div>
              <div className="text-sm font-bold text-ink">
                {isSupabaseConfigured ? 'Connected to Supabase Cloud' : 'Running in Local Sandbox Mode'}
              </div>
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-2 rounded-lg bg-ink hover:bg-ink/90 text-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {statusResult && (
          <div className="p-3.5 mb-5 rounded-xl bg-recessed border border-hairline text-ink font-mono text-xs">
            {statusResult}
          </div>
        )}

        {/* 3 Step Guide */}
        <div className="flex flex-col gap-3 mb-6">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
            3-Step Connection Guide
          </h3>

          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-paper border border-hairline flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-ink text-surface font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              01
            </div>
            <div className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              <strong className="text-ink block font-semibold mb-1">
                Create a Supabase Project
              </strong>
              Navigate to{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-vermilion font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>supabase.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and provision a PostgreSQL project.
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-paper border border-hairline flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-ink text-surface font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              02
            </div>
            <div className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              <strong className="text-ink block font-semibold mb-1">
                Apply Schema & Row Level Security (RLS)
              </strong>
              Open the project's <strong>SQL Editor</strong>, paste{' '}
              <code className="font-mono text-xs text-ink bg-recessed px-1.5 py-0.5 rounded border border-hairline">
                supabase-schema.sql
              </code>{' '}
              from the repository root, and run it to create tables, triggers, views, and RLS policies.
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-paper border border-hairline flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-ink text-surface font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              03
            </div>
            <div className="text-xs sm:text-sm text-ink-secondary leading-relaxed flex-1">
              <strong className="text-ink block font-semibold mb-1">
                Add Credentials to .env
              </strong>
              Under <strong>Project Settings → API</strong>, copy your Project URL and publishable/anon key into{' '}
              <code className="font-mono text-xs text-ink bg-recessed px-1.5 py-0.5 rounded border border-hairline">
                .env
              </code>
              :
              <div className="mt-2.5 p-3 rounded-xl bg-ink text-surface font-mono text-xs flex items-center justify-between gap-2">
                <div className="overflow-x-auto">
                  <div>VITE_SUPABASE_URL=https://xyz.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY=sb_publishable_...</div>
                </div>
                <button
                  onClick={handleCopyEnv}
                  className="p-2 rounded-lg bg-surface/10 hover:bg-surface/20 text-surface transition-colors cursor-pointer shrink-0"
                  title="Copy .env template"
                >
                  {copied ? <Check className="w-4 h-4 text-vermilion" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Highlights */}
        <div className="p-4 rounded-xl bg-recessed border border-hairline text-xs text-ink-secondary">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink mb-2">
            <ShieldCheck className="w-4 h-4 text-vermilion" />
            <span>Active Cloud Security Architecture</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Row Level Security (RLS)</strong> enforced across all user sessions and personal profiles.</li>
            <li>Users can only insert or read their own session history; emails stay strictly private.</li>
            <li>Public leaderboards read only non-sensitive statistics via a hardened view.</li>
            <li>Zero <code className="font-mono text-ink">service_role</code> keys on the frontend.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
