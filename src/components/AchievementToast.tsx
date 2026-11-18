import React, { useEffect } from 'react';
import { Achievement } from '../types';
import { Award, X } from 'lucide-react';
import { sound } from '../utils/sound';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onDismiss }) => {
  useEffect(() => {
    if (achievement) {
      sound.playVictory();
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100%-3rem)] p-4 rounded-2xl bg-ink text-surface border border-ink shadow-xl animate-float-subtle flex items-start gap-3.5"
    >
      <div className="w-10 h-10 rounded-xl bg-vermilion text-surface flex items-center justify-center shrink-0">
        <Award className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-vermilion">
            Badge Unlocked
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss achievement banner"
            className="text-surface/60 hover:text-surface p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h4 className="font-display text-base font-semibold text-surface mt-0.5 truncate">
          {achievement.title}
        </h4>
        <p className="text-xs text-surface/75 mt-0.5 leading-snug">{achievement.description}</p>
        <div className="mt-2 font-mono text-xs font-bold text-vermilion tabular-nums">
          +{achievement.xpReward} XP Credited
        </div>
      </div>
    </div>
  );
};
