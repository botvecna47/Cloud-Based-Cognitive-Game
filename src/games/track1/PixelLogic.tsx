import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameAPI } from '../../types';
import { sound } from '../../utils/sound';

function runs(arr: number[]): number[] {
  const out: number[] = [];
  let cnt = 0;
  arr.forEach(v => {
    if (v) cnt++;
    else {
      if (cnt) {
        out.push(cnt);
        cnt = 0;
      }
    }
  });
  if (cnt) out.push(cnt);
  return out.length ? out : [0];
}

function sameClue(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

export const PixelLogic: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const n = Math.min(4 + Math.floor((L - 1) / 2), 6);

  const puzzle = useMemo(() => {
    // Generate valid nonogram solution
    let sol: number[][] = [];
    let attempts = 0;
    while (attempts < 50) {
      sol = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => (Math.random() < 0.55 ? 1 : 0))
      );
      // Ensure it's not all zeros or all ones
      const totalOnes = sol.flat().reduce((a, b) => a + b, 0);
      if (totalOnes >= 2 && totalOnes <= n * n - 2) break;
      attempts++;
    }

    const rowClues = sol.map(r => runs(r));
    const colClues: number[][] = [];
    for (let c = 0; c < n; c++) {
      const col = [];
      for (let r = 0; r < n; r++) {
        col.push(sol[r][c]);
      }
      colClues.push(runs(col));
    }

    return { n, sol, rowClues, colClues };
  }, [L, n]);

  const [grid, setGrid] = useState<number[][]>([]);

  useEffect(() => {
    setGrid(Array.from({ length: puzzle.n }, () => Array(puzzle.n).fill(0)));
  }, [puzzle]);

  const toggleCell = (r: number, c: number) => {
    sound.playClick();
    setGrid(prev => {
      const next = prev.map((row, ri) =>
        ri === r ? row.map((val, ci) => (ci === c ? (val ? 0 : 1) : val)) : [...row]
      );
      return next;
    });
  };

  const handleCheck = useCallback(() => {
    let ok = true;
    for (let r = 0; r < puzzle.n; r++) {
      if (!sameClue(runs(grid[r]), puzzle.rowClues[r])) {
        ok = false;
        break;
      }
    }
    if (ok) {
      for (let c = 0; c < puzzle.n; c++) {
        const col = [];
        for (let r = 0; r < puzzle.n; r++) {
          col.push(grid[r][c]);
        }
        if (!sameClue(runs(col), puzzle.colClues[c])) {
          ok = false;
          break;
        }
      }
    }

    if (ok) {
      sound.playCorrect();
      api.correct();
    } else {
      sound.playWrong();
      api.wrong();
    }
  }, [grid, puzzle, api]);

  const handleClear = () => {
    sound.playClick();
    setGrid(Array.from({ length: puzzle.n }, () => Array(puzzle.n).fill(0)));
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          Deduce the pixel pattern to match every row and column clue:
        </p>
      </div>

      {/* Nonogram Grid */}
      <div className="p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
        <div
          className="grid gap-1 sm:gap-1.5 items-center justify-center select-none"
          style={{
            gridTemplateColumns: `60px repeat(${puzzle.n}, minmax(40px, 48px))`,
          }}
        >
          {/* Top-left empty corner */}
          <div className="w-full h-12 flex items-center justify-center text-xs text-slate-500 font-bold border-b border-r border-slate-700/60">
            CLUES
          </div>

          {/* Column Clues */}
          {puzzle.colClues.map((clue, cIdx) => (
            <div
              key={cIdx}
              className="h-12 flex flex-col items-center justify-end pb-1 text-xs font-mono font-bold text-cyan-300 border-b border-slate-700/60 leading-tight"
            >
              {clue.map((num, i) => (
                <span key={i}>{num}</span>
              ))}
            </div>
          ))}

          {/* Grid Rows with Row Clues */}
          {grid.map((row, rIdx) => (
            <React.Fragment key={rIdx}>
              {/* Row Clue */}
              <div className="h-10 sm:h-12 flex items-center justify-end pr-2 text-xs font-mono font-bold text-cyan-300 border-r border-slate-700/60 tracking-wider">
                {puzzle.rowClues[rIdx].join(' ')}
              </div>

              {/* Row Cells */}
              {row.map((cellVal, cIdx) => {
                const isFilled = cellVal === 1;
                return (
                  <button
                    key={cIdx}
                    onClick={() => toggleCell(rIdx, cIdx)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all duration-100 flex items-center justify-center cursor-pointer active:scale-95 ${
                      isFilled
                        ? 'bg-gradient-to-br from-cyan-400 to-teal-500 border-cyan-300 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-cyan-500/50'
                    }`}
                  >
                    {isFilled && <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheck}
          className="px-8 py-3 rounded-xl font-bold text-base sm:text-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          Check Solution
        </button>
        <button
          onClick={handleClear}
          className="px-5 py-3 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          Reset Grid
        </button>
      </div>
    </div>
  );
};
