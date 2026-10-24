import { GameId, GameResult, UserStats } from '../types';

const STATS_KEY = 'aptitude_user_stats';

const defaultStats: UserStats = {
  gamesPlayed: 0,
  totalScore: 0,
  averageAccuracy: 0,
  bestScores: {} as Record<GameId, number>,
  history: [],
};

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw);
    return {
      ...defaultStats,
      ...parsed,
      bestScores: parsed.bestScores || {},
      history: parsed.history || [],
    };
  } catch {
    return defaultStats;
  }
}

export function saveGameResult(result: GameResult): UserStats {
  const current = loadUserStats();
  const history = [result, ...current.history].slice(0, 100); // keep last 100

  const gamesPlayed = current.gamesPlayed + 1;
  const totalScore = current.totalScore + result.score;
  const totalAccSum = history.reduce((acc, h) => acc + h.accuracy, 0);
  const averageAccuracy = Math.round(totalAccSum / history.length);

  const bestScores = { ...current.bestScores };
  const prevBest = bestScores[result.gameId] || 0;
  if (result.score > prevBest) {
    bestScores[result.gameId] = result.score;
  }

  const updated: UserStats = {
    gamesPlayed,
    totalScore,
    averageAccuracy,
    bestScores,
    history,
  };

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch {
    // ignore quota errors
  }

  return updated;
}

export function clearUserStats(): void {
  try {
    localStorage.removeItem(STATS_KEY);
  } catch {
    // ignore
  }
}
