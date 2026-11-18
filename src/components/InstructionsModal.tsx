import React, { useState } from 'react';
import { GameMetadata } from '../types';
import { ArrowRight, ArrowLeft, Clock, Compass } from 'lucide-react';

interface InstructionsModalProps {
  game: GameMetadata;
  onStart: (durationSeconds: number) => void;
  onBack: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ game, onStart, onBack }) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(game.durationSeconds || 360);

  const durationOptions = [
    { label: '3 Minutes', tag: 'Sprint', value: 180 },
    { label: '6 Minutes', tag: 'Standard', value: 360 },
    { label: '10 Minutes', tag: 'Deep Focus', value: 600 },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-7 max-w-2xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase font-medium tracking-[0.12em] text-vermilion">
          {game.ability}
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
          {game.name}
        </h2>
        <p className="text-ink-secondary text-sm sm:text-base leading-relaxed">{game.short}</p>
      </div>

      {/* Step-by-Step Rules */}
      <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-hairline">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted font-medium">
          How to Play
        </h3>
        <div className="flex flex-col gap-3.5">
          {game.howto.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-recessed text-ink font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <p className="text-ink text-sm leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Tip */}
      {game.tips && (
        <div className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-vermilion-wash/70 border border-vermilion/20 text-ink text-sm">
          <Compass className="w-5 h-5 text-vermilion shrink-0 mt-0.5" />
          <div>
            <strong className="font-mono text-[11px] uppercase tracking-wider text-vermilion block mb-1">
              Strategy Tip
            </strong>
            <span className="text-ink-secondary leading-relaxed">{game.tips}</span>
          </div>
        </div>
      )}

      {/* Duration Picker */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted font-medium">
          <Clock className="w-3.5 h-3.5 text-vermilion" />
          <span>Session Duration</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {durationOptions.map(opt => {
            const active = selectedDuration === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => setSelectedDuration(opt.value)}
                aria-pressed={active}
                className={`p-3 sm:p-4 rounded-xl border text-left transition-[background-color,border-color,color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer ${
                  active
                    ? 'bg-ink border-ink text-surface'
                    : 'bg-surface hover:bg-recessed border-hairline text-ink'
                }`}
              >
                <div className="font-semibold text-xs sm:text-sm">{opt.label}</div>
                <div
                  className={`font-mono text-[9px] sm:text-[10px] uppercase tracking-wider mt-0.5 ${
                    active ? 'text-surface/70' : 'text-ink-muted'
                  }`}
                >
                  {opt.tag}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions (stack Start Game on top for mobile thumb reach) */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="py-3.5 px-5 rounded-xl font-semibold text-sm text-ink bg-surface hover:bg-recessed border border-hairline transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={() => onStart(selectedDuration)}
          className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base bg-vermilion hover:bg-vermilion-hover text-surface transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Start Game</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
