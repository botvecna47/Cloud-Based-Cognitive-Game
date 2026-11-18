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
        <p className="text-ink text-base sm:text-lg font-medium">
          Place digits into the slots to balance the equation:
        </p>
        <p className="text-xs text-ink-muted mt-1">
          Evaluated strictly left to right. Each bank digit may be used once.
        </p>
      </div>

      {/* Equation Layout */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-5 bg-paper rounded-xl border border-hairline w-full">
        {Array.from({ length: puzzle.terms }).map((_, i) => {
          const chipId = slotAssignments[i];
          const chip = puzzle.bank.find(c => c.id === chipId);
          const isSlotActive = selectedSlotIdx === i;

          return (
            <React.Fragment key={i}>
              {/* Left slot */}
              <button
                onClick={() => handleSlotClick(i)}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl font-mono text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                  chip
                    ? 'bg-ink text-surface border-2 border-ink'
                    : isSlotActive
                    ? 'bg-vermilion-wash border-2 border-vermilion text-vermilion'
                    : 'bg-surface border-2 border-dashed border-hairline hover:border-ink text-ink-muted'
                }`}
              >
                {chip ? chip.digit : ''}
              </button>

              {/* Operator */}
              {i < puzzle.usedOps.length && (
                <span className="font-mono text-2xl sm:text-3xl font-bold text-ink-secondary px-1">
                  {puzzle.usedOps[i] === '*' ? '×' : puzzle.usedOps[i]}
                </span>
              )}
            </React.Fragment>
          );
        })}

        {/* Equals Sign */}
        <span className="font-mono text-2xl sm:text-3xl font-bold text-vermilion px-1">=</span>

        {/* RHS Slot */}
        {(() => {
          const rhsIndex = puzzle.numSlots - 1;
          const rhsChipId = slotAssignments[rhsIndex];
          const rhsChip = puzzle.bank.find(c => c.id === rhsChipId);
          const isRhsActive = selectedSlotIdx === rhsIndex;

          return (
            <button
              onClick={() => handleSlotClick(rhsIndex)}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl font-mono text-2xl sm:text-3xl font-bold flex items-center justify-center transition-all cursor-pointer select-none ${
                rhsChip
                  ? 'bg-ink text-surface border-2 border-ink'
                  : isRhsActive
                  ? 'bg-vermilion-wash border-2 border-vermilion text-vermilion'
                  : 'bg-surface border-2 border-dashed border-hairline hover:border-ink text-ink-muted'
              }`}
            >
              {rhsChip ? rhsChip.digit : ''}
            </button>
          );
        })()}
      </div>

      {/* Digits Bank */}
      <div className="flex flex-col items-center gap-2 w-full">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted font-bold">
          Available Digits
        </span>
        <div className="flex flex-wrap justify-center gap-2.5 p-4 bg-paper rounded-xl border border-hairline">
          {puzzle.bank.map(chip => {
            const isUsed = usedChipIds.has(chip.id);
            const isSelected = selectedChipId === chip.id;

            return (
              <button
                key={chip.id}
                disabled={isUsed}
                onClick={() => handleChipClick(chip.id)}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-mono text-2xl font-bold transition-all select-none border ${
                  isUsed
                    ? 'bg-recessed text-ink-muted/50 border-hairline cursor-not-allowed opacity-50'
                    : isSelected
                    ? 'bg-vermilion text-surface border-vermilion -translate-y-0.5 cursor-pointer'
                    : 'bg-surface hover:bg-recessed text-ink border-hairline hover:border-ink active:scale-95 cursor-pointer'
                }`}
              >
                {chip.digit}
              </button>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCheck}
          className="px-7 py-3 rounded-xl font-semibold text-sm sm:text-base bg-vermilion hover:bg-vermilion-hover text-surface active:scale-[0.98] transition-all cursor-pointer"
        >
          Check Equation
        </button>
        <button
          onClick={() => {
            sound.playWrong();
            api.wrong();
          }}
          className="px-5 py-3 rounded-xl font-semibold text-sm text-ink-secondary bg-surface hover:bg-recessed hover:text-ink border border-hairline active:scale-[0.98] transition-all cursor-pointer"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
