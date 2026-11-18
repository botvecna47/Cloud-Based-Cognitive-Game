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

type HubTab = 'track1' | 'track2' | 'all';

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
  const [lastHubTab, setLastHubTab] = useState<HubTab>('track1');

  // Modal dialog states
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupabaseSetupOpen, setIsSupabaseSetupOpen] = useState(false);

  // Active game & runner state
  const [activeGame, setActiveGame] = useState<GameMetadata>(COGNITIVE_GAMES[0]);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameMetadata>(COGNITIVE_GAMES[0]);
  const [durationSeconds, setDurationSeconds] = useState<number>(360);
  const [currentGameMode, setCurrentGameMode] = useState<GameMode>('practice');
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [level, setLevel] = useState<number>(1);
  const [puzzleNonce, setPuzzleNonce] = useState<number>(0);
  const [sessionNonce, setSessionNonce] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  // Granular level-by-level telemetry & pause-aware timing
  const levelRecordsRef = useRef<SessionLevelRecord[]>([]);
  const levelStartTimeRef = useRef<number>(Date.now());
  const pauseStartedAtRef = useRef<number | null>(null);
  const isSubmittingResultRef = useRef<boolean>(false);

  // Assessment Queue state
  const [assessmentQueue, setAssessmentQueue] = useState<GameMetadata[]>([]);
  const [queueProgress, setQueueProgress] = useState<{ current: number; total: number } | undefined>(undefined);

  // Toast notifications
  const [toast, setToast] = useState<ToastData | null>(null);
  const [unlockedToast, setUnlockedToast] = useState<Achievement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string, isBad = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, isBad });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 1200);
  }, []);

  const handleDismissAchievementToast = useCallback(() => {
    setUnlockedToast(null);
  }, []);

  const handleGoHome = useCallback(() => {
    setIsPaused(false);
    pauseStartedAtRef.current = null;
    setAssessmentQueue([]);
    setQueueProgress(undefined);
    setCurrentTab(lastHubTab);
    setScreen('hub');
  }, [lastHubTab]);

  // Pause-aware timer adjustment so paused seconds never count against level telemetry/score
  const handlePauseChange = useCallback((nextPaused: boolean) => {
    setIsPaused(nextPaused);
    if (nextPaused) {
      if (pauseStartedAtRef.current === null) {
        pauseStartedAtRef.current = Date.now();
      }
    } else if (pauseStartedAtRef.current !== null) {
      const pausedDelta = Date.now() - pauseStartedAtRef.current;
      levelStartTimeRef.current += pausedDelta;
      pauseStartedAtRef.current = null;
    }
  }, []);

  // Start single game practice from instructions or queue
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
    setPuzzleNonce(n => n + 1);
    setSessionNonce(n => n + 1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setAttemptCount(0);
    setIsPaused(false);
    pauseStartedAtRef.current = null;
    isSubmittingResultRef.current = false;
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

  // Restart current active round (preserves queue if inside a sprint)
  const handleRestartRound = useCallback(() => {
    setLevel(1);
    setPuzzleNonce(n => n + 1);
    setSessionNonce(n => n + 1);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setAttemptCount(0);
    setIsPaused(false);
    pauseStartedAtRef.current = null;
    isSubmittingResultRef.current = false;
    levelRecordsRef.current = [];
    levelStartTimeRef.current = Date.now();
  }, []);

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
  const handleCorrect = useCallback(
    (meta?: { moves?: number }) => {
      const elapsedSecs = Number(Math.max(0.2, (Date.now() - levelStartTimeRef.current) / 1000).toFixed(2));
      let reward = 0;

      if (activeGame.track === 'cognitive') {
        const w = activeGame.weight || 1;
        reward = Math.round((60 * w * level) / Math.max(3.5, elapsedSecs));
      } else {
        reward = Math.round((120 * level * level) / Math.max(2, elapsedSecs));
      }

      levelRecordsRef.current.push({
        levelNumber: level,
        timeTakenSeconds: elapsedSecs,
        scoreEarned: reward,
        isCorrect: true,
        moves: meta?.moves,
      });

      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak(prev => Math.max(prev, nextStreak));
      setScore(s => s + reward);
      setCorrectCount(c => c + 1);
      setAttemptCount(a => a + 1);
      setLevel(l => l + 1);
      setPuzzleNonce(n => n + 1);
      levelStartTimeRef.current = Date.now();

      showToast(nextStreak >= 3 ? `+${reward} pts · ${nextStreak}× Streak` : `+${reward} pts`);
    },
    [activeGame, level, streak, showToast]
  );

  const handleWrong = useCallback(() => {
    const elapsedSecs = Number(Math.max(0.2, (Date.now() - levelStartTimeRef.current) / 1000).toFixed(2));

    levelRecordsRef.current.push({
      levelNumber: level,
      timeTakenSeconds: elapsedSecs,
      scoreEarned: 0,
      isCorrect: false,
    });

    setStreak(0);
    setAttemptCount(a => a + 1);
    setPuzzleNonce(n => n + 1);
    levelStartTimeRef.current = Date.now();
    showToast('Not quite — next puzzle', true);
  }, [level, showToast]);

  // Time expired or user finishes round early (idempotency-guarded)
  const handleTimeUp = useCallback(async () => {
    if (isSubmittingResultRef.current) return;
    isSubmittingResultRef.current = true;
    setIsPaused(false);
    pauseStartedAtRef.current = null;

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

    const isFinalMarathonGame = currentGameMode === 'marathon' && assessmentQueue.length === 0;

    const preliminaryResult: GameResult = {
      gameId: activeGame.id,
      gameName: activeGame.name,
      track: activeGame.track,
      mode: currentGameMode,
      marathonCompleted: isFinalMarathonGame,
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

    const activeUserId = user?.id || 'guest-anon';
    const dbSaveResponse = await dbService.recordGameSession(
      activeUserId,
      preliminaryResult,
      levelRecordsRef.current
    );

    // Refresh user profile in context (both Cloud and Local/Guest) to show updated XP & rank tier
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
  }, [
    activeGame,
    level,
    score,
    correctCount,
    attemptCount,
    durationSeconds,
    currentGameMode,
    assessmentQueue.length,
    user,
    refreshProfile,
  ]);

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
      setLastHubTab(tab);
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

  const anyModalOpen = isAuthOpen || isSettingsOpen || isSupabaseSetupOpen;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-vermilion-wash selection:text-ink">
      <FlashToast toast={toast} />
      <AchievementToast achievement={unlockedToast} onDismiss={handleDismissAchievementToast} />

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />
      <SupabaseSetupModal isOpen={isSupabaseSetupOpen} onClose={() => setIsSupabaseSetupOpen(false)} />

      <main className="max-w-6xl w-full mx-auto px-3.5 sm:px-8 lg:px-10 py-4 sm:py-9 flex-1 flex flex-col">
        {/* Swiss Editorial Masthead */}
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isInGame={screen === 'playing'}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSupabaseSetup={() => setIsSupabaseSetupOpen(true)}
        />

        {/* Main Editorial Viewport */}
        <div className="flex-1">
          {screen === 'hub' && (
            <ArenaHub
              currentTab={lastHubTab}
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
              onBack={handleGoHome}
            />
          )}

          {screen === 'playing' && (
            <GameShell
              game={activeGame}
              level={level}
              score={score}
              streak={streak}
              correctCount={correctCount}
              attemptCount={attemptCount}
              durationSeconds={durationSeconds}
              sessionNonce={sessionNonce}
              isPaused={isPaused}
              onPauseChange={handlePauseChange}
              onRestart={handleRestartRound}
              onFinishEarly={handleTimeUp}
              onTimeUp={handleTimeUp}
              onQuit={handleGoHome}
              queueProgress={queueProgress}
            >
              <GameRenderer
                gameId={activeGame.id}
                puzzleKey={`${activeGame.id}-${level}-${puzzleNonce}`}
                api={{
                  level,
                  isPaused: isPaused || anyModalOpen,
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
              bestStreak={bestStreak}
              hasNextInQueue={assessmentQueue.length > 0}
              nextGameName={assessmentQueue[0]?.name}
              onNextGame={handleNextInQueue}
              onPlayAgain={() => handleStartGame(activeGame, durationSeconds, currentGameMode)}
              onHome={handleGoHome}
            />
          )}

          {screen === 'leaderboards' && (
            <LeaderboardView onBack={handleGoHome} onPlayGame={handleDirectPlay} />
          )}

          {screen === 'history' && (
            <HistoryView onBack={handleGoHome} onPlayGame={handleDirectPlay} />
          )}

          {screen === 'analytics' && <AnalyticsView onBack={handleGoHome} />}

          {screen === 'achievements' && <AchievementsView onBack={handleGoHome} />}
        </div>

        {/* Minimal Editorial Colophon */}
        <footer className="mt-10 sm:mt-14 pt-5 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-ink-muted text-center sm:text-left">
          <span className="font-mono uppercase tracking-wider">Gamefied Apti — Editorial Edition</span>
          <span>Cloud-synced with Supabase PostgreSQL &amp; Zero-Trust Row Level Security</span>
        </footer>
      </main>
    </div>
  );
};

export default App;
