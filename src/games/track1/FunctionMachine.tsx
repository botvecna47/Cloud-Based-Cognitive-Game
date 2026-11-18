import React, { useMemo } from 'react';
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

function sample<T>(arr: T[], k: number): T[] {
  return shuffle(arr).slice(0, k);
}

export const FunctionMachine: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;

  const puzzle = useMemo(() => {
    let apply: (x: number) => number;
    let ruleDescription = '';

    if (L <= 2) {
      const k = randInt(2, 5);
      if (Math.random() < 0.5) {
        apply = (x: number) => x + k;
        ruleDescription = `+ ${k}`;
      } else {
        apply = (x: number) => x * k;
        ruleDescription = `× ${k}`;
      }
    } else if (L <= 4) {
      const a = randInt(2, 4);
      const b = randInt(1, 5);
      apply = (x: number) => a * x + b;
      ruleDescription = `× ${a} + ${b}`;
    } else {
      if (Math.random() < 0.5) {
        const b = randInt(1, 5);
        apply = (x: number) => x * x + b;
        ruleDescription = `x² + ${b}`;
      } else {
        const a = randInt(2, 4);
        const b = randInt(1, 6);
        apply = (x: number) => a * x - b;
        ruleDescription = `× ${a} - ${b}`;
      }
    }

    const samplePool = [2, 3, 4, 5, 6, 7, 8, 9];
    const ins = sample(samplePool, 3);
    const examples = ins.map(x => ({ in: x, out: apply(x) }));

    let nx = randInt(2, 12);
    while (ins.includes(nx)) {
      nx = randInt(2, 12);
    }
    const correctAns = apply(nx);

    const optsSet = new Set<number>([correctAns]);
    const offsets = shuffle([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7]);
    for (const off of offsets) {
      if (optsSet.size >= 4) break;
      const v = correctAns + off;
      if (v > 0) optsSet.add(v);
    }
    while (optsSet.size < 4) {
      optsSet.add(correctAns + optsSet.size * 3);
    }

    return {
      examples,
      newIn: nx,
      correctAns,
      options: shuffle([...optsSet]),
      ruleDescription,
    };
  }, [L]);

  const handleSelect = (val: number) => {
    if (val === puzzle.correctAns) {
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
          Deduce the hidden transformation rule from these input-output pairs:
        </p>
      </div>

      {/* Examples Card */}
      <div className="flex flex-col gap-3 w-full p-3.5 sm:p-5 bg-paper rounded-xl border border-hairline">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted font-bold text-center">
          Observed Samples
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {puzzle.examples.map((ex, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-surface py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-lg border border-hairline font-mono text-sm sm:text-xl font-bold tabular-nums"
            >
              <span className="text-ink">{ex.in}</span>
              <span className="text-vermilion font-sans">→</span>
              <span className="text-ink">{ex.out}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Question */}
      <div className="flex items-center justify-center gap-3 bg-ink text-surface px-5 sm:px-6 py-3 rounded-xl">
        <span className="font-mono text-xs uppercase tracking-wider text-surface/70 font-bold">
          Solve
        </span>
        <span className="text-2xl sm:text-3xl font-mono font-bold tabular-nums">{puzzle.newIn}</span>
        <span className="text-vermilion text-xl font-sans font-bold">→</span>
        <span className="text-2xl font-mono font-bold text-surface bg-vermilion px-3 py-0.5 rounded-lg">
          ?
        </span>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 w-full">
        {puzzle.options.map((opt, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => handleSelect(opt)}
            className="py-4 px-4 sm:px-6 rounded-xl font-mono text-2xl sm:text-3xl font-bold bg-surface hover:bg-recessed text-ink border border-hairline hover:border-ink transition-[background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] flex items-center justify-center cursor-pointer tabular-nums"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
