import React, { useEffect } from 'react';
import { GameMetadata, GameResult } from '../types';
import { Trophy, RotateCcw, Home, ArrowRight, CheckCircle2 } from 'lucide-react';
import { fireCelebration } from '../utils/confetti';
import { sound } from '../utils/sound';

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
  useEffect(() => {
    sound.playVictory();
    if ((result.performanceIndex && result.performanceIndex >= 50) || result.level >= 3) {
      fireCelebration();
    }
  }, [result]);

  const bandColors = {
    Excellent: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
    Strong: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
    Fair: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
    'Keep practising': 'text-slate-400 bg-slate-800/80 border-slate-700',
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto py-2 animate-fade-in text-center">
      {/* Title */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-cyan-500/10">
          <Trophy className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          {game.name}: Round Complete!
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Assessment Logged</span>
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1.5">Here is your cognitive performance report:</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Performance Index (Track 1) or Total Score (Track 2) */}
        {result.performanceIndex !== undefined ? (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-4xl font-black text-cyan-400 font-mono">
              {result.performanceIndex}
              <span className="text-base text-slate-500 font-normal"> /100</span>
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
              Performance Index
            </span>
            {result.performanceBand && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border mt-2 ${
                  bandColors[result.performanceBand]
                }`}
              >
                {result.performanceBand}
              </span>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center">
            <div className="text-4xl font-black text-emerald-400 font-mono">{result.score}</div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
              Total Points
            </span>
          </div>
        )}

        {/* Levels Cleared */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-white font-mono">{result.level}</div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
            Levels Cleared
          </span>
          <span className="text-xs text-slate-500 mt-2 font-mono">
            {result.correct} of {result.attempts} correct
          </span>
        </div>

        {/* Accuracy */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-cyan-300 font-mono">{result.accuracy}%</div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">
            Accuracy
          </span>
          <span className="text-xs text-slate-500 mt-2 font-mono">
            Score: {result.score} pts
          </span>
        </div>
      </div>

      {/* Explanatory Note */}
      <div className="text-xs text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 leading-relaxed text-left">
        <strong>Aptitude Evaluation:</strong> Campus placement rounds value consistent accuracy and
        controlled speed over rushed guessing. Each level increases in cognitive complexity and
        rewards clean, calculated execution.
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2">
        {hasNextInQueue && (
          <button
            onClick={onNextGame}
            className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Game: {nextGameName}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {!hasNextInQueue && (
          <button
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm sm:text-base bg-cyan-600 hover:bg-cyan-500 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play This Game Again</span>
          </button>
        )}

        <button
          onClick={onHome}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm sm:text-base text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Back to Arena Menu</span>
        </button>
      </div>
    </div>
  );
};
