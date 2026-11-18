import React, { useEffect, useState, useRef } from 'react';
import { Pause, Play, LogOut, HelpCircle, RotateCcw, Volume2, VolumeX, CheckCircle2, X } from 'lucide-react';
import { GameMetadata } from '../types';
import { sound } from '../utils/sound';

interface GameShellProps {
  game: GameMetadata;
  level: number;
  score: number;
  streak: number;
  correctCount: number;
  attemptCount: number;
  durationSeconds: number;
  sessionNonce: number;
  isPaused: boolean;
  onPauseChange: (paused: boolean) => void;
  onRestart: () => void;
  onFinishEarly: () => void;
  onTimeUp: () => void;
  onQuit: () => void;
  queueProgress?: { current: number; total: number };
  children: React.ReactNode;
}

type ActiveOverlay = 'none' | 'pause' | 'rules' | 'quit';

export const GameShell: React.FC<GameShellProps> = ({
  game,
  level,
  score,
  streak,
  correctCount,
  attemptCount,
  durationSeconds,
  sessionNonce,
  isPaused,
  onPauseChange,
  onRestart,
  onFinishEarly,
  onTimeUp,
  onQuit,
  queueProgress,
  children,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [overlay, setOverlay] = useState<ActiveOverlay>('none');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.enabled);

  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const timeUpFiredRef = useRef(false);

  // Reset clock on new game or restart
  useEffect(() => {
    setTimeLeft(durationSeconds);
    setOverlay('none');
    timeUpFiredRef.current = false;
  }, [durationSeconds, game.id, sessionNonce]);

  // Keep overlay synced when external pause changes
  useEffect(() => {
    if (!isPaused && overlay !== 'none') {
      setOverlay('none');
    } else if (isPaused && overlay === 'none') {
      setOverlay('pause');
    }
  }, [isPaused, overlay]);

  // Countdown tick
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

  // Keyboard shortcut: Escape toggles pause / closes rules & quit overlays
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (overlay !== 'none') {
        setOverlay('none');
        onPauseChange(false);
      } else {
        setOverlay('pause');
        onPauseChange(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [overlay, onPauseChange]);

  const openOverlay = (next: ActiveOverlay) => {
    sound.playClick();
    setOverlay(next);
    onPauseChange(next !== 'none');
  };

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundEnabled(next);
  };

  const handleQuitPress = () => {
    if (attemptCount === 0 && !queueProgress) {
      sound.playClick();
      onQuit();
      return;
    }
    openOverlay('quit');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const pct = Math.max(0, Math.min(100, (timeLeft / Math.max(1, durationSeconds)) * 100));
  const isWarn = timeLeft <= 60;
  const liveAccuracy = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : null;

  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full max-w-4xl mx-auto">
      {/* Stage Top Bar */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] sm:text-[11px] uppercase font-medium tracking-[0.1em] text-vermilion">
              {game.ability}
            </span>
            {queueProgress && (
              <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-vermilion-wash text-vermilion font-semibold tabular-nums">
                Module {queueProgress.current}/{queueProgress.total}
              </span>
            )}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight mt-0.5 truncate">
            {game.name}
          </h2>
        </div>

        {/* Action Controls (Sound, Rules, Pause, Quit) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="w-9 h-9 rounded-lg bg-surface hover:bg-recessed text-ink-secondary hover:text-ink border border-hairline transition-[background-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-ink-muted" />}
          </button>

          <button
            type="button"
            onClick={() => openOverlay(overlay === 'rules' ? 'none' : 'rules')}
            aria-label="How to play"
            title="View rules (pauses clock)"
            className={`h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer ${
              overlay === 'rules'
                ? 'bg-ink text-surface border-ink'
                : 'bg-surface hover:bg-recessed text-ink border-hairline'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          <button
            type="button"
            onClick={() => openOverlay(isPaused ? 'none' : 'pause')}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
            className={`h-9 px-3 sm:px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer ${
              isPaused
                ? 'bg-vermilion text-surface border-vermilion hover:bg-vermilion-hover'
                : 'bg-surface hover:bg-recessed text-ink border-hairline'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            type="button"
            onClick={handleQuitPress}
            aria-label="Quit session"
            className="h-9 px-2.5 sm:px-3.5 rounded-lg bg-surface hover:bg-vermilion-wash hover:text-vermilion hover:border-vermilion/40 text-ink-secondary border border-hairline text-xs font-semibold flex items-center gap-1.5 transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quit</span>
          </button>
        </div>
      </div>

      {/* Sprint / Marathon Step Progress Strip */}
      {queueProgress && (
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${queueProgress.total}, minmax(0, 1fr))` }}
          aria-label={`Sprint progress: module ${queueProgress.current} of ${queueProgress.total}`}
        >
          {Array.from({ length: queueProgress.total }).map((_, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < queueProgress.current;
            const isCurrent = stepNum === queueProgress.current;
            return (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-colors duration-200 ${
                  isDone ? 'bg-ink' : isCurrent ? 'bg-vermilion' : 'bg-hairline'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Editorial 4-Column Monospace HUD Strip */}
      <div className="flex flex-col gap-3 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl bg-surface border border-hairline">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 items-end">
          <div>
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-ink-muted">
              Level
            </div>
            <div className="font-mono text-lg sm:text-2xl font-bold text-ink tabular-nums leading-tight">
              {String(level).padStart(2, '0')}
            </div>
          </div>

          <div>
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-ink-muted">
              Score
            </div>
            <div className="font-mono text-lg sm:text-2xl font-bold text-ink tabular-nums leading-tight truncate">
              {score.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-ink-muted">
              {liveAccuracy !== null ? `Streak · ${liveAccuracy}%` : 'Streak'}
            </div>
            <div
              className={`font-mono text-lg sm:text-2xl font-bold tabular-nums leading-tight ${
                streak >= 2 ? 'text-vermilion' : 'text-ink'
              }`}
            >
              {streak > 0 ? `×${streak}` : '0'}
            </div>
          </div>

          <div className="text-right">
            <div
              className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.1em] ${
                isWarn ? 'text-vermilion font-bold' : 'text-ink-muted'
              }`}
            >
              {isWarn ? 'Low Time' : 'Time'}
            </div>
            <div
              className={`font-mono text-lg sm:text-2xl font-bold tabular-nums leading-tight ${
                isWarn ? 'text-vermilion' : 'text-ink'
              }`}
            >
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Hairline 4px Progress Rule */}
        <div className="w-full h-1 rounded-full bg-recessed overflow-hidden">
          <div
            className="h-full bg-vermilion transition-[width] duration-300 ease-linear rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Main Game Stage Canvas (children stay mounted when paused so timers/state preserve) */}
      <div className="relative min-h-[300px] sm:min-h-[420px] px-3.5 sm:px-10 py-5 sm:py-10 rounded-2xl bg-surface border border-hairline flex flex-col justify-center items-center">
        {/* Pause Overlay */}
        {overlay === 'pause' && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Practice Paused"
            className="flex flex-col items-center gap-4 p-6 sm:p-8 bg-paper border border-hairline rounded-2xl max-w-sm w-full text-center z-20 animate-fade-in"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion font-bold">
              Session Halted
            </span>
            <h3 className="font-display text-2xl font-bold text-ink">Practice Paused</h3>
            <p className="text-ink-secondary text-xs sm:text-sm leading-relaxed">
              Both the round clock and level telemetry timer are paused. Your current puzzle is preserved.
            </p>
            <div className="flex flex-col gap-2.5 w-full mt-1">
              <button
                type="button"
                onClick={() => openOverlay('none')}
                className="w-full py-3 px-5 rounded-xl font-semibold text-sm bg-vermilion hover:bg-vermilion-hover text-surface transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
              >
                Resume Game
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onRestart();
                }}
                className="w-full py-2.5 px-5 rounded-xl font-semibold text-xs text-ink bg-surface hover:bg-recessed border border-hairline transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Round</span>
              </button>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted hidden sm:inline">
              Press Esc to resume
            </span>
          </div>
        )}

        {/* Quick In-Game Rules Overlay */}
        {overlay === 'rules' && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Rules for ${game.name}`}
            className="relative flex flex-col gap-4 p-5 sm:p-7 bg-paper border border-hairline rounded-2xl max-w-md w-full max-h-[75dvh] overflow-y-auto overscroll-contain z-20 animate-fade-in"
          >
            <button
              type="button"
              onClick={() => openOverlay('none')}
              aria-label="Close rules"
              className="absolute top-4 right-4 w-9 h-9 rounded-lg text-ink-muted hover:text-ink hover:bg-recessed flex items-center justify-center transition-colors duration-150 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pr-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vermilion font-bold">
                Quick Reference · Clock Paused
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink mt-0.5">
                {game.name}
              </h3>
            </div>

            <div className="flex flex-col gap-2.5">
              {game.howto.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-recessed text-ink font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <p className="text-ink text-xs sm:text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            {game.tips && (
              <div className="p-3.5 rounded-xl bg-vermilion-wash/70 border border-vermilion/20 text-xs text-ink-secondary leading-relaxed">
                <strong className="font-mono text-[10px] uppercase tracking-wider text-vermilion block mb-1">
                  Tip
                </strong>
                {game.tips}
              </div>
            )}

            <button
              type="button"
              onClick={() => openOverlay('none')}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-ink hover:bg-ink/90 text-surface transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer mt-1"
            >
              Back to Puzzle
            </button>
          </div>
        )}

        {/* Quit / Finish Early Confirmation Overlay */}
        {overlay === 'quit' && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Leave active round"
            className="flex flex-col items-center gap-4 p-6 sm:p-8 bg-paper border border-hairline rounded-2xl max-w-sm w-full text-center z-20 animate-fade-in"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-vermilion font-bold">
              Confirm Exit
            </span>
            <h3 className="font-display text-2xl font-bold text-ink">End this session?</h3>
            <p className="text-ink-secondary text-xs sm:text-sm leading-relaxed">
              {attemptCount > 0
                ? `You have ${score.toLocaleString()} pts across ${correctCount}/${attemptCount} puzzles. Save this round or discard it.`
                : 'Leaving now will exit the active sprint back to the Arena.'}
            </p>
            <div className="flex flex-col gap-2 w-full mt-1">
              {attemptCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onFinishEarly();
                  }}
                  className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-ink hover:bg-ink/90 text-surface transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-vermilion" />
                  <span>Finish &amp; Save Score</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onQuit();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-vermilion bg-vermilion-wash hover:bg-vermilion hover:text-surface border border-vermilion/30 transition-[background-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
              >
                Discard &amp; Exit to Arena
              </button>
              <button
                type="button"
                onClick={() => openOverlay('none')}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-ink bg-surface hover:bg-recessed border border-hairline transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
              >
                Keep Playing
              </button>
            </div>
          </div>
        )}

        <div className={overlay !== 'none' ? 'hidden' : 'w-full'}>{children}</div>
      </div>
    </div>
  );
};
