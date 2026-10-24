import React, { useState, useRef, useCallback } from 'react';
import { GameMetadata, GameResult, TrackId } from './types';
import { COGNITIVE_GAMES, GAME_BASED_GAMES, ALL_GAMES, getGameById } from './data/games';
import { Header } from './components/Header';
import { ArenaHub } from './components/ArenaHub';
import { InstructionsModal } from './components/InstructionsModal';
import { GameShell } from './components/GameShell';
import { ResultModal } from './components/ResultModal';
import { StatsDashboard } from './components/StatsDashboard';
import { FlashToast, ToastData } from './components/FlashToast';
import { GameRenderer } from './games/GameFactory';
import { saveGameResult } from './utils/storage';

type AppScreen = 'hub' | 'instructions' | 'playing' | 'result' | 'stats';

function sample<T>(arr: T[], k: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('hub');
  const [currentTab, setCurrentTab] = useState<'track1' | 'track2' | 'all' | 'stats'>('track1');

  // Active game & runner state
  const [activeGame, setActiveGame] = useState<GameMetadata>(COGNITIVE_GAMES[0]);
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameMetadata>(COGNITIVE_GAMES[0]);
  const [durationSeconds, setDurationSeconds] = useState<number>(360);

  const [level, setLevel] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  // Assessment Queue state
  const [assessmentQueue, setAssessmentQueue] = useState<GameMetadata[]>([]);
  const [queueProgress, setQueueProgress] = useState<{ current: number; total: number } | undefined>(undefined);

  // Floating score toast
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const levelStartTimeRef = useRef<number>(Date.now());

  const showToast = (message: string, isBad = false) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, isBad });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
    }, 1200);
  };

  // Start single game practice from instructions
  const handleStartGame = (game: GameMetadata, duration: number, queue?: GameMetadata[], currentNum?: number, totalNum?: number) => {
    setActiveGame(game);
    setDurationSeconds(duration);
    setLevel(1);
    setScore(0);
    setCorrectCount(0);
    setAttemptCount(0);
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

    if (track === 'cognitive') {
      pool = COGNITIVE_GAMES;
    } else if (track === 'game-based') {
      pool = GAME_BASED_GAMES;
    } else {
      pool = ALL_GAMES;
      count = 6;
    }

    const selected = sample(pool, count);
    const firstGame = selected[0];
    const remaining = selected.slice(1);

    handleStartGame(firstGame, 360, remaining, 1, count);
  };

  // Game API Handlers
  const handleCorrect = useCallback(() => {
    const elapsedSecs = Math.max(2, (Date.now() - levelStartTimeRef.current) / 1000);
    let reward = 0;

    if (activeGame.track === 'cognitive') {
      const w = activeGame.weight || 1;
      reward = Math.round((60 * w * level) / Math.max(3.5, elapsedSecs));
    } else {
      reward = Math.round((120 * level * level) / Math.max(2, elapsedSecs));
    }

    setScore(s => s + reward);
    setCorrectCount(c => c + 1);
    setAttemptCount(a => a + 1);
    setLevel(l => l + 1);
    levelStartTimeRef.current = Date.now();

    showToast(`+${reward} points!`);
  }, [activeGame, level]);

  const handleWrong = useCallback(() => {
    setAttemptCount(a => a + 1);
    levelStartTimeRef.current = Date.now();
    showToast('Not quite — next puzzle', true);
  }, []);

  // Time expired or user completes round
  const handleTimeUp = useCallback(() => {
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

    const result: GameResult = {
      gameId: activeGame.id,
      gameName: activeGame.name,
      track: activeGame.track,
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

    saveGameResult(result);
    setLastResult(result);
    setScreen('result');
  }, [activeGame, level, score, correctCount, attemptCount, durationSeconds]);

  // Next game in queue
  const handleNextInQueue = () => {
    if (assessmentQueue.length === 0) return;
    const nextGame = assessmentQueue[0];
    const remaining = assessmentQueue.slice(1);
    const nextRoundNumber = (queueProgress?.current || 1) + 1;
    const totalRounds = queueProgress?.total || 4;

    handleStartGame(nextGame, 360, remaining, nextRoundNumber, totalRounds);
  };

  const handleSelectTab = (tab: 'track1' | 'track2' | 'all' | 'stats') => {
    setCurrentTab(tab);
    if (tab === 'stats') {
      setScreen('stats');
    } else {
      setScreen('hub');
    }
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans">
      <FlashToast toast={toast} />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Persistent Pro Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          isInGame={screen === 'playing'}
        />

        {/* Main Panel Viewport */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-2xl relative">
          {screen === 'hub' && (
            <ArenaHub
              currentTab={currentTab === 'stats' ? 'track1' : currentTab}
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
              onStart={duration => handleStartGame(selectedGameForModal, duration)}
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
              onPlayAgain={() => handleStartGame(activeGame, durationSeconds)}
              onHome={() => setScreen('hub')}
            />
          )}

          {screen === 'stats' && <StatsDashboard onBack={() => setScreen('hub')} />}
        </div>

        {/* Footer info matching original HTML */}
        <footer className="text-center text-xs text-slate-500 mt-6 leading-relaxed">
          MOUNT ADEPT Cognitive Practice Arena · Modelled on real campus recruitment aptitude tests &
          Capgemini game rounds. Built for placement training and cognitive rehearsal.
        </footer>
      </main>
    </div>
  );
};

export default App;
