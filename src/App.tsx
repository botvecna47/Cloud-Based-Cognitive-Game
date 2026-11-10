import React, { useState, useRef, useCallback } from 'react';
import { GameMetadata, GameResult, TrackId, GameId, GameMode, SessionLevelRecord, Achievement } from './types';
import { COGNITIVE_GAMES, GAME_BASED_GAMES, ALL_GAMES, getGameById } from './data/games';
import { Header, MainNavTab } from './components/Header';
import { ArenaHub } from './components/ArenaHub';
import { InstructionsModal } from './components/InstructionsModal';
import { GameShell } from './components/GameShell';
import { ResultModal } from './components/ResultModal';
import { LeaderboardView } from './components/LeaderboardView';
import { HistoryView } from './components/HistoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AchievementsView } from './components/AchievementsView';
import { AuthModal } from './components/AuthModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { AchievementToast } from './components/AchievementToast';
import { FlashToast, ToastData } from './components/FlashToast';
import { GameRenderer } from './games/GameFactory';
import { useAuth } from './context/AuthContext';
import { dbService } from './services/dbService';

type AppScreen =
  | 'hub'
  | 'instructions'
  | 'playing'
  | 'result'
  | 'leaderboards'
  | 'history'
  | 'analytics'
  | 'achievements';

