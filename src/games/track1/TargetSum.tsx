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

  const isMatching = currentTotal === puzzle.target && selectedIds.size > 0;
  const isOver = currentTotal > puzzle.target;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted font-bold mb-2">
          TARGET EQUATION
        </p>
        <p className="text-ink text-base sm:text-lg font-medium flex items-center justify-center flex-wrap gap-2">
          <span>Select tiles that sum exactly to</span>
          <span className="inline-flex items-center justify-center px-3.5 py-1 bg-ink text-surface font-mono font-bold rounded-lg text-2xl sm:text-3xl tracking-tight">
            {puzzle.target}
          </span>
        </p>

        <div
          className={`mt-4 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border transition-colors ${
            isMatching
              ? 'bg-ink text-surface border-ink'
              : isOver
              ? 'bg-vermilion-wash text-vermilion border-vermilion/40'
              : 'bg-paper text-ink border-hairline'
          }`}
        >
          <span
            className={`font-mono text-[11px] uppercase tracking-wider font-bold ${
              isMatching ? 'text-surface/75' : isOver ? 'text-vermilion' : 'text-ink-muted'
            }`}
          >
            Current Sum
          </span>
          <span className="font-mono text-xl font-bold tabular-nums">{currentTotal}</span>
          {isMatching && (
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-vermilion">
              ✓ Matched
            </span>
          )}
          {isOver && (
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold">
              Over
            </span>
          )}
        </div>
      </div>

      {/* Number Chips */}
      <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 p-3.5 sm:p-5 bg-paper rounded-xl border border-hairline w-full">
        {puzzle.tiles.map(tile => {
          const isSelected = selectedIds.has(tile.id);
          return (
            <button
              type="button"
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              aria-pressed={isSelected}
              className={`w-13 h-13 sm:w-16 sm:h-16 rounded-xl font-mono text-xl sm:text-3xl font-bold transition-[transform,background-color,border-color,color] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] flex items-center justify-center cursor-pointer select-none border ${
                isSelected
                  ? 'bg-ink text-surface border-ink ring-2 ring-vermilion/60 motion-safe:-translate-y-0.5 shadow-sm'
                  : 'bg-surface hover:bg-recessed text-ink border-hairline hover:border-ink'
              }`}
            >
              {tile.val}
            </button>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-center gap-3 w-full sm:w-auto mt-1">
        <button
          type="button"
          onClick={handleCheck}
          className="flex-1 sm:flex-none px-6 sm:px-7 py-3 rounded-xl font-semibold text-sm sm:text-base bg-vermilion hover:bg-vermilion-hover text-surface transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
        >
          Check Sum
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-5 py-3 rounded-xl font-semibold text-sm text-ink bg-surface hover:bg-recessed border border-hairline transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
