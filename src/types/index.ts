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

export interface GameMetadata {
  id: GameId;
  track: TrackId;
  name: string;
  ability: string;
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

export interface GameResult {
  gameId: GameId;
  gameName: string;
  track: TrackId;
  score: number;
  level: number; // levels completed
  correct: number;
  attempts: number;
  accuracy: number;
  performanceIndex?: number;
  performanceBand?: 'Excellent' | 'Strong' | 'Fair' | 'Keep practising';
  date: string;
  durationSeconds: number;
}

export interface UserStats {
  gamesPlayed: number;
  totalScore: number;
  averageAccuracy: number;
  bestScores: Record<GameId, number>;
  history: GameResult[];
}
