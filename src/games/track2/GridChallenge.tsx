import React, { useState, useEffect, useRef } from 'react';
import { GameAPI } from '../../types';
import { sound } from '../../utils/sound';

function sample<T>(arr: T[], k: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

// Asymmetric SVG glyphs so mirror reflection (scaleX(-1)) is visually distinct from identity
const ASYMMETRIC_GLYPHS = [
  // L-hook
  'M 12 6 H 22 V 28 H 36 V 38 H 12 Z',
  // F-arm
  'M 12 6 H 36 V 14 H 22 V 20 H 32 V 28 H 22 V 38 H 12 Z',
  // Flag-arrow
  'M 12 6 H 20 V 10 L 36 18 L 20 26 V 38 H 12 Z',
  // Z-step
  'M 10 8 H 28 V 20 H 36 V 36 H 18 V 24 H 10 Z',
  // P-notch
  'M 12 6 H 34 V 24 H 22 V 38 H 12 Z',
];

export const GridChallenge: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const n = Math.min(3 + Math.floor((L - 1) / 2), 6);
  const total = n * n;
  const k = Math.min(2 + L, Math.floor(total / 2));
  const showMs = Math.max(1600, 3200 - L * 150);

  const [phase, setPhase] = useState<'memorize' | 'symmetry' | 'recall' | 'feedback'>('memorize');
  const [litCells, setLitCells] = useState<Set<number>>(new Set());
  const [chosenCells, setChosenCells] = useState<Set<number>>(new Set());
  const [isSymmetric, setIsSymmetric] = useState<boolean>(true);
  const [glyphPath, setGlyphPath] = useState<string>(ASYMMETRIC_GLYPHS[0]);
  const [symResult, setSymResult] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);

    const cellsPool = Array.from({ length: total }, (_, i) => i);
    const lit = new Set(sample(cellsPool, k));
    setLitCells(lit);
    setChosenCells(new Set());
    setPhase('memorize');

    // Setup genuine mirror-symmetry challenge using an asymmetric glyph
    const sym = Math.random() < 0.5;
    setIsSymmetric(sym);
    const picked = ASYMMETRIC_GLYPHS[Math.floor(Math.random() * ASYMMETRIC_GLYPHS.length)];
    setGlyphPath(picked);

    timerRef.current = window.setTimeout(() => {
      setPhase('symmetry');
    }, showMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [L, total, k, showMs]);

  const handleSymmetryAnswer = (answeredSym: boolean) => {
    sound.playClick();
    const correct = answeredSym === isSymmetric;
    setSymResult(correct);
    setPhase('recall');
  };

  const toggleRecallCell = (idx: number) => {
    sound.playClick();
    setChosenCells(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleRecallSubmit = () => {
    if (phase !== 'recall') return;
    setPhase('feedback');
    let cellsMatch = chosenCells.size === litCells.size;
    chosenCells.forEach(i => {
      if (!litCells.has(i)) cellsMatch = false;
    });

    const overallSuccess = cellsMatch && symResult;

    if (overallSuccess) {
      sound.playCorrect();
      feedbackTimerRef.current = window.setTimeout(() => {
        api.correct();
      }, 650);
    } else {
      sound.playWrong();
      feedbackTimerRef.current = window.setTimeout(() => {
        api.wrong();
      }, 850);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-2">
      {/* Phase Pill */}
      <div className="text-center">
        {phase === 'memorize' && (
          <div className="inline-flex items-center gap-2.5 text-ink bg-recessed px-5 py-2 rounded-full border border-hairline text-sm sm:text-base font-medium">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-vermilion">
              PHASE 1
            </span>
            <span>
              Memorize the <strong className="font-mono font-bold text-ink">{k}</strong> highlighted cells
            </span>
          </div>
        )}
        {phase === 'symmetry' && (
          <div className="inline-flex items-center gap-2.5 text-ink bg-recessed px-5 py-2 rounded-full border border-hairline text-sm sm:text-base font-medium">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-vermilion">
              PHASE 2
            </span>
            <span>Are these two shapes horizontal mirror images?</span>
          </div>
        )}
        {(phase === 'recall' || phase === 'feedback') && (
          <div className="inline-flex items-center gap-2.5 text-surface bg-ink px-5 py-2 rounded-full text-sm sm:text-base font-medium">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-vermilion">
              PHASE 3
            </span>
            <span>Select the cells that were originally lit</span>
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      {phase === 'memorize' && (
        <div className="p-4 sm:p-6 bg-paper rounded-xl border border-hairline">
          <div
            className="grid gap-2 select-none"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(44px, 54px))` }}
          >
            {Array.from({ length: total }).map((_, i) => {
              const isLit = litCells.has(i);
              return (
                <div
                  key={i}
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl border-2 transition-all flex items-center justify-center ${
                    isLit
                      ? 'bg-vermilion border-ink scale-105'
                      : 'bg-surface border-hairline'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {phase === 'symmetry' && (
        <div className="flex flex-col items-center gap-6 p-6 bg-paper rounded-xl border border-hairline w-full">
          <div className="flex items-center justify-center gap-6 sm:gap-10">
            {/* Left Shape */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface rounded-xl border border-hairline flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 44 44" aria-hidden="true">
                <path d={glyphPath} fill="#171717" />
              </svg>
            </div>

            <div className="h-16 w-0.5 border-l-2 border-dashed border-vermilion" aria-hidden="true" />

            {/* Right Shape: horizontally mirrored if symmetric, same orientation if not */}
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 bg-surface rounded-xl border border-hairline flex items-center justify-center"
              style={{ transform: isSymmetric ? 'scaleX(-1)' : 'none' }}
            >
              <svg width="48" height="48" viewBox="0 0 44 44" aria-hidden="true">
                <path d={glyphPath} fill="#171717" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSymmetryAnswer(true)}
              className="px-6 py-3 rounded-xl font-semibold text-sm sm:text-base bg-ink hover:bg-ink/90 text-surface active:scale-[0.98] transition-all cursor-pointer"
            >
              Mirror Image
            </button>
            <button
              type="button"
              onClick={() => handleSymmetryAnswer(false)}
              className="px-6 py-3 rounded-xl font-semibold text-sm sm:text-base bg-surface hover:bg-recessed text-ink border border-hairline active:scale-[0.98] transition-all cursor-pointer"
            >
              Not Mirrored
            </button>
          </div>
        </div>
      )}

      {(phase === 'recall' || phase === 'feedback') && (
        <div className="flex flex-col items-center gap-6 p-4 sm:p-6 bg-paper rounded-xl border border-hairline">
          <div
            className="grid gap-2 select-none"
            style={{ gridTemplateColumns: `repeat(${n}, minmax(44px, 54px))` }}
          >
            {Array.from({ length: total }).map((_, i) => {
              const isSelected = chosenCells.has(i);
              const wasLit = litCells.has(i);

              let cellStyle = 'bg-surface hover:bg-recessed border-hairline hover:border-ink';
              if (phase === 'recall' && isSelected) {
                cellStyle = 'bg-ink border-ink scale-105';
              } else if (phase === 'feedback') {
                if (wasLit) {
                  cellStyle = 'bg-ink border-ink text-surface scale-105';
                } else if (isSelected && !wasLit) {
                  cellStyle = 'bg-vermilion border-vermilion text-surface scale-95';
                }
              }

              return (
                <button
                  type="button"
                  key={i}
                  disabled={phase === 'feedback'}
                  onClick={() => toggleRecallCell(i)}
                  aria-label={`Grid cell ${i + 1}`}
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer ${cellStyle}`}
                >
                  {phase === 'feedback' && wasLit && <span className="font-mono font-bold text-surface text-base">✓</span>}
                  {phase === 'feedback' && isSelected && !wasLit && <span className="font-mono font-bold text-surface text-base">✗</span>}
                </button>
              );
            })}
          </div>

          {phase === 'recall' && (
            <button
              type="button"
              onClick={handleRecallSubmit}
              className="px-7 py-3 rounded-xl font-semibold text-sm sm:text-base bg-vermilion hover:bg-vermilion-hover text-surface active:scale-[0.98] transition-all cursor-pointer font-mono"
            >
              Submit Recall ({chosenCells.size} / {k})
            </button>
          )}
        </div>
      )}
    </div>
  );
};
