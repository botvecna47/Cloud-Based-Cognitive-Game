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
    title = 'Cognitive Track';
    subtitle =
      'Six core aptitude games that sharpen numerical agility, working memory, planning, and logical reasoning. Each round scales dynamically with every level cleared.';
  } else if (currentTab === 'track2') {
    displayGames = GAME_BASED_GAMES;
    title = 'Challenge Track';
    subtitle =
      'Six fast-paced interactive puzzles testing multitasking, spatial navigation, decoding, and pattern recognition under real-time speed scoring.';
  } else {
    displayGames = ALL_GAMES;
    title = 'All 12 Aptitude Games';
    subtitle =
      'Complete Gamefied Apti library. Train numerical speed, spatial reasoning, working memory, decoding, and deductive logic across both tracks.';
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Track Title and Description */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{title}</h1>
        <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Featured CTA Banner */}
      {currentTab === 'track1' && (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-[#1E2761] via-indigo-900 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Game Simulation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Cognitive Sprint (4 Games)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
              Play 4 randomly selected cognitive games back to back with performance index scoring.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartFullAssessment('cognitive')}
            className="z-10 py-3 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Sprint</span>
          </button>
        </div>
      )}

      {currentTab === 'track2' && (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-[#1E2761] via-indigo-900 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Timed Challenge Mode</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Challenge Sprint (4 Games)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
              Play 4 randomly chosen interactive challenges back to back. Speed and accuracy drive your score.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartFullAssessment('game-based')}
            className="z-10 py-3 px-6 rounded-xl font-bold text-sm sm:text-base bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Sprint</span>
          </button>
        </div>
      )}

      {currentTab === 'all' && (
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-cyan-950 border border-cyan-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="z-10">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Endurance Challenge</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Grand Aptitude Marathon (6 Games)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-lg">
              Test your endurance across 6 random games pulled from both the Cognitive and Challenge tracks.
            </p>
          </div>
          <button
            type="button"
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
            Or Practice One Game at a Time
          </h3>
          <span className="text-xs text-slate-400 font-semibold tabular-nums">
            {displayGames.length} Games
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGames.map(game => (
            <button
              type="button"
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="text-left p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[176px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {game.icon}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700/80 truncate max-w-[170px]">
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

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80 text-xs font-semibold text-slate-400 group-hover:text-cyan-400 transition-colors w-full">
                <span>6 min standard round</span>
                <span className="flex items-center gap-1">Practice ➔</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
