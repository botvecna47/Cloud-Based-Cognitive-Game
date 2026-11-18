import React from 'react';
import { GameMetadata, TrackId } from '../types';
import { COGNITIVE_GAMES, GAME_BASED_GAMES, ALL_GAMES } from '../data/games';
import { ArrowRight } from 'lucide-react';

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
  let kicker = '';
  let headline = '';
  let subtitle = '';
  let sprintKicker = '';
  let sprintTitle = '';
  let sprintDesc = '';
  let sprintCta = '';
  let sprintTarget: TrackId | 'marathon' = 'cognitive';

  if (currentTab === 'track1') {
    displayGames = COGNITIVE_GAMES;
    kicker = 'Track 01  /  Cognitive Disciplines';
    headline = 'Train precision, memory, and deduction under the clock.';
    subtitle =
      'Six calibrated aptitude drills designed with zero visual distraction. Every round adapts to your level and logs granular speed telemetry.';
    sprintKicker = 'Timed Simulation  •  4 Modules';
    sprintTitle = 'Cognitive Sprint';
    sprintDesc = 'Four randomly selected cognitive drills back-to-back with Performance Index scoring.';
    sprintCta = 'Start Sprint';
    sprintTarget = 'cognitive';
  } else if (currentTab === 'track2') {
    displayGames = GAME_BASED_GAMES;
    kicker = 'Track 02  /  Interactive Challenges';
    headline = 'Fast-paced spatial, logic, and multitasking drills.';
    subtitle =
      'Six interactive challenges testing working memory under interference, spatial planning, permutation decoding, and deductive grids.';
    sprintKicker = 'Timed Simulation  •  4 Modules';
    sprintTitle = 'Challenge Sprint';
    sprintDesc = 'Four randomly drawn interactive challenges back-to-back rewarding speed and clean accuracy.';
    sprintCta = 'Start Sprint';
    sprintTarget = 'game-based';
  } else {
    displayGames = ALL_GAMES;
    kicker = 'Complete Catalog  /  12 Disciplines';
    headline = 'Every cognitive and interactive module in one arena.';
    subtitle =
      'Practice individual modules at your own pace or launch the 6-game endurance marathon spanning both tracks.';
    sprintKicker = 'Endurance Mode  •  6 Modules';
    sprintTitle = 'Grand Aptitude Marathon';
    sprintDesc = 'Six random drills pulled across both Cognitive and Challenge tracks to unlock the Marathoner badge.';
    sprintCta = 'Launch Marathon';
    sprintTarget = 'marathon';
  }

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      {/* Asymmetric Editorial Split Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4 pt-1">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-vermilion">
            {kicker}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold text-ink leading-[1.1] tracking-[-0.02em]">
            {headline}
          </h1>
          <p className="text-ink-secondary text-sm sm:text-base max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* High-Contrast Charcoal Ink Featured Sprint Card */}
        <div className="lg:col-span-5 p-7 sm:p-8 rounded-2xl bg-ink text-surface flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-2.5">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-vermilion">
              {sprintKicker}
            </div>
            <h2 className="font-display text-2xl sm:text-[28px] font-semibold leading-tight text-surface">
              {sprintTitle}
            </h2>
            <p className="text-sm text-surface/75 leading-relaxed">
              {sprintDesc}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => onStartFullAssessment(sprintTarget)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-vermilion hover:bg-vermilion-hover text-surface font-semibold text-sm transition-colors active:scale-[0.98] cursor-pointer"
            >
              <span>{sprintCta}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Individual Modules Swiss Grid */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted">
            Individual Modules
          </h3>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted tabular-nums">
            {String(displayGames.length).padStart(2, '0')} Drills Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayGames.map((game, idx) => (
            <button
              type="button"
              key={game.id}
              onClick={() => onSelectGame(game)}
              className="text-left p-6 rounded-2xl bg-surface hover:bg-surface border border-hairline hover:border-ink transition-all duration-150 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[192px] group focus:outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-vermilion truncate">
                    {String(idx + 1).padStart(2, '0')} &nbsp;/&nbsp; {game.ability}
                  </span>
                  <span className="font-mono text-[11px] text-ink-muted uppercase shrink-0 tabular-nums">
                    6 MIN
                  </span>
                </div>

                <h4 className="font-display text-xl font-semibold text-ink tracking-tight group-hover:text-vermilion transition-colors">
                  {game.name}
                </h4>

                <p className="text-[13px] text-ink-secondary leading-relaxed line-clamp-2">
                  {game.short}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-hairline/70 text-[13px] font-semibold text-ink group-hover:text-vermilion transition-colors w-full">
                <span>Launch Module</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
