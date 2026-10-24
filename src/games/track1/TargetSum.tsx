import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameAPI } from '../../types';
import { sound } from '../../utils/sound';

function randInt(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const TargetSum: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;

  const puzzle = useMemo(() => {
    const nTiles = Math.min(6 + Math.floor(L / 2), 10);
    const maxVal = 6 + L;
    const solSize = Math.min(2 + Math.floor(L / 3), 4);

    let target = 0;
    const solVals: number[] = [];
    for (let i = 0; i < solSize; i++) {
      const v = randInt(1, maxVal);
      solVals.push(v);
      target += v;
    }

    const tiles = [...solVals];
    while (tiles.length < nTiles) {
      tiles.push(randInt(1, maxVal));
    }

    return {
      target,
      tiles: shuffle(tiles).map((val, idx) => ({ id: idx, val })),
    };
  }, [L]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [puzzle]);

  const currentTotal = useMemo(() => {
    let sum = 0;
    puzzle.tiles.forEach(t => {
      if (selectedIds.has(t.id)) sum += t.val;
    });
    return sum;
  }, [puzzle.tiles, selectedIds]);

  const toggleTile = (id: number) => {
    sound.playClick();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCheck = useCallback(() => {
    if (currentTotal === puzzle.target && selectedIds.size > 0) {
      sound.playCorrect();
      api.correct();
    } else {
      sound.playWrong();
      api.wrong();
    }
  }, [currentTotal, puzzle.target, selectedIds.size, api]);

  const handleClear = () => {
    sound.playClick();
    setSelectedIds(new Set());
  };

  const isMatching = currentTotal === puzzle.target;
  const isOver = currentTotal > puzzle.target;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          Select numbers that add up to{' '}
          <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 font-bold rounded-lg border border-cyan-400/30 text-2xl mx-1 shadow-sm">
            {puzzle.target}
          </span>
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Current Sum:</span>
          <span
            className={`font-mono text-xl font-extrabold transition-colors duration-200 ${
              isMatching
                ? 'text-emerald-400 animate-pulse'
                : isOver
                ? 'text-rose-400'
                : 'text-cyan-400'
            }`}
          >
            {currentTotal}
          </span>
          {isMatching && <span className="text-emerald-400 text-xs font-bold">✓ Target Matched</span>}
        </div>
      </div>

      {/* Number Chips */}
      <div className="flex flex-wrap justify-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-lg w-full">
        {puzzle.tiles.map(tile => {
          const isSelected = selectedIds.has(tile.id);
          return (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl font-mono text-2xl sm:text-3xl font-extrabold transition-all duration-150 transform active:scale-95 flex items-center justify-center cursor-pointer select-none shadow-md ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-slate-950 ring-4 ring-cyan-400/40 scale-105 shadow-cyan-500/25'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-white border-2 border-slate-700 hover:border-cyan-500/60'
              }`}
            >
              {tile.val}
            </button>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={handleCheck}
          className="px-8 py-3 rounded-xl font-bold text-base sm:text-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          Check Sum
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-3 rounded-xl font-semibold text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};
