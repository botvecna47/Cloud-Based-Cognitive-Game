import React, { useEffect, useState, useRef } from 'react';
import { Pause, Play, LogOut } from 'lucide-react';
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

  useEffect(() => {
    setTimeLeft(durationSeconds);
    timeUpFiredRef.current = false;
  }, [durationSeconds, game.id]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeLeft <= 0]);

  useEffect(() => {
    if (timeLeft === 0 && !timeUpFiredRef.current) {
      timeUpFiredRef.current = true;
      onTimeUpRef.current();
    }
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct = Math.max(0, Math.min(100, (timeLeft / Math.max(1, durationSeconds)) * 100));
  const isWarn = timeLeft <= 60;

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Stage Top Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-[11px] uppercase font-medium tracking-[0.1em] text-vermilion">
              {game.ability}
            </span>
            {queueProgress && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-vermilion-wash text-vermilion font-semibold">
                Round {queueProgress.current} of {queueProgress.total}
              </span>
            )}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-0.5">
            {game.name}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onPauseChange(!isPaused)}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-recessed text-ink border border-hairline text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={onQuit}
            aria-label="Quit to main menu"
            className="px-4 py-2 rounded-xl bg-surface hover:bg-vermilion-wash hover:text-vermilion hover:border-vermilion/40 text-ink-secondary border border-hairline text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quit</span>
          </button>
        </div>
      </div>

      {/* Editorial Monospace HUD Strip */}
      <div className="flex flex-col gap-4 px-6 py-4 rounded-2xl bg-surface border border-hairline">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-8 sm:gap-10">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                Level
              </div>
              <div className="font-mono text-2xl font-bold text-ink tabular-nums leading-tight">
                {String(level).padStart(2, '0')}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                Score
              </div>
              <div className="font-mono text-2xl font-bold text-ink tabular-nums leading-tight">
                {score.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.12em] ${
                isWarn ? 'text-vermilion font-bold' : 'text-ink-muted'
              }`}
            >
              Time Remaining
            </div>
            <div
              className={`font-mono text-2xl font-bold tabular-nums leading-tight ${
                isWarn ? 'text-vermilion animate-pulse' : 'text-ink'
              }`}
            >
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Hairline 4px Progress Rule */}
        <div className="w-full h-1 rounded-full bg-recessed overflow-hidden">
          <div
            className="h-full bg-vermilion transition-all duration-300 ease-linear rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Main Game Stage Canvas (children stay mounted when paused) */}
      <div className="relative min-h-[400px] px-5 sm:px-10 py-8 sm:py-10 rounded-2xl bg-surface border border-hairline flex flex-col justify-center items-center">
        {isPaused && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Practice Paused"
            className="flex flex-col items-center gap-4 p-8 bg-paper border border-hairline rounded-2xl max-w-sm text-center z-20"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion">
              Session Halted
            </span>
            <h3 className="font-display text-2xl font-bold text-ink">Practice Paused</h3>
            <p className="text-ink-secondary text-sm leading-relaxed">
              Both the round clock and level telemetry timer are paused. Your puzzle progress is preserved.
            </p>
            <button
              type="button"
              onClick={() => onPauseChange(false)}
              className="mt-1 px-7 py-3 rounded-xl font-semibold text-sm bg-vermilion hover:bg-vermilion-hover text-surface transition-colors cursor-pointer"
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
