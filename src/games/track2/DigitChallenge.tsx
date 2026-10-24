import React, { useState, useEffect, useMemo } from 'react';
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

export const DigitChallenge: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;

  const puzzle = useMemo(() => {
    const ops = L <= 1 ? ['+'] : L <= 2 ? ['+', '-'] : ['+', '-', '*'];
    const terms = L <= 3 ? 2 : 3;

    for (let attempt = 0; attempt < 500; attempt++) {
      const nums = [randInt(1, 9)];
      const usedOps: string[] = [];
      for (let i = 0; i < terms - 1; i++) {
        nums.push(randInt(1, 9));
        usedOps.push(ops[Math.floor(Math.random() * ops.length)]);
      }

      let val = nums[0];
      for (let i = 0; i < usedOps.length; i++) {
        const o = usedOps[i];
        const n = nums[i + 1];
        if (o === '+') val += n;
        else if (o === '-') val -= n;
        else val *= n;
      }

      if (val >= 0 && val <= 9) {
        const rhs = val;
        const solution = [...nums, rhs];
        const bank = [...solution];
        const extra = L >= 2 ? 1 : 0;
        for (let e = 0; e < extra; e++) {
          bank.push(randInt(0, 9));
        }

        return {
          terms,
          usedOps,
          solution,
          bank: shuffle(bank).map((d, idx) => ({ id: idx, digit: d })),
          numSlots: terms + 1, // terms on left + 1 for rhs
        };
      }
    }

    // fallback
    return {
      terms: 2,
      usedOps: ['+'],
      solution: [2, 3, 5],
      bank: shuffle([2, 3, 5]).map((d, idx) => ({ id: idx, digit: d })),
      numSlots: 3,
    };
  }, [L]);

  // slot assignments: slotIndex -> chipId
  const [slotAssignments, setSlotAssignments] = useState<Record<number, number>>({});
  const [selectedChipId, setSelectedChipId] = useState<number | null>(null);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  useEffect(() => {
    setSlotAssignments({});
    setSelectedChipId(null);
    setSelectedSlotIdx(null);
  }, [puzzle]);

  // Set of chip IDs currently placed in any slot
  const usedChipIds = useMemo(() => {
    return new Set(Object.values(slotAssignments));
  }, [slotAssignments]);

  const handleChipClick = (chipId: number) => {
    if (usedChipIds.has(chipId)) return;
    sound.playClick();

    if (selectedSlotIdx !== null) {
      // Place chip into already selected slot
      setSlotAssignments(prev => ({
        ...prev,
        [selectedSlotIdx]: chipId,
      }));
      setSelectedSlotIdx(null);
      setSelectedChipId(null);
    } else {
      setSelectedChipId(prev => (prev === chipId ? null : chipId));
    }
  };

  const handleSlotClick = (slotIdx: number) => {
    sound.playClick();
    // If slot has a chip and no chip is selected to overwrite, clear it
    if (slotAssignments[slotIdx] !== undefined && selectedChipId === null) {
      setSlotAssignments(prev => {
        const next = { ...prev };
        delete next[slotIdx];
        return next;
      });
      setSelectedSlotIdx(null);
      return;
    }

    // If a chip is currently selected, place it here
    if (selectedChipId !== null) {
      setSlotAssignments(prev => ({
        ...prev,
        [slotIdx]: selectedChipId,
      }));
      setSelectedChipId(null);
      setSelectedSlotIdx(null);
      return;
    }

    // Otherwise toggle select slot
    setSelectedSlotIdx(prev => (prev === slotIdx ? null : slotIdx));
  };

  const handleCheck = () => {
    // Ensure all slots are filled
    for (let i = 0; i < puzzle.numSlots; i++) {
      if (slotAssignments[i] === undefined) {
        sound.playWrong();
        return;
      }
    }

    // Evaluate
    const leftNums: number[] = [];
    for (let i = 0; i < puzzle.terms; i++) {
      const chipId = slotAssignments[i];
      const chip = puzzle.bank.find(c => c.id === chipId);
      if (!chip) return;
      leftNums.push(chip.digit);
    }

    const rhsChipId = slotAssignments[puzzle.numSlots - 1];
    const rhsChip = puzzle.bank.find(c => c.id === rhsChipId);
    if (!rhsChip) return;
    const rhsVal = rhsChip.digit;

    let v = leftNums[0];
    for (let i = 0; i < puzzle.usedOps.length; i++) {
      const op = puzzle.usedOps[i];
      const nextNum = leftNums[i + 1];
      if (op === '+') v += nextNum;
      else if (op === '-') v -= nextNum;
      else v *= nextNum;
    }

    if (v === rhsVal) {
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
          Place digits into the slots to make the equation true:
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Operations are evaluated left to right. Each bank digit is used once.
        </p>
      </div>

      {/* Equation Layout */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl">
        {Array.from({ length: puzzle.terms }).map((_, i) => {
          const chipId = slotAssignments[i];
          const chip = puzzle.bank.find(c => c.id === chipId);
          const isSlotActive = selectedSlotIdx === i;

          return (
            <React.Fragment key={i}>
              {/* Left slot */}
              <button
                onClick={() => handleSlotClick(i)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl font-mono text-2xl sm:text-3xl font-extrabold flex items-center justify-center transition-all cursor-pointer select-none ${
                  chip
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-slate-950 shadow-md font-black'
                    : isSlotActive
                    ? 'bg-cyan-950/60 border-2 border-cyan-400 ring-4 ring-cyan-400/30'
                    : 'bg-slate-800/90 border-2 border-dashed border-slate-600 hover:border-cyan-400 text-slate-500'
                }`}
              >
                {chip ? chip.digit : ''}
              </button>

              {/* Operator */}
              {i < puzzle.usedOps.length && (
                <span className="font-mono text-2xl sm:text-3xl font-bold text-slate-300 px-1">
                  {puzzle.usedOps[i] === '*' ? '×' : puzzle.usedOps[i]}
                </span>
              )}
            </React.Fragment>
          );
        })}

        {/* Equals Sign */}
        <span className="font-mono text-2xl sm:text-3xl font-bold text-cyan-400 px-1">=</span>

        {/* RHS Slot */}
        {(() => {
          const rhsIndex = puzzle.numSlots - 1;
          const rhsChipId = slotAssignments[rhsIndex];
          const rhsChip = puzzle.bank.find(c => c.id === rhsChipId);
          const isRhsActive = selectedSlotIdx === rhsIndex;

          return (
            <button
              onClick={() => handleSlotClick(rhsIndex)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl font-mono text-2xl sm:text-3xl font-extrabold flex items-center justify-center transition-all cursor-pointer select-none ${
                rhsChip
                  ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-slate-950 shadow-md font-black'
                  : isRhsActive
                  ? 'bg-cyan-950/60 border-2 border-cyan-400 ring-4 ring-cyan-400/30'
                  : 'bg-slate-800/90 border-2 border-dashed border-slate-600 hover:border-cyan-400 text-slate-500'
              }`}
            >
              {rhsChip ? rhsChip.digit : ''}
            </button>
          );
        })()}
      </div>

      {/* Digits Bank */}
      <div className="flex flex-col items-center gap-2 w-full">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Available Digits</span>
        <div className="flex flex-wrap justify-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-md">
          {puzzle.bank.map(chip => {
            const isUsed = usedChipIds.has(chip.id);
            const isSelected = selectedChipId === chip.id;

            return (
              <button
                key={chip.id}
                disabled={isUsed}
                onClick={() => handleChipClick(chip.id)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-mono text-2xl font-black transition-all select-none cursor-pointer ${
                  isUsed
                    ? 'bg-slate-900/50 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40 scale-95'
                    : isSelected
                    ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/50 scale-105 shadow-md shadow-cyan-400/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 hover:border-cyan-400 active:scale-95 shadow'
                }`}
              >
                {chip.digit}
              </button>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheck}
          className="px-8 py-3 rounded-xl font-bold text-base sm:text-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
        >
          Check Equation
        </button>
        <button
          onClick={() => {
            sound.playWrong();
            api.wrong();
          }}
          className="px-5 py-3 rounded-xl font-semibold text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
