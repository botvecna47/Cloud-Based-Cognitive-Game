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
    seq.forEach((padIndex, idx) => {
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
    window.setTimeout(() => setActivePad(null), 160);

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
          <div className="inline-flex items-center gap-2 text-cyan-300 bg-cyan-950/50 px-5 py-2 rounded-full border border-cyan-500/30 text-lg font-medium animate-pulse">
            <span>👁️</span>
            <span>
              Watch the sequence of <strong className="text-white font-bold">{seqLength}</strong> signals...
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-emerald-300 bg-emerald-950/50 px-5 py-2 rounded-full border border-emerald-500/30 text-lg font-medium">
            <span>✨</span>
            <span>
              Repeat the sequence! (<strong className="text-white font-bold">{userStep}</strong> / {seqLength})
            </span>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-1.5">
        {sequence.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              phase === 'repeat' && i < userStep
                ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-400/50'
                : 'bg-slate-700/60'
            }`}
          />
        ))}
      </div>

      {/* 6 Signal Pads */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 p-5 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl">
        {Array.from({ length: numPads }).map((_, index) => {
          const isFlashing = activePad === index;
          return (
            <button
              key={index}
              disabled={phase === 'watch'}
              onClick={() => handlePadClick(index)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 transition-all duration-150 flex items-center justify-center font-mono font-black text-xl select-none cursor-pointer ${
                isFlashing
                  ? 'bg-gradient-to-br from-cyan-300 to-cyan-500 border-white text-slate-950 scale-110 shadow-lg shadow-cyan-400/50 ring-4 ring-cyan-400/40'
                  : phase === 'watch'
                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-500 cursor-not-allowed opacity-80'
                  : 'bg-slate-800 hover:bg-slate-700/90 border-slate-600 hover:border-cyan-400 text-slate-300 active:scale-95 shadow-md'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="text-slate-400 text-xs sm:text-sm text-center">
        {phase === 'watch'
          ? 'Memorise the order in which the pads light up.'
          : 'Click the pads in the exact same sequence you just observed.'}
      </div>
    </div>
  );
};
