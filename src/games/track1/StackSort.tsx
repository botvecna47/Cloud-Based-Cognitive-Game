import React, { useState, useEffect, useRef } from 'react';
import { GameAPI } from '../../types';
import { sound } from '../../utils/sound';

// Strict 3-color tonal palette (Vermilion & Charcoal Ink spectrum)
const DISK_STYLES = [
  'bg-vermilion text-surface border-vermilion-hover',
  'bg-ink text-surface border-ink',
  'bg-ink-secondary text-surface border-ink',
  'bg-vermilion-hover text-surface border-ink',
  'bg-ink-muted text-surface border-ink-secondary',
  'bg-recessed text-ink border-ink',
];

export const StackSort: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const numDisks = Math.min(2 + L, 5);

  const [pegs, setPegs] = useState<number[][]>([[], [], []]);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const winTimeoutRef = useRef<number | null>(null);

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
    setIsSolved(false);
    return () => {
      if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    };
  }, [L, numDisks]);

  const handlePegClick = (pegIndex: number) => {
    if (isSolved) return;
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
      setErrorMsg('Cannot place a larger disk on top of a smaller one.');
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
      setIsSolved(true);
      sound.playCorrect();
      winTimeoutRef.current = window.setTimeout(() => {
        api.correct({ moves: newMoves });
      }, 250);
    }
  };

  const minMoves = Math.pow(2, numDisks) - 1;

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        <p className="text-ink text-base sm:text-lg font-medium">
          Transfer all <strong className="font-mono font-bold text-vermilion">{numDisks}</strong> disks to the Target peg.
        </p>
        <div className="flex items-center justify-center gap-3 mt-2.5">
          <span className="font-mono text-xs text-ink-secondary">
            Moves: <strong className="text-ink text-sm tabular-nums">{moves}</strong>
          </span>
          <span className="font-mono text-[11px] text-ink-muted bg-paper border border-hairline px-2.5 py-0.5 rounded-md">
            Optimal: {minMoves}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="text-xs sm:text-sm font-medium text-vermilion bg-vermilion-wash border border-vermilion/30 px-4 py-1.5 rounded-lg animate-shake">
          {errorMsg}
        </div>
      )}

      {/* Pegs Board */}
      <div className="grid grid-cols-3 gap-2 sm:gap-5 w-full p-2.5 sm:p-6 bg-paper rounded-xl border border-hairline min-h-[240px] sm:min-h-[260px] items-end">
        {pegs.map((pegDisks, pegIdx) => {
          const isSelected = selectedPeg === pegIdx;
          const label = pegIdx === 0 ? 'Start' : pegIdx === 1 ? 'Aux' : 'Target';

          return (
            <button
              type="button"
              key={pegIdx}
              onClick={() => handlePegClick(pegIdx)}
              aria-label={`${label} peg with ${pegDisks.length} disks${isSelected ? ', selected' : ''}`}
              className={`relative flex flex-col items-center justify-end h-52 sm:h-56 rounded-xl cursor-pointer transition-[background-color,border-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] p-1.5 sm:p-2 ${
                isSelected
                  ? 'bg-vermilion-wash border-2 border-vermilion'
                  : 'bg-surface/60 hover:bg-surface border-2 border-transparent hover:border-hairline'
              }`}
            >
              {/* Vertical Pole */}
              <div
                className={`absolute bottom-9 w-2 sm:w-2.5 rounded-t-full transition-colors duration-150 ${
                  isSelected ? 'bg-vermilion' : 'bg-hairline'
                }`}
                style={{ height: '150px' }}
              />

              {/* Stacked Disks */}
              <div className="relative z-10 flex flex-col-reverse items-center gap-1 sm:gap-1.5 w-full pb-1">
                {pegDisks.map(disk => {
                  const widthPct = 40 + disk * 11;
                  const diskStyle = DISK_STYLES[(disk - 1) % DISK_STYLES.length];
                  return (
                    <div
                      key={disk}
                      style={{ width: `${widthPct}%` }}
                      className={`h-6 sm:h-7 rounded-md border flex items-center justify-center text-[11px] sm:text-xs font-mono font-bold transition-[width] duration-150 ${diskStyle}`}
                    >
                      {disk}
                    </div>
                  );
                })}
              </div>

              {/* Base Platform */}
              <div
                className={`w-full h-2.5 rounded-sm transition-colors duration-150 ${
                  isSelected ? 'bg-vermilion' : 'bg-ink'
                }`}
              />

              {/* Peg Label */}
              <span
                className={`mt-2 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-vermilion' : pegIdx === 2 ? 'text-vermilion' : 'text-ink-muted'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-ink-muted text-xs text-center">
        Select a peg to lift its top disk, then select another peg to place it.
      </p>
    </div>
  );
};
