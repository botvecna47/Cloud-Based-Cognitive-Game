import React, { useEffect } from 'react';
import { GameMetadata, GameResult } from '../types';
import { RotateCcw, Home, ArrowRight, CheckCircle2, Award } from 'lucide-react';
import { fireCelebration } from '../utils/confetti';
import { sound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/supabase';

interface ResultModalProps {
  game: GameMetadata;
  result: GameResult;
  hasNextInQueue: boolean;
  nextGameName?: string;
  onNextGame: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  game,
  result,
  hasNextInQueue,
  nextGameName,
  onNextGame,
  onPlayAgain,
  onHome,
}) => {
  const { user, isSupabaseOnline } = useAuth();
  const savedToCloud = Boolean(isSupabaseConfigured && isSupabaseOnline && user && !user.isGuest);

  useEffect(() => {
    sound.playVictory();
    if ((result.performanceIndex && result.performanceIndex >= 50) || result.level >= 3) {
      fireCelebration();
    }
  }, [result]);

  return (
    <div className="flex flex-col gap-7 max-w-2xl mx-auto py-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-vermilion font-medium">
          Round Complete
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          {game.name}
        </h2>
        <div className="flex items-center gap-2.5 mt-1 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-ink-secondary font-mono text-[11px] border border-hairline">
            <CheckCircle2 className="w-3.5 h-3.5 text-ink" />
            <span>{savedToCloud ? 'Synced to Supabase Cloud' : 'Saved Locally (Sandbox)'}</span>
          </span>
          {result.xpEarned != null && result.xpEarned > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vermilion-wash text-vermilion font-mono font-bold text-[11px] tabular-nums">
              +{result.xpEarned.toLocaleString()} XP Earned
            </span>
          )}
        </div>
      </div>

      {/* Main Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {result.performanceIndex != null ? (
          <div className="p-6 rounded-2xl bg-surface border border-hairline flex flex-col items-center text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              Performance Index
            </span>
            <div className="font-mono text-4xl font-bold text-ink tabular-nums mt-2">
              {result.performanceIndex}
              <span className="text-sm text-ink-muted font-normal">/100</span>
            </div>
            {result.performanceBand && (
              <span className="mt-2 font-mono text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-vermilion-wash text-vermilion font-semibold">
                {result.performanceBand}
              </span>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-surface border border-hairline flex flex-col items-center text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
              Total Score
            </span>
            <div className="font-mono text-4xl font-bold text-ink tabular-nums mt-2">
              {result.score.toLocaleString()}
            </div>
            <span className="mt-2 font-mono text-[11px] text-ink-muted">POINTS</span>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-surface border border-hairline flex flex-col items-center text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Levels Cleared
          </span>
          <div className="font-mono text-4xl font-bold text-ink tabular-nums mt-2">
            {result.level}
          </div>
          <span className="mt-2 font-mono text-[11px] text-ink-muted tabular-nums">
            {result.correct} / {result.attempts} correct
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-surface border border-hairline flex flex-col items-center text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            Accuracy
          </span>
          <div className="font-mono text-4xl font-bold text-vermilion tabular-nums mt-2">
            {result.accuracy}%
          </div>
          <span className="mt-2 font-mono text-[11px] text-ink-muted tabular-nums">
            {result.score.toLocaleString()} pts
          </span>
        </div>
      </div>

      {/* Newly Unlocked Achievements */}
      {result.newAchievements && result.newAchievements.length > 0 && (
        <div className="p-5 rounded-2xl bg-ink text-surface">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-vermilion uppercase tracking-[0.12em] mb-3">
            <Award className="w-4 h-4" />
            <span>Badge Unlocked This Round</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {result.newAchievements.map(ach => (
              <div
                key={ach.id}
                className="flex items-center justify-between gap-3 bg-surface/10 p-3 rounded-xl border border-surface/15"
              >
                <div>
                  <div className="font-semibold text-surface text-sm">{ach.title}</div>
                  <div className="text-xs text-surface/75 mt-0.5">{ach.description}</div>
                </div>
                <span className="font-mono text-xs font-bold text-vermilion shrink-0 tabular-nums">
                  +{ach.xpReward} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight Note */}
      <div className="text-xs text-ink-secondary bg-recessed/70 p-4 rounded-xl border border-hairline leading-relaxed">
        <strong className="text-ink">Performance Insight:</strong> Consistent accuracy paired with controlled
        speed maximizes both your Performance Index and XP yield. Each level increases in complexity and rewards
        clean execution.
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {hasNextInQueue ? (
          <button
            type="button"
            onClick={onNextGame}
            className="w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-sm bg-vermilion hover:bg-vermilion-hover text-surface active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Module: {nextGameName}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-vermilion hover:bg-vermilion-hover text-surface active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>
        )}

        <button
          type="button"
          onClick={onHome}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm text-ink bg-surface hover:bg-recessed border border-hairline active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to Arena</span>
        </button>
      </div>
    </div>
  );
};
