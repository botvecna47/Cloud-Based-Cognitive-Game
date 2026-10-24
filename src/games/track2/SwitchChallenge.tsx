import React, { useMemo } from 'react';
import { GameAPI } from '../../types';
import { Shape, SHAPES, COLORS } from '../../utils/shapes';
import { sound } from '../../utils/sound';

interface SwitchItem {
  s: string;
  c: string;
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

function sameSeq(a: SwitchItem[], b: SwitchItem[]): boolean {
  return a.length === b.length && a.every((x, i) => x.s === b[i].s && x.c === b[i].c);
}

export const SwitchChallenge: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const len = Math.min(3 + Math.floor(L / 2), 5);

  const puzzle = useMemo(() => {
    const palette = sample([...SHAPES], len);
    const colorKeys = sample(Object.keys(COLORS).filter(c => c !== 'white' && c !== 'navy'), 3);

    const makeItem = (): SwitchItem => ({
      s: palette[Math.floor(Math.random() * palette.length)],
      c: colorKeys[Math.floor(Math.random() * colorKeys.length)],
    });

    const perms: Record<string, (arr: SwitchItem[]) => SwitchItem[]> = {
      reverse: arr => arr.slice().reverse(),
      shiftR: arr => [arr[arr.length - 1], ...arr.slice(0, arr.length - 1)],
      shiftL: arr => [...arr.slice(1), arr[0]],
      swapEnds: arr => {
        const a = arr.slice();
        [a[0], a[a.length - 1]] = [a[a.length - 1], a[0]];
        return a;
      },
    };

    const ruleKeys = L <= 2 ? ['reverse', 'shiftR'] : Object.keys(perms);
    const chosenRuleKey = ruleKeys[Math.floor(Math.random() * ruleKeys.length)];
    const ruleFn = perms[chosenRuleKey];

    const exampleIn = Array.from({ length: len }, makeItem);
    const exampleOut = ruleFn(exampleIn);

    const newIn = Array.from({ length: len }, makeItem);
    const correct = ruleFn(newIn);

    const optionSet = [correct];
    const otherCandidates = Object.values(perms).map(fn => fn(newIn));
    for (const opt of shuffle(otherCandidates)) {
      if (optionSet.length >= 4) break;
      if (!sameSeq(opt, correct) && !optionSet.some(x => sameSeq(x, opt))) {
        optionSet.push(opt);
      }
    }
    while (optionSet.length < 4) {
      const rnd = Array.from({ length: len }, makeItem);
      if (!optionSet.some(x => sameSeq(x, rnd))) {
        optionSet.push(rnd);
      }
    }

    return {
      exampleIn,
      exampleOut,
      newIn,
      correct,
      options: shuffle(optionSet),
    };
  }, [L, len]);

  const handleSelect = (option: SwitchItem[]) => {
    if (sameSeq(option, puzzle.correct)) {
      sound.playCorrect();
      api.correct();
    } else {
      sound.playWrong();
      api.wrong();
    }
  };

  const renderRow = (items: SwitchItem[], size = 32) => (
    <div className="flex items-center justify-center gap-2">
      {items.map((it, idx) => (
        <div
          key={idx}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center shadow-inner"
        >
          <Shape name={it.s} color={it.c} size={size} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          Deduce how the switch rearranges the items:
        </p>
      </div>

      {/* Demonstration Example */}
      <div className="flex flex-col items-center gap-2.5 p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl w-full">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Example Transformation</span>
        {renderRow(puzzle.exampleIn, 30)}
        <div className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-mono font-bold text-xs uppercase tracking-widest shadow-md">
          SWITCH ⮯
        </div>
        {renderRow(puzzle.exampleOut, 30)}
      </div>

      {/* Question Prompt */}
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="text-sm font-semibold text-cyan-300">New sequence enters the switch:</p>
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          {renderRow(puzzle.newIn, 28)}
        </div>
      </div>

      <div className="text-xs text-slate-400 text-center">
        Which of the 4 options below represents the correct output sequence?
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
        {puzzle.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(opt)}
            className="p-3 bg-slate-800 hover:bg-slate-700/90 rounded-xl border-2 border-slate-700 hover:border-cyan-400 transition-all duration-150 active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              {opt.map((item, i) => (
                <div key={i} className="p-1">
                  <Shape name={item.s} color={item.c} size={24} />
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
