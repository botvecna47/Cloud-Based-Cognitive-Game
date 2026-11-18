import React, { useMemo } from 'react';
import { GameAPI } from '../../types';
import { Shape, SHAPES } from '../../utils/shapes';
import { sound } from '../../utils/sound';

interface SwitchItem {
  s: string;
  c: string;
}

const DISTINCT_SHAPE_COLORS = ['ink', 'vermilion', 'blue', 'green', 'amber', 'purple'] as const;

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
    const colorKeys = sample([...DISTINCT_SHAPE_COLORS], 3);

    const makeUniqueSeq = (): SwitchItem[] => {
      const seqShapes = sample([...SHAPES], len);
      return seqShapes.map(s => ({
        s,
        c: colorKeys[Math.floor(Math.random() * colorKeys.length)],
      }));
    };

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

    const exampleIn = makeUniqueSeq();
    const exampleOut = ruleFn(exampleIn);

    const newIn = makeUniqueSeq();
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
      const rnd = shuffle(newIn);
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

  const renderRow = (items: SwitchItem[], size = 30) => (
    <div className="flex items-center justify-center gap-2">
      {items.map((it, idx) => (
        <div
          key={idx}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-surface rounded-xl border border-hairline flex items-center justify-center"
        >
          <Shape name={it.s} color={it.c} size={size} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-ink text-base sm:text-lg font-medium">
          Deduce how the permutation switch rearranges the sequence:
        </p>
      </div>

      {/* Demonstration Example */}
      <div className="flex flex-col items-center gap-2.5 p-4 sm:p-5 bg-paper rounded-xl border border-hairline w-full">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted font-bold">
          Example Transformation
        </span>
        {renderRow(puzzle.exampleIn, 28)}
        <div className="px-4 py-1 rounded-md bg-ink text-surface font-mono font-bold text-[11px] uppercase tracking-[0.16em] inline-flex items-center gap-1.5">
          <span>SWITCH</span>
          <span className="text-vermilion">↓</span>
        </div>
        {renderRow(puzzle.exampleOut, 28)}
      </div>

      {/* Question Prompt */}
      <div className="flex flex-col items-center gap-2 w-full">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-vermilion">
          New Input Entering Switch
        </p>
        <div className="p-3 bg-paper rounded-xl border border-hairline">
          {renderRow(puzzle.newIn, 28)}
        </div>
      </div>

      <p className="text-xs text-ink-muted text-center">
        Select the output sequence produced by the same rule:
      </p>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {puzzle.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(opt)}
            className="p-3 bg-surface hover:bg-recessed rounded-xl border border-hairline hover:border-ink transition-all duration-150 active:scale-[0.98] flex items-center justify-center cursor-pointer"
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
