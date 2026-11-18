import React, { useMemo } from 'react';
import { GameAPI } from '../../types';
import { Shape, SHAPES } from '../../utils/shapes';
import { sound } from '../../utils/sound';

interface InductiveTile {
  s: string;
  col: string;
  cnt: number;
  fill: boolean;
}

const DISTINCT_SHAPE_COLORS = ['ink', 'vermilion', 'blue', 'green', 'amber', 'purple'] as const;

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

    const colorKeys = [...DISTINCT_SHAPE_COLORS];
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
        <p className="text-ink text-base sm:text-lg font-medium">
          Every tile except one shares a rule. Select the odd one out:
        </p>
        <p className="text-xs text-ink-muted mt-1">
          Check shape, color, quantity, and solid/hollow fill.
        </p>
      </div>

      {/* Tiles Row */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4 p-3.5 sm:p-5 bg-paper rounded-xl border border-hairline w-full">
        {puzzle.tiles.map((t, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => handleTileClick(idx)}
            className="h-20 sm:w-24 sm:h-24 bg-surface hover:bg-recessed rounded-xl border border-hairline hover:border-ink transition-[background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] flex items-center justify-center p-2 cursor-pointer"
          >
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {Array.from({ length: t.cnt }).map((_, i) => (
                <Shape key={i} name={t.s} color={t.col} size={26} filled={t.fill} />
              ))}
            </div>
          </button>
        ))}
      </div>

      <p className="text-ink-muted text-xs text-center">
        Select the single card that breaks the group pattern.
      </p>
    </div>
  );
};
