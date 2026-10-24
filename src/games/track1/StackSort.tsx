import React, { useState, useEffect } from 'react';
import { GameAPI } from '../../types';
import { sound } from '../../utils/sound';

const DISK_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-400 to-amber-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-red-600',
  'from-cyan-400 to-cyan-600',
];

export const StackSort: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const numDisks = Math.min(2 + L, 5);

  const [pegs, setPegs] = useState<number[][]>([[], [], []]);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize Hanoi
  useEffect(() => {
    const initialFirstPeg: number[] = [];
    for (let d = numDisks; d >= 1; d--) {
      initialFirstPeg.push(d);
    }
    setPegs([initialFirstPeg, [], []]);
    setSelectedPeg(null);
    setMoves(0);
    setErrorMsg(null);
  }, [L, numDisks]);

  const handlePegClick = (pegIndex: number) => {
    setErrorMsg(null);

    // If nothing selected yet
    if (selectedPeg === null) {
      if (pegs[pegIndex].length === 0) return;
      sound.playClick();
      setSelectedPeg(pegIndex);
      return;
    }

    // If clicking same peg again -> deselect
    if (selectedPeg === pegIndex) {
      sound.playClick();
      setSelectedPeg(null);
      return;
    }

    // Move from selectedPeg to pegIndex
    const source = [...pegs[selectedPeg]];
    const dest = [...pegs[pegIndex]];
    const diskToMove = source[source.length - 1];
    const topOfDest = dest.length > 0 ? dest[dest.length - 1] : Infinity;

    if (diskToMove > topOfDest) {
      sound.playWrong();
      setErrorMsg('Cannot place a larger disk on top of a smaller one!');
      setSelectedPeg(null);
      return;
    }

    // Valid move
    source.pop();
    dest.push(diskToMove);

    const nextPegs = pegs.map((p, idx) => {
      if (idx === selectedPeg) return source;
      if (idx === pegIndex) return dest;
      return p;
    });

    sound.playClick();
    setPegs(nextPegs);
    setSelectedPeg(null);
    const newMoves = moves + 1;
    setMoves(newMoves);

    // Check win condition (all disks on peg 2)
    if (pegIndex === 2 && dest.length === numDisks) {
      sound.playCorrect();
      setTimeout(() => {
        api.correct();
      }, 250);
    }
  };

  const minMoves = Math.pow(2, numDisks) - 1;

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-slate-200 text-lg sm:text-xl font-medium">
          Move all <strong className="text-cyan-300 font-bold">{numDisks}</strong> disks to the rightmost peg.
        </p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-sm text-slate-400">
            Moves: <strong className="text-white font-mono text-base">{moves}</strong>
          </span>
          <span className="text-xs text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded-md">
            Optimal: {minMoves} moves
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="text-xs sm:text-sm font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/40 px-4 py-1.5 rounded-lg animate-shake">
          {errorMsg}
        </div>
      )}

      {/* Pegs Board */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full p-4 sm:p-6 bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl min-h-[260px] items-end">
        {pegs.map((pegDisks, pegIdx) => {
          const isSelected = selectedPeg === pegIdx;
          const label = pegIdx === 0 ? 'Start' : pegIdx === 1 ? 'Aux' : 'Target 🎯';

          return (
            <div
              key={pegIdx}
              onClick={() => handlePegClick(pegIdx)}
              className={`relative flex flex-col items-center justify-end h-56 rounded-xl cursor-pointer transition-all duration-150 p-2 ${
                isSelected
                  ? 'bg-cyan-500/15 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'hover:bg-slate-800/60 border-2 border-transparent'
              }`}
            >
              {/* Vertical Pole */}
              <div
                className={`absolute bottom-3 w-3 rounded-t-full transition-colors ${
                  isSelected ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
                style={{ height: '170px' }}
              />

              {/* Stacked Disks */}
              <div className="relative z-10 flex flex-col-reverse items-center gap-1.5 w-full pb-1">
                {pegDisks.map(disk => {
                  const widthPct = 34 + disk * 14;
                  const colorGradient = DISK_COLORS[(disk - 1) % DISK_COLORS.length];
                  return (
                    <div
                      key={disk}
                      style={{ width: `${widthPct}%` }}
                      className={`h-7 rounded-lg bg-gradient-to-r ${colorGradient} shadow-md border border-white/20 flex items-center justify-center text-xs font-mono font-bold text-white transition-all`}
                    >
                      {disk}
                    </div>
                  );
                })}
              </div>

              {/* Base Platform */}
              <div
                className={`w-full h-3 rounded-md transition-colors ${
                  isSelected ? 'bg-cyan-400' : 'bg-slate-700'
                }`}
              />

              {/* Peg Label */}
              <span
                className={`mt-2 text-xs font-semibold uppercase tracking-wider ${
                  isSelected ? 'text-cyan-300' : pegIdx === 2 ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-slate-400 text-xs text-center">
        Click a peg to select its top disk, then click another peg to move it there.
      </div>
    </div>
  );
};
