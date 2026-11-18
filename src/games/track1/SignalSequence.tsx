import React, { useState, useEffect, useRef } from 'react';
import { GameAPI } from '../../types';
import { sound } from '../../utils/sound';

export const SignalSequence: React.FC<{ api: GameAPI }> = ({ api }) => {
  const L = api.level;
  const numPads = 6;
  const seqLength = Math.min(2 + L, 10);

  const [phase, setPhase] = useState<'watch' | 'repeat'>('watch');
  const [activePad, setActivePad] = useState<number | null>(null);
  const [userStep, setUserStep] = useState<number>(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const timeoutRefs = useRef<number[]>([]);

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(t => clearTimeout(t));
    timeoutRefs.current = [];
  };

  useEffect(() => {
    clearAllTimeouts();
    // generate sequence
    const seq = Array.from({ length: seqLength }, () => Math.floor(Math.random() * numPads));
    setSequence(seq);
    setPhase('watch');
    setUserStep(0);
    setActivePad(null);

    // Playback sequence after slight initial pause
    let delay = 600;
    seq.forEach(padIndex => {
      const tOn = window.setTimeout(() => {
        setActivePad(padIndex);
        sound.playSignalTone(padIndex);
      }, delay);
      timeoutRefs.current.push(tOn);

      delay += 450;
      const tOff = window.setTimeout(() => {
        setActivePad(null);
      }, delay);
      timeoutRefs.current.push(tOff);

      delay += 200;
    });

    const tInput = window.setTimeout(() => {
      setPhase('repeat');
    }, delay);
    timeoutRefs.current.push(tInput);

    return () => {
      clearAllTimeouts();
    };
  }, [L, seqLength]);

  const handlePadClick = (index: number) => {
    if (phase !== 'repeat') return;

    sound.playSignalTone(index);
    setActivePad(index);
    const flashTimer = window.setTimeout(() => setActivePad(null), 160);
    timeoutRefs.current.push(flashTimer);

    if (index === sequence[userStep]) {
      const nextStep = userStep + 1;
      setUserStep(nextStep);

      if (nextStep === sequence.length) {
        sound.playCorrect();
        api.correct();
      }
    } else {
      sound.playWrong();
      api.wrong();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto py-2">
      <div className="text-center">
        {phase === 'watch' ? (
          <div className="inline-flex items-center gap-2.5 text-ink bg-recessed px-5 py-2 rounded-full border border-hairline text-sm sm:text-base font-medium">
            <span className="w-2 h-2 rounded-full bg-vermilion animate-pulse" />
            <span>
              Watch sequence of <strong className="font-mono font-bold text-ink">{seqLength}</strong> signals
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2.5 text-surface bg-ink px-5 py-2 rounded-full text-sm sm:text-base font-medium">
            <span className="w-2 h-2 rounded-full bg-vermilion" />
            <span>
              Repeat sequence{' '}
              <strong className="font-mono font-bold text-vermilion">
                {userStep} / {seqLength}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-2">
        {sequence.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
              phase === 'repeat' && i < userStep
                ? 'bg-vermilion scale-110'
                : 'bg-hairline'
            }`}
          />
        ))}
      </div>

      {/* 6 Signal Pads */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-3.5 p-5 bg-paper rounded-xl border border-hairline">
        {Array.from({ length: numPads }).map((_, index) => {
          const isFlashing = activePad === index;
          return (
            <button
              key={index}
              disabled={phase === 'watch'}
              onClick={() => handlePadClick(index)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 transition-all duration-150 flex items-center justify-center font-mono font-bold text-xl select-none ${
                isFlashing
                  ? 'bg-vermilion border-ink text-surface scale-105 ring-2 ring-ink/30'
                  : phase === 'watch'
                  ? 'bg-recessed border-hairline text-ink-muted cursor-not-allowed'
                  : 'bg-surface hover:bg-recessed border-hairline hover:border-ink text-ink active:scale-95 cursor-pointer'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <p className="text-ink-muted text-xs sm:text-sm text-center">
        {phase === 'watch'
          ? 'Observe and memorize the exact order in which each pad activates.'
          : 'Tap the pads in the same sequence you observed.'}
      </p>
    </div>
  );
};
