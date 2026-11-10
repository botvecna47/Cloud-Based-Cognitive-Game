import React, { useEffect } from 'react';
import { Achievement } from '../types';
import { Award, Sparkles, X } from 'lucide-react';
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
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 rounded-2xl bg-slate-900/95 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 backdrop-blur-md animate-bounce-subtle flex items-start gap-3.5">
      <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
        {achievement.icon}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Achievement Unlocked!</span>
          </span>
          <button
            onClick={onDismiss}
            aria-label="Dismiss achievement banner"
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <h4 className="text-sm font-black text-white mt-0.5">{achievement.title}</h4>
        <p className="text-xs text-slate-300 mt-0.5">{achievement.description}</p>
        <div className="mt-2 text-xs font-mono font-bold text-emerald-400">
          +{achievement.xpReward} XP Awarded
        </div>
      </div>
    </div>
  );
};
