import React, { useMemo } from 'react';
import { GameAPI } from '../../types';
import { Shape, SHAPES, COLORS } from '../../utils/shapes';
import { sound } from '../../utils/sound';

interface InductiveTile {
  s: string;
  col: string;
  cnt: number;
  fill: boolean;
}

function randInt(a: number, b: number) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function sample<T>(arr: T[], k: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

export const InductiveChallenge: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const count = Math.min(4 + Math.floor(L / 2), 6);

  const puzzle = useMemo(() => {
    const useAttrs = L <= 2 ? ['shape', 'color'] : ['shape', 'color', 'count', 'fill'];
    const ruleAttr = useAttrs[Math.floor(Math.random() * useAttrs.length)];

    const colorKeys = Object.keys(COLORS).filter(c => c !== 'white' && c !== 'navy');
    const base: InductiveTile = {
      s: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      col: sample(colorKeys, 1)[0],
      cnt: randInt(1, 3),
      fill: true,
    };

    const odd: InductiveTile = { ...base };

    if (ruleAttr === 'shape') {
      const otherShapes = SHAPES.filter(x => x !== base.s);
      odd.s = otherShapes[Math.floor(Math.random() * otherShapes.length)];
    } else if (ruleAttr === 'color') {
      const otherColors = colorKeys.filter(x => x !== base.col);
      odd.col = otherColors[Math.floor(Math.random() * otherColors.length)];
    } else if (ruleAttr === 'count') {
      odd.cnt = base.cnt >= 3 ? base.cnt - 1 : base.cnt + 1;
    } else {
      odd.fill = !base.fill;
    }

    const oddIndex = Math.floor(Math.random() * count);
    const tiles: InductiveTile[] = [];
    for (let i = 0; i < count; i++) {
      tiles.push(i === oddIndex ? odd : base);
    }

    return {
      tiles,
      oddIndex,
      ruleAttr,
    };
  }, [L, count]);

  const handleTileClick = (index: number) => {
    if (index === puzzle.oddIndex) {
      sound.playCorrect();
      api.correct();
    } else {
      sound.playWrong();
      api.wrong();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          All tiles except one follow a shared rule. Spot the odd one out:
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Look for the single tile that differs in shape, colour, quantity, or fill.
        </p>
      </div>

      {/* Tiles Row */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4 p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl w-full">
        {puzzle.tiles.map((t, idx) => (
          <button
            key={idx}
            onClick={() => handleTileClick(idx)}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 hover:bg-slate-700/90 rounded-2xl border-2 border-slate-700 hover:border-cyan-400 transition-all duration-150 active:scale-95 shadow-md flex items-center justify-center p-2 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {Array.from({ length: t.cnt }).map((_, i) => (
                <Shape key={i} name={t.s} color={t.col} size={28} filled={t.fill} />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="text-slate-400 text-xs text-center">
        Trust the rule you can articulate in words! Click the unique card to submit.
      </div>
    </div>
  );
};
