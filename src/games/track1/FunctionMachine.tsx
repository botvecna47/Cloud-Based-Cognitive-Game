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
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          The machine follows one secret rule. Discover it from the examples:
        </p>
      </div>

      {/* Examples Card */}
      <div className="flex flex-col gap-3 w-full p-4 sm:p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl">
        <div className="text-xs uppercase tracking-wider text-cyan-400/80 font-bold text-center">
          Sample Input & Output Pairs
        </div>
        <div className="grid grid-cols-3 gap-3">
          {puzzle.examples.map((ex, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center gap-2 bg-slate-800/90 py-3 px-2 rounded-xl border border-slate-700 font-mono text-lg sm:text-xl font-extrabold"
            >
              <span className="text-white">{ex.in}</span>
              <span className="text-cyan-400 font-sans">➔</span>
              <span className="text-cyan-300">{ex.out}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Question */}
      <div className="flex items-center justify-center gap-3 bg-cyan-950/40 border border-cyan-500/30 px-6 py-3 rounded-xl">
        <span className="text-slate-300 text-base sm:text-lg">New input:</span>
        <span className="text-2xl sm:text-3xl font-mono font-black text-white">{puzzle.newIn}</span>
        <span className="text-cyan-400 text-xl font-sans font-bold">➔</span>
        <span className="text-2xl font-mono font-black text-cyan-300 bg-cyan-500/20 px-3 py-0.5 rounded-lg border border-cyan-400/40">
          ?
        </span>
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {puzzle.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(opt)}
            className="py-4 px-6 rounded-xl font-mono text-2xl sm:text-3xl font-bold bg-slate-800 hover:bg-slate-700/90 text-white border-2 border-slate-700 hover:border-cyan-400 transition-all duration-150 active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
