import React, { useState } from 'react';
import { isSupabaseConfigured, testSupabaseConnection } from '../services/supabase';
import { Database, ShieldCheck, Copy, Check, ExternalLink, X, RefreshCw, Key, Code } from 'lucide-react';
import { sound } from '../utils/sound';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusResult, setStatusResult] = useState<string | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close setup modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
            <Database className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Supabase Cloud Database & Security Setup
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Connect your persistent PostgreSQL cloud database with military-grade Row Level Security.
            </p>
          </div>
        </div>

        {/* Current Status Box */}
        <div className="p-4 mb-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isSupabaseConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Status</div>
              <div className="text-sm font-bold text-white">
                {isSupabaseConfigured ? 'Connected to Supabase Project' : 'Running in Offline Sandbox Mode'}
              </div>
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {statusResult && (
          <div className="p-3.5 mb-5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
            {statusResult}
          </div>
        )}

        {/* 3 Step Guide */}
        <div className="flex flex-col gap-4 mb-6">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Quick 3-Step Supabase Connection Guide
          </h3>

          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong className="text-white block font-semibold mb-1">
                Create a Free Supabase Project
              </strong>
              Navigate to{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                <span>supabase.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              and create a new project.
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong className="text-white block font-semibold mb-1">
                Execute Schema & Row Level Security (RLS)
              </strong>
              Open your project's <strong>SQL Editor</strong>, open the file{' '}
              <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                supabase-schema.sql
              </code>{' '}
              from this repository root, and click <strong>Run</strong>. This creates all 7 tables,
              indexes, triggers, and Row Level Security policies!
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed flex-1">
              <strong className="text-white block font-semibold mb-1">
                Add Credentials to your .env file
              </strong>
              Under Supabase <strong>Project Settings ➔ API</strong>, copy your <strong>Project URL</strong> and <strong>anon public API key</strong> into your{' '}
              <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                .env
              </code>{' '}
              file:
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 flex items-center justify-between border border-slate-800">
                <div>
                  <div>VITE_SUPABASE_URL=https://xyz.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY=eyJh...</div>
                </div>
                <button
                  onClick={handleCopyEnv}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy .env template"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Highlights */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs">
          <div className="flex items-center gap-2 font-bold text-indigo-300 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Active Cloud Security Architecture:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li><strong>Row Level Security (RLS)</strong> is strictly enforced across all user sessions and personal telemetry.</li>
            <li>Users can only write or read their own cognitive session history.</li>
            <li>Public leaderboards only expose non-sensitive public profile statistics.</li>
            <li>Zero <code>service_role</code> keys on the frontend — only anonymous JWT public tokens are used.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
