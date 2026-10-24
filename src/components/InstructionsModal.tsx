import React, { useState } from 'react';
import { GameMetadata } from '../types';
import { Play, ArrowLeft, Clock, Lightbulb } from 'lucide-react';

interface InstructionsModalProps {
  game: GameMetadata;
  onStart: (durationSeconds: number) => void;
  onBack: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ game, onStart, onBack }) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(game.durationSeconds || 360);

  const durationOptions = [
    { label: '6 Minutes (Standard)', value: 360 },
    { label: '3 Minutes (Sprint)', value: 180 },
    { label: '10 Minutes (Deep Dive)', value: 600 },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-2 animate-fade-in">
      {/* Header */}
      <div>
        <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">
          {game.ability}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3 mt-1">
          <span className="text-3xl">{game.icon}</span>
          <span>{game.name}</span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">{game.short}</p>
      </div>

      {/* Step by Step Guide */}
      <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold">How to Play</h3>
        <div className="flex flex-col gap-3.5">
          {game.howto.map((step, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="text-slate-200 text-sm leading-snug">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Strategy Tip */}
      {game.tips && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs sm:text-sm">
          <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-indigo-300 block font-semibold mb-0.5">Placement Strategy Tip:</strong>
            {game.tips}
          </div>
        </div>
      )}

      {/* Duration Selection */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400 font-bold">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Session Duration</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {durationOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedDuration(opt.value)}
              className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedDuration === opt.value
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={() => onStart(selectedDuration)}
          className="flex-1 py-3.5 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>Start Assessment Round</span>
        </button>

        <button
          onClick={onBack}
          className="py-3.5 px-5 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};
