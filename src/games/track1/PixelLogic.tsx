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
        <p className="text-ink text-base sm:text-lg font-medium">
          Fill cells so every row and column matches its contiguous run clues:
        </p>
      </div>

      {/* Nonogram Grid (fluid responsive sizing so 4x4..6x6 fits cleanly on 320px phones) */}
      <div className="p-3 sm:p-5 bg-paper rounded-xl border border-hairline w-full max-w-[380px]">
        <div
          className="grid gap-1 sm:gap-1.5 items-center justify-center select-none w-full"
          style={{
            gridTemplateColumns: `minmax(40px, 56px) repeat(${puzzle.n}, minmax(0, 1fr))`,
          }}
        >
          {/* Top-left empty corner */}
          <div className="w-full min-h-10 sm:min-h-12 py-1 flex items-center justify-center font-mono text-[9px] sm:text-[10px] tracking-wider text-ink-muted font-bold border-b border-r border-hairline">
            CLUES
          </div>

          {/* Column Clues */}
          {puzzle.colClues.map((clue, cIdx) => (
            <div
              key={cIdx}
              className="min-h-10 sm:min-h-12 py-1 flex flex-col items-center justify-end text-[11px] sm:text-xs font-mono font-bold text-ink border-b border-hairline leading-tight tabular-nums"
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
              <div className="h-full flex items-center justify-end pr-1.5 sm:pr-2.5 text-[11px] sm:text-xs font-mono font-bold text-ink border-r border-hairline tracking-tight sm:tracking-wider tabular-nums">
                {puzzle.rowClues[rIdx].join(' ')}
              </div>

              {/* Row Cells */}
              {row.map((cellVal, cIdx) => {
                const isFilled = cellVal === 1;
                return (
                  <button
                    type="button"
                    key={cIdx}
                    onClick={() => toggleCell(rIdx, cIdx)}
                    aria-pressed={isFilled}
                    aria-label={`Row ${rIdx + 1} column ${cIdx + 1}`}
                    className={`w-full aspect-square max-h-12 rounded-lg border transition-[background-color,border-color,transform] duration-150 ease-out flex items-center justify-center cursor-pointer motion-safe:enabled:active:scale-[0.96] ${
                      isFilled
                        ? 'bg-ink border-ink'
                        : 'bg-surface hover:bg-recessed border-hairline hover:border-ink'
                    }`}
                  >
                    {isFilled && <div className="w-2 h-2 rounded-full bg-vermilion" />}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleCheck}
          className="flex-1 sm:flex-none px-6 sm:px-7 py-3 rounded-xl font-semibold text-sm sm:text-base bg-vermilion hover:bg-vermilion-hover text-surface transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
        >
          Check Solution
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-5 py-3 rounded-xl font-semibold text-sm text-ink bg-surface hover:bg-recessed border border-hairline transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
