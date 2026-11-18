import React, { useMemo } from 'react';
import { GameAPI } from '../../types';
import { Shape, SHAPES } from '../../utils/shapes';
import { sound } from '../../utils/sound';

interface MatrixTile {
  s: string;
  c: string;
  n: number;
  f: boolean;
}

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

function sample<T>(arr: T[], k: number): T[] {
  return shuffle(arr).slice(0, k);
}

function nextIn<T>(arr: T[], v: T): T {
  const idx = arr.indexOf(v);
  return arr[(idx + 1) % arr.length];
}

function sameTile(a: MatrixTile, b: MatrixTile): boolean {
  return a.s === b.s && a.c === b.c && a.n === b.n && a.f === b.f;
}

export const MatrixComplete: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;

  const puzzle = useMemo(() => {
    const shapesPool = sample([...SHAPES], 3);
    const colorsPool = sample(['red', 'green', 'amber', 'purple', 'blue'], 3);

    const makeTile = (): MatrixTile => ({
      s: shapesPool[Math.floor(Math.random() * shapesPool.length)],
      c: colorsPool[Math.floor(Math.random() * colorsPool.length)],
      n: randInt(1, 3),
      f: true,
    });

    const transforms = [
      (t: MatrixTile): MatrixTile => ({ ...t, c: nextIn(colorsPool, t.c) }),
      (t: MatrixTile): MatrixTile => ({ ...t, n: t.n >= 3 ? 1 : t.n + 1 }),
      (t: MatrixTile): MatrixTile => ({ ...t, s: nextIn(shapesPool, t.s) }),
      (t: MatrixTile): MatrixTile => ({ ...t, f: !t.f }),
    ];

    const activeTf =
      L <= 2
        ? transforms[Math.floor(Math.random() * 2)]
        : transforms[Math.floor(Math.random() * transforms.length)];

    const A = makeTile();
    const B = activeTf(A);

    let C = makeTile();
    while (sameTile(C, A)) {
      C = makeTile();
    }
    const correct = activeTf(C);

    const optionsSet: MatrixTile[] = [correct];
    const otherTransforms = shuffle(transforms.filter(tf => tf !== activeTf));
    for (const wt of otherTransforms) {
      if (optionsSet.length >= 4) break;
      const o = wt(C);
      if (!optionsSet.some(x => sameTile(x, o))) {
        optionsSet.push(o);
      }
    }
    while (optionsSet.length < 4) {
      const o = makeTile();
      if (!optionsSet.some(x => sameTile(x, o))) {
        optionsSet.push(o);
      }
    }

    return {
      A,
      B,
      C,
      correct,
      options: shuffle(optionsSet),
    };
  }, [L]);

  const handleSelect = (tile: MatrixTile) => {
    if (sameTile(tile, puzzle.correct)) {
      sound.playCorrect();
      api.correct();
    } else {
      sound.playWrong();
      api.wrong();
    }
  };

  const renderTileContent = (tile: MatrixTile, size = 26) => {
    return (
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {Array.from({ length: tile.n }).map((_, i) => (
          <Shape key={i} name={tile.s} color={tile.c} size={size} filled={tile.f} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-ink text-base sm:text-lg font-medium">
          A is to B as C is to which tile? Complete the 2×2 matrix:
        </p>
      </div>

      {/* 2x2 Matrix */}
      <div className="grid grid-cols-2 gap-3.5 p-4 bg-paper rounded-xl border border-hairline">
        {/* Cell A */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-surface rounded-xl border border-hairline flex items-center justify-center p-2">
          {renderTileContent(puzzle.A, 30)}
        </div>

        {/* Cell B */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-surface rounded-xl border border-hairline flex items-center justify-center p-2">
          {renderTileContent(puzzle.B, 30)}
        </div>

        {/* Cell C */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-surface rounded-xl border border-hairline flex items-center justify-center p-2">
          {renderTileContent(puzzle.C, 30)}
        </div>

        {/* Question Mark Target Cell */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-vermilion-wash rounded-xl border-2 border-dashed border-vermilion flex items-center justify-center font-mono font-bold text-4xl text-vermilion">
          ?
        </div>
      </div>

      <p className="text-ink-muted text-xs sm:text-sm text-center">
        Identify the transformation across the top row and apply it to the bottom row.
      </p>

      {/* 4 Candidate Options */}
      <div className="grid grid-cols-2 gap-3.5 w-full">
        {puzzle.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(opt)}
            className="h-20 sm:h-24 bg-surface hover:bg-recessed rounded-xl border border-hairline hover:border-ink transition-all duration-150 active:scale-[0.98] flex items-center justify-center p-2 cursor-pointer"
          >
            {renderTileContent(opt, 28)}
          </button>
        ))}
      </div>
    </div>
  );
};
