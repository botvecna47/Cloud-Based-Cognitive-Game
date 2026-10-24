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
          setErrorMsg('Fill every cell before checking!');
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
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          Each shape must appear exactly once in every row and column:
        </p>
      </div>

      {errorMsg && (
        <div className="text-xs sm:text-sm font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-4 py-1.5 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Grid */}
      <div className="p-3 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl">
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
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                    isGiven
                      ? 'bg-slate-800/60 border-slate-700/60 cursor-default opacity-90'
                      : val >= 0
                      ? 'bg-slate-800 border-cyan-400 hover:border-cyan-300 shadow-sm cursor-pointer'
                      : 'bg-slate-800/90 border-dashed border-slate-600 hover:border-cyan-400/80 cursor-pointer'
                  }`}
                >
                  {shapeName && (
                    <Shape
                      name={shapeName}
                      color={isGiven ? 'teal' : 'cyan'}
                      size={28}
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
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Select Shape to Place
        </span>
        <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded-2xl border border-slate-800">
          {symbols.map((sym, idx) => {
            const isSelected = selectedShapeIndex === idx;
            return (
              <button
                key={sym}
                onClick={() => {
                  sound.playClick();
                  setSelectedShapeIndex(idx);
                }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-2 border-cyan-400 ring-4 ring-cyan-400/30 scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 border-2 border-slate-700'
                }`}
              >
                <Shape name={sym} color={isSelected ? 'cyan' : 'white'} size={28} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheck}
          className="px-8 py-3 rounded-xl font-bold text-base sm:text-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          Check Grid
        </button>
        <button
          onClick={() => {
            sound.playWrong();
            api.wrong();
          }}
          className="px-5 py-3 rounded-xl font-semibold text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
