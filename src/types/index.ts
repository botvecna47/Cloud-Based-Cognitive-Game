export type TrackId = 'cognitive' | 'game-based';

export type GameId =
  // Track 1: Cognitive Aptitude
  | 'sum'
  | 'seq'
  | 'hanoi'
  | 'func'
  | 'pixel'
  | 'matrix'
  // Track 2: Game-Based Assessment
  | 'digit'
  | 'grid'
  | 'motion'
  | 'switch'
  | 'sudo'
  | 'inductive';

export type GameMode = 'practice' | 'assessment' | 'marathon';

export type RankTier =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'
  | 'Grandmaster';

export interface GameMetadata {
  id: GameId;
  track: TrackId;
  name: string;
  ability: string;
  category: 'Numerical' | 'Working Memory' | 'Planning' | 'Logical' | 'Deductive' | 'Pattern';
  icon: string;
  short: string;
  howto: string[];
  durationSeconds: number;
  weight?: number;
  targetLevels?: number;
  tips?: string;
}

export interface GameAPI {
  level: number;
  correct: () => void;
  wrong: () => void;
  onAction?: () => void;
}

export interface SessionLevelRecord {
  levelNumber: number;
  timeTakenSeconds: number;
  scoreEarned: number;
  isCorrect: boolean;
}

export interface GameResult {
  id?: string;
  gameId: GameId;
  gameName: string;
  track: TrackId;
  mode?: GameMode;
  score: number;
  level: number; // levels completed
  correct: number;
  attempts: number;
  accuracy: number;
  performanceIndex?: number;
  performanceBand?: 'Excellent' | 'Strong' | 'Fair' | 'Keep practising';
  date: string;
  durationSeconds: number;
  levelRecords?: SessionLevelRecord[];
  xpEarned?: number;
  newAchievements?: Achievement[];
}

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string;
  totalXp: number;
  rankTier: RankTier;
  gamesPlayed: number;
  bestPerformanceIndex: number;
  isGuest?: boolean;
  createdAt?: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  volume: number;
  hapticsEnabled: boolean;
  highContrast: boolean;
  preferredTrack: TrackId | 'all';
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'general' | 'accuracy' | 'speed' | 'endurance' | 'mastery';
  unlocked?: boolean;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  totalXp: number;
  rankTier: RankTier;
  gamesPlayed: number;
  bestScore?: number;
  bestLevel?: number;
  bestAccuracy?: number;
  bestPerformanceIndex?: number;
  updatedAt?: string;
}

export interface CognitiveAbilityScores {
  numerical: number;      // 0 - 100
  workingMemory: number;  // 0 - 100
  planning: number;       // 0 - 100
  logical: number;        // 0 - 100
  deductive: number;      // 0 - 100
  pattern: number;        // 0 - 100
}

export interface UserAnalytics {
  abilities: CognitiveAbilityScores;
  totalGamesPlayed: number;
  totalScore: number;
  overallAccuracy: number;
  highestPerformanceIndex: number;
  recentGamesTimeline: {
    date: string;
    gameName: string;
    score: number;
    accuracy: number;
  }[];
}

export interface UserStats {
  gamesPlayed: number;
  totalScore: number;
  averageAccuracy: number;
  bestScores: Record<GameId, number>;
  history: GameResult[];
}
