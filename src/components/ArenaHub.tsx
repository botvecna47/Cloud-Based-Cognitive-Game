import React from 'react';
import { GameMetadata, TrackId } from '../types';
import { COGNITIVE_GAMES, GAME_BASED_GAMES, ALL_GAMES } from '../data/games';
import { Play, Sparkles, Flame } from 'lucide-react';

interface ArenaHubProps {
  currentTab: 'track1' | 'track2' | 'all';
  onSelectGame: (game: GameMetadata) => void;
  onStartFullAssessment: (track: TrackId | 'marathon') => void;
}

export const ArenaHub: React.FC<ArenaHubProps> = ({
  currentTab,
  onSelectGame,
  onStartFullAssessment,
}) => {
  let displayGames: GameMetadata[] = [];
  let title = '';
  let subtitle = '';

  if (currentTab === 'track1') {
    displayGames = COGNITIVE_GAMES;
    title = 'Cognitive Aptitude: Practice Arena';
    subtitle =
      'Six games that build the reasoning, memory, and speed that campus aptitude rounds test. Each game runs 6 minutes and gets harder each level.';
  } else if (currentTab === 'track2') {
    displayGames = GAME_BASED_GAMES;
    title = 'Game-Based Cognitive Assessment — Placement Arena';
    subtitle =
      'Six practice games modelled on real campus recruitment game rounds (Capgemini, MNC aptitude). Each game runs 6 minutes, gets harder each level, and rewards speed.';
  } else {
    displayGames = ALL_GAMES;
    title = 'Master Aptitude & Game Assessment Hub';
    subtitle =
      'Complete catalog of all 12 cognitive aptitude games. Train numerical speed, spatial reasoning, working memory, decoding, and deductive logic.';
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Track Title and Description */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Featured CTA Banner: Full Assessment Mode */}
      {currentTab === 'track1' && (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-navy via-indigo-900 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Full Assessment Simulation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Track 1: Full Cognitive Round
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
              Play 4 randomly selected cognitive games back to back with real assessment scoring,
              just like a live campus test.
            </p>
          </div>
          <button
            onClick={() => onStartFullAssessment('cognitive')}
            className="z-10 py-3 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Full Assessment</span>
          </button>
        </div>
      )}

      {currentTab === 'track2' && (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-navy via-indigo-900 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Capgemini Format Simulation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Track 2: Game-Based Assessment
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
              Play 4 randomly chosen interactive games back to back. Speed and accuracy determine
              your percentile rating.
            </p>
          </div>
          <button
            onClick={() => onStartFullAssessment('game-based')}
            className="z-10 py-3 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Assessment Round</span>
          </button>
        </div>
      )}

      {currentTab === 'all' && (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Ultimate Challenge</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Grand Cognitive Marathon (6 Games)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
              Test your endurance across 6 random games pulled from both cognitive and game-based
              assessment tracks.
            </p>
          </div>
          <button
            onClick={() => onStartFullAssessment('marathon')}
            className="z-10 py-3 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Launch Marathon</span>
          </button>
        </div>
      )}

      {/* Grid of Practice Game Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Or Practise One Game At A Time
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{displayGames.length} Games</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGames.map(game => (
            <div
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[170px] group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {game.icon}
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700/80">
                    {game.ability}
                  </span>
                </div>

                <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                  {game.name}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {game.short}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80 text-xs font-semibold text-slate-400 group-hover:text-cyan-400 transition-colors">
                <span>6 min standard round</span>
                <span className="flex items-center gap-1">
                  Practise ➔
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