function sample<T>(arr: T[], k: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

export const App: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [screen, setScreen] = useState<AppScreen>('hub');
  const [currentTab, setCurrentTab] = useState<MainNavTab>('track1');

  // Modal dialog states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupabaseSetupOpen, setIsSupabaseSetupOpen] = useState(false);

  // Active game & runner state
  const [activeGame, setActiveGame] = useState<GameMetadata>(COGNITIVE_GAMES[0]);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameMetadata>(COGNITIVE_GAMES[0]);
  const [durationSeconds, setDurationSeconds] = useState<number>(360);
  const [currentGameMode, setCurrentGameMode] = useState<GameMode>('practice');

  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  // Granular level-by-level telemetry recording
  const levelRecordsRef = useRef<SessionLevelRecord[]>([]);
  const levelStartTimeRef = useRef<number>(Date.now());

  // Assessment Queue state
  const [assessmentQueue, setAssessmentQueue] = useState<GameMetadata[]>([]);
  const [queueProgress, setQueueProgress] = useState<{ current: number; total: number } | undefined>(undefined);

  // Toast notifications
  const [toast, setToast] = useState<ToastData | null>(null);
  const [unlockedToast, setUnlockedToast] = useState<Achievement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string, isBad = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, isBad });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 1200);
  };

  // Start single game practice from instructions
  const handleStartGame = (
    game: GameMetadata,
    duration: number,
    mode: GameMode = 'practice',
    queue?: GameMetadata[],
    currentNum?: number,
    totalNum?: number
  ) => {
    setActiveGame(game);
    setDurationSeconds(duration);
    setCurrentGameMode(mode);
    setLevel(1);
    setScore(0);
    setCorrectCount(0);
    setAttemptCount(0);
    levelRecordsRef.current = [];
    levelStartTimeRef.current = Date.now();

    if (queue) {
      setAssessmentQueue(queue);
      setQueueProgress({ current: currentNum || 1, total: totalNum || queue.length + 1 });
    } else {
      setAssessmentQueue([]);
      setQueueProgress(undefined);
    }

    setScreen('playing');
  };

  // Start Full Assessment simulation
  const handleStartFullAssessment = (track: TrackId | 'marathon') => {
    let pool: GameMetadata[] = [];
    let count = 4;
    let mode: GameMode = 'assessment';

    if (track === 'cognitive') {
      pool = COGNITIVE_GAMES;
    } else if (track === 'game-based') {
      pool = GAME_BASED_GAMES;
    } else {
      pool = ALL_GAMES;
      count = 6;
      mode = 'marathon';
    }

    const selected = sample(pool, count);
    const firstGame = selected[0];
    const remaining = selected.slice(1);

    handleStartGame(firstGame, 360, mode, remaining, 1, count);
  };

  // Game API Handlers
  const handleCorrect = useCallback(() => {
    const elapsedSecs = Number((Math.max(1, (Date.now() - levelStartTimeRef.current) / 1000)).toFixed(2));
    let reward = 0;

    if (activeGame.track === 'cognitive') {
      const w = activeGame.weight || 1;
      reward = Math.round((60 * w * level) / Math.max(3.5, elapsedSecs));
    } else {
      reward = Math.round((120 * level * level) / Math.max(2, elapsedSecs));
    }

    // Record granular level telemetry
    levelRecordsRef.current.push({
      levelNumber: level,
      timeTakenSeconds: elapsedSecs,
      scoreEarned: reward,
      isCorrect: true,
    });

    setScore(s => s + reward);
    setCorrectCount(c => c + 1);
    setAttemptCount(a => a + 1);
    setLevel(l => l + 1);
    levelStartTimeRef.current = Date.now();

    showToast(`+${reward} points!`);
  }, [activeGame, level]);

  const handleWrong = useCallback(() => {
    const elapsedSecs = Number((Math.max(1, (Date.now() - levelStartTimeRef.current) / 1000)).toFixed(2));

    levelRecordsRef.current.push({
      levelNumber: level,
      timeTakenSeconds: elapsedSecs,
      scoreEarned: 0,
      isCorrect: false,
    });

    setAttemptCount(a => a + 1);
    levelStartTimeRef.current = Date.now();
    showToast('Not quite — next puzzle', true);
  }, [level]);

  // Time expired or user completes round
  const handleTimeUp = useCallback(async () => {
    const levelsCleared = level - 1;
    const acc = attemptCount > 0 ? correctCount / attemptCount : 0;
    const accuracyPct = Math.round(acc * 100);

    let performanceIndex: number | undefined;
    let performanceBand: 'Excellent' | 'Strong' | 'Fair' | 'Keep practising' | undefined;

    if (activeGame.track === 'cognitive') {
      const target = activeGame.targetLevels || 15;
      performanceIndex = Math.round(100 * (1 - Math.exp(-levelsCleared / target)) * acc);
      performanceBand =
        performanceIndex >= 80
          ? 'Excellent'
          : performanceIndex >= 60
          ? 'Strong'
          : performanceIndex >= 40
          ? 'Fair'
          : 'Keep practising';
    }

    const preliminaryResult: GameResult = {
      gameId: activeGame.id,
      gameName: activeGame.name,
      track: activeGame.track,
      mode: currentGameMode,
      score,
      level: levelsCleared,
      correct: correctCount,
      attempts: attemptCount,
      accuracy: accuracyPct,
      performanceIndex,
      performanceBand,
      date: new Date().toISOString(),
      durationSeconds,
    };

    // Save to database (Supabase Cloud + Local sync fallback)
    const activeUserId = user?.id || 'guest-anon';
    const dbSaveResponse = await dbService.recordGameSession(
      activeUserId,
      preliminaryResult,
      levelRecordsRef.current
    );

    // Refresh user profile in context to show updated XP & rank tier
    await refreshProfile();

    const finalizedResult: GameResult = {
      ...preliminaryResult,
      id: dbSaveResponse.session.id,
      xpEarned: dbSaveResponse.xpEarned,
      newAchievements: dbSaveResponse.newAchievements,
    };

    if (dbSaveResponse.newAchievements.length > 0) {
      setUnlockedToast(dbSaveResponse.newAchievements[0]);
    }

    setLastResult(finalizedResult);
    setScreen('result');
  }, [activeGame, level, score, correctCount, attemptCount, durationSeconds, currentGameMode, user, refreshProfile]);

  // Next game in queue
  const handleNextInQueue = () => {
    if (assessmentQueue.length === 0) return;
    const nextGame = assessmentQueue[0];
    const remaining = assessmentQueue.slice(1);
    const nextRoundNumber = (queueProgress?.current || 1) + 1;
    const totalRounds = queueProgress?.total || 4;

    handleStartGame(nextGame, 360, currentGameMode, remaining, nextRoundNumber, totalRounds);
  };

  const handleSelectTab = (tab: MainNavTab) => {
    setCurrentTab(tab);
    if (tab === 'leaderboards') {
      setScreen('leaderboards');
    } else if (tab === 'history') {
      setScreen('history');
    } else if (tab === 'analytics') {
      setScreen('analytics');
    } else if (tab === 'achievements') {
      setScreen('achievements');
    } else {
      setScreen('hub');
    }
  };

  const handleDirectPlay = (gameId: GameId) => {
    const game = getGameById(gameId);
    if (game) {
      setSelectedGameForModal(game);
      setScreen('instructions');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans">
      <FlashToast toast={toast} />
      <AchievementToast achievement={unlockedToast} onDismiss={() => setUnlockedToast(null)} />

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
      <SupabaseSetupModal isOpen={isSupabaseSetupOpen} onClose={() => setIsSupabaseSetupOpen(false)} />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Pro Header with Auth & Database status */}
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isInGame={screen === 'playing'}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSupabaseSetup={() => setIsSupabaseSetupOpen(true)}
        />

        {/* Main Panel Viewport */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-2xl relative min-h-[500px]">
          {screen === 'hub' && (
            <ArenaHub
              currentTab={
                currentTab === 'track1' || currentTab === 'track2' || currentTab === 'all'
                  ? currentTab
                  : 'track1'
              }
              onSelectGame={game => {
                setSelectedGameForModal(game);
                setScreen('instructions');
              }}
              onStartFullAssessment={handleStartFullAssessment}
            />
          )}

          {screen === 'instructions' && (
            <InstructionsModal
              game={selectedGameForModal}
              onStart={duration => handleStartGame(selectedGameForModal, duration, 'practice')}
              onBack={() => setScreen('hub')}
            />
          )}

          {screen === 'playing' && (
            <GameShell
              game={activeGame}
              level={level}
              score={score}
              durationSeconds={durationSeconds}
              onTimeUp={handleTimeUp}
              onQuit={() => setScreen('hub')}
              queueProgress={queueProgress}
            >
              <GameRenderer
                gameId={activeGame.id}
                api={{
                  level,
                  correct: handleCorrect,
                  wrong: handleWrong,
                }}
              />
            </GameShell>
          )}

          {screen === 'result' && lastResult && (
            <ResultModal
              game={activeGame}
              result={lastResult}
              hasNextInQueue={assessmentQueue.length > 0}
              nextGameName={assessmentQueue[0]?.name}
              onNextGame={handleNextInQueue}
              onPlayAgain={() => handleStartGame(activeGame, durationSeconds, currentGameMode)}
              onHome={() => setScreen('hub')}
            />
          )}

          {screen === 'leaderboards' && (
            <LeaderboardView onBack={() => setScreen('hub')} onPlayGame={handleDirectPlay} />
          )}

          {screen === 'history' && (
            <HistoryView onBack={() => setScreen('hub')} onPlayGame={handleDirectPlay} />
          )}

          {screen === 'analytics' && <AnalyticsView onBack={() => setScreen('hub')} />}

          {screen === 'achievements' && <AchievementsView onBack={() => setScreen('hub')} />}
        </div>

        {/* Footer info */}
        <footer className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          MOUNT ADEPT Cognitive Practice Arena • Cloud Database powered by Supabase with Row Level Security.
          All assessment algorithms and scoring models are built for campus placement rehearsal.
        </footer>
      </main>
    </div>
  );
};

export default App;
