import React, { useEffect, useState } from 'react';
import { GameMetadata, TrackId } from '../types';
import { COGNITIVE_GAMES, GAME_BASED_GAMES, ALL_GAMES } from '../data/games';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';

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
  const { user } = useAuth();
  const [bestScores, setBestScores] = useState<Record<string, { score: number; plays: number }>>({});

  useEffect(() => {
    let active = true;
    async function loadPersonalBests() {
      if (!user) {
        if (active) setBestScores({});
        return;
      }
      const history = await dbService.getUserHistory(user.id, 'all', 'all', 100);
      if (!active) return;
      const map: Record<string, { score: number; plays: number }> = {};
      for (const item of history) {
        const existing = map[item.gameId];
        if (!existing) {
          map[item.gameId] = { score: item.score, plays: 1 };
        } else {
          existing.plays += 1;
          if (item.score > existing.score) existing.score = item.score;
        }
      }
      setBestScores(map);
    }
    loadPersonalBests();
    return () => {
      active = false;
    };
  }, [user]);

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
    <div className="flex flex-col gap-8 sm:gap-10 animate-fade-in">
      {/* Asymmetric Editorial Split Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <div className="lg:col-span-7 flex flex-col gap-3.5 sm:gap-4 pt-1">
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
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-ink text-surface flex flex-col justify-between gap-5">
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
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-vermilion hover:bg-vermilion-hover text-surface font-semibold text-sm transition-[background-color,transform] duration-150 ease-out motion-safe:enabled:active:scale-[0.96] cursor-pointer"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {displayGames.map((game, idx) => {
            const record = bestScores[game.id];
            return (
              <button
                type="button"
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="text-left p-5 sm:p-6 rounded-2xl bg-surface border border-hairline hover:border-ink transition-[transform,border-color] duration-150 ease-out motion-safe:hover:-translate-y-0.5 motion-safe:enabled:active:scale-[0.96] cursor-pointer flex flex-col justify-between min-h-[180px] sm:min-h-[192px] group"
              >
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-vermilion truncate">
                      {String(idx + 1).padStart(2, '0')} &nbsp;/&nbsp; {game.ability}
                    </span>
                    {record ? (
                      <span className="font-mono text-[10px] font-bold text-ink bg-recessed px-2 py-0.5 rounded uppercase shrink-0 tabular-nums">
                        Best {record.score.toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-ink-muted uppercase shrink-0 tabular-nums">
                        6 MIN
                      </span>
                    )}
                  </div>

                  <h4 className="font-display text-xl font-semibold text-ink tracking-tight group-hover:text-vermilion transition-colors duration-150">
                    {game.name}
                  </h4>

                  <p className="text-[13px] text-ink-secondary leading-relaxed line-clamp-2">
                    {game.short}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-hairline/70 text-[13px] font-semibold text-ink group-hover:text-vermilion transition-colors duration-150 w-full">
                  <span>{record ? `Play Again (${record.plays}×)` : 'Launch Module'}</span>
                  <ArrowRight className="w-4 h-4 motion-safe:transition-transform duration-150 ease-out group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
