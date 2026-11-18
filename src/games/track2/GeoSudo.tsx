import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameAPI } from '../../types';
import { Shape, SHAPES } from '../../utils/shapes';
import { sound } from '../../utils/sound';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const GeoSudo: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const n = Math.min(4 + Math.floor((L - 1) / 2), 6);
  const symbols = useMemo(() => SHAPES.slice(0, n), [n]);

  const puzzle = useMemo(() => {
    // Generate valid latin square
    const base = Array.from({ length: n }, (_, i) => i);
    const rowsP = shuffle(base);
    const colsP = shuffle(base);

    const sol: number[][] = [];
    for (let r = 0; r < n; r++) {
      sol.push([]);
      for (let c = 0; c < n; c++) {
        sol[r].push((rowsP[r] + colsP[c]) % n);
      }
    }

    // Determine given cells
    const removeCount = Math.min(Math.floor(n * n * (0.32 + 0.05 * L)), n * n - n);
    const givenMask = Array.from({ length: n }, () => Array(n).fill(true));
    let removed = 0;
    const indices = shuffle(Array.from({ length: n * n }, (_, i) => i));

    for (const idx of indices) {
      if (removed >= removeCount) break;
      const r = Math.floor(idx / n);
      const c = idx % n;
      givenMask[r][c] = false;
      removed++;
    }

    return { n, sol, givenMask };
  }, [L, n]);

  const [currentGrid, setCurrentGrid] = useState<number[][]>([]);
  const [selectedShapeIndex, setSelectedShapeIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const initial = puzzle.sol.map((row, r) =>
      row.map((val, c) => (puzzle.givenMask[r][c] ? val : -1))
    );
    setCurrentGrid(initial);
    setSelectedShapeIndex(0);
    setErrorMsg(null);
  }, [puzzle]);

  const handleCellClick = (r: number, c: number) => {
    if (puzzle.givenMask[r][c]) return; // locked given clue
    sound.playClick();
    setErrorMsg(null);

    setCurrentGrid(prev => {
      const next = prev.map(row => [...row]);
      // If cell already has selected shape, clear it; otherwise set it
      if (next[r][c] === selectedShapeIndex) {
        next[r][c] = -1;
      } else {
        next[r][c] = selectedShapeIndex;
      }
      return next;
    });
  };

  const handleCheck = useCallback(() => {
    setErrorMsg(null);
    // Check if all filled
    for (let r = 0; r < puzzle.n; r++) {
      for (let c = 0; c < puzzle.n; c++) {
        if (currentGrid[r][c] < 0) {
          setErrorMsg('Fill every cell before checking.');
          sound.playWrong();
          return;
        }
      }
    }

    // Check rows
    for (let r = 0; r < puzzle.n; r++) {
      const seen = new Set<number>();
      for (let c = 0; c < puzzle.n; c++) {
        const val = currentGrid[r][c];
        if (seen.has(val)) {
          sound.playWrong();
          api.wrong();
          return;
        }
        seen.add(val);
      }
    }

    // Check columns
    for (let c = 0; c < puzzle.n; c++) {
      const seen = new Set<number>();
      for (let r = 0; r < puzzle.n; r++) {
        const val = currentGrid[r][c];
        if (seen.has(val)) {
          sound.playWrong();
          api.wrong();
          return;
        }
        seen.add(val);
      }
    }

    sound.playCorrect();
    api.correct();
  }, [currentGrid, puzzle.n, api]);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-ink text-base sm:text-lg font-medium">
          Every shape must appear exactly once in each row and column:
        </p>
      </div>

      {errorMsg && (
        <div className="text-xs sm:text-sm font-medium text-vermilion bg-vermilion-wash border border-vermilion/30 px-4 py-1.5 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Grid */}
      <div className="p-3 sm:p-5 bg-paper rounded-xl border border-hairline">
        <div
          className="grid gap-1.5 sm:gap-2 select-none"
          style={{ gridTemplateColumns: `repeat(${puzzle.n}, minmax(44px, 54px))` }}
        >
          {currentGrid.map((row, r) =>
            row.map((val, c) => {
              const isGiven = puzzle.givenMask[r][c];
              const shapeName = val >= 0 ? symbols[val] : null;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  aria-label={`Row ${r + 1} column ${c + 1}${isGiven ? ' locked clue' : ''}`}
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                    isGiven
                      ? 'bg-recessed border-hairline cursor-default'
                      : val >= 0
                      ? 'bg-surface border-ink hover:border-vermilion cursor-pointer'
                      : 'bg-surface border-dashed border-hairline hover:border-ink cursor-pointer'
                  }`}
                >
                  {shapeName && (
                    <Shape
                      name={shapeName}
                      color={isGiven ? 'stone' : 'vermilion'}
                      size={26}
                      filled={true}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Shape Palette */}
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted font-bold">
          Select Shape to Place
        </span>
        <div className="flex items-center gap-2 p-2 bg-paper rounded-xl border border-hairline">
          {symbols.map((sym, idx) => {
            const isSelected = selectedShapeIndex === idx;
            return (
              <button
                key={sym}
                onClick={() => {
                  sound.playClick();
                  setSelectedShapeIndex(idx);
                }}
                aria-label={`Select ${sym}`}
                aria-pressed={isSelected}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-ink border-ink scale-105'
                    : 'bg-surface hover:bg-recessed border-hairline'
                }`}
              >
                <Shape name={sym} color={isSelected ? 'white' : 'ink'} size={26} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCheck}
          className="px-7 py-3 rounded-xl font-semibold text-sm sm:text-base bg-vermilion hover:bg-vermilion-hover text-surface active:scale-[0.98] transition-all cursor-pointer"
        >
          Check Grid
        </button>
        <button
          onClick={() => {
            sound.playWrong();
            api.wrong();
          }}
          className="px-5 py-3 rounded-xl font-semibold text-sm text-ink-secondary bg-surface hover:bg-recessed hover:text-ink border border-hairline active:scale-[0.98] transition-all cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
