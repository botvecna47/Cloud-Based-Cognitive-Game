import React, { useEffect, useState, useRef } from 'react';
import { Pause, Play, LogOut, Clock } from 'lucide-react';
import { GameMetadata } from '../types';

interface GameShellProps {
  game: GameMetadata;
  level: number;
  score: number;
  durationSeconds: number;
  isPaused: boolean;
  onPauseChange: (paused: boolean) => void;
  onTimeUp: () => void;
  onQuit: () => void;
  queueProgress?: { current: number; total: number };
  children: React.ReactNode;
}

export const GameShell: React.FC<GameShellProps> = ({
  game,
  level,
  score,
  durationSeconds,
  isPaused,
  onPauseChange,
  onTimeUp,
  onQuit,
  queueProgress,
  children,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const timeUpFiredRef = useRef(false);

  // Reset countdown whenever a new game round starts
  useEffect(() => {
    setTimeLeft(durationSeconds);
    timeUpFiredRef.current = false;
  }, [durationSeconds, game.id]);

  // Countdown tick (pure state updater — no side effects inside setTimeLeft)
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeLeft <= 0]);

  // Fire onTimeUp exactly once in an effect when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !timeUpFiredRef.current) {
      timeUpFiredRef.current = true;
      onTimeUpRef.current();
    }
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const pct = Math.max(0, Math.min(100, (timeLeft / Math.max(1, durationSeconds)) * 100));
  const isWarn = timeLeft <= 60;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Bar with Title & Quit */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">
              {game.ability}
            </span>
            {queueProgress && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                Assessment Round {queueProgress.current} / {queueProgress.total}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
            <span>{game.icon}</span>
            <span>{game.name}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPauseChange(!isPaused)}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={onQuit}
            aria-label="Quit to main menu"
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quit</span>
          </button>
        </div>
      </div>

      {/* HUD Stats & Progress Bar */}
      <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between gap-2 flex-wrap text-sm font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 tabular-nums">
              Level <strong className="text-cyan-400 text-base font-bold ml-1">{level}</strong>
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 tabular-nums">
              Score <strong className="text-emerald-400 text-base font-bold ml-1">{score}</strong>
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono font-bold tabular-nums ${
              isWarn
                ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              isWarn
                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                : 'bg-gradient-to-r from-cyan-400 to-teal-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Main Game Stage: Keep children mounted when paused to preserve puzzle state */}
      <div className="relative min-h-[360px] flex flex-col justify-center items-center">
        {isPaused && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Practice Paused"
            className="flex flex-col items-center gap-4 p-8 bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl z-20"
          >
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-2xl font-bold">
              ⏸️
            </div>
            <h3 className="text-2xl font-black text-white">Practice Paused</h3>
            <p className="text-slate-400 text-sm text-center max-w-xs">
              Take a breath! Both the round timer and level timer are halted. Your puzzle progress is preserved.
            </p>
            <button
              type="button"
              onClick={() => onPauseChange(false)}
              className="px-8 py-3 rounded-xl font-bold text-base bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg cursor-pointer"
            >
              Resume Game
            </button>
          </div>
        )}
        <div className={isPaused ? 'hidden' : 'w-full'}>{children}</div>
      </div>
    </div>
  );
};
