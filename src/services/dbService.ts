import { supabase, isSupabaseConfigured } from './supabase';
import {
  GameResult,
  SessionLevelRecord,
  UserProfile,
  Achievement,
  LeaderboardEntry,
  UserAnalytics,
  RankTier,
  GameId,
} from '../types';
import { ACHIEVEMENTS_CATALOG } from '../data/games';

export function calculateRank(xp: number): RankTier {
  if (xp >= 25000) return 'Grandmaster';
  if (xp >= 15000) return 'Master';
  if (xp >= 9000) return 'Diamond';
  if (xp >= 5500) return 'Platinum';
  if (xp >= 3000) return 'Gold';
  if (xp >= 1000) return 'Silver';
  return 'Bronze';
}

const LOCAL_STORAGE_KEY_PREFIX = 'mount_adept_';

export const ALLOWED_AVATARS = [
  'brain-blue',
  'crown-gold',
  'lightning',
  'rocket',
  'diamond',
  'robot',
  'fire',
  'star',
] as const;

export const ALLOWED_GAME_IDS: readonly GameId[] = [
  'sum',
  'seq',
  'hanoi',
  'func',
  'pixel',
  'matrix',
  'digit',
  'grid',
  'motion',
  'switch',
  'sudo',
  'inductive',
] as const;

// --------------------------------------------------------------------------
// INPUT SANITIZATION & DEFENSIVE HELPERS
// --------------------------------------------------------------------------
export function sanitizeUsername(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-\.]/g, '').trim();
  if (cleaned.length < 3) return 'Cadet_' + Math.floor(1000 + Math.random() * 9000);
  return cleaned.slice(0, 24);
}

export function sanitizeAvatar(raw?: string): string {
  if (raw && (ALLOWED_AVATARS as readonly string[]).includes(raw)) {
    return raw;
  }
  return 'brain-blue';
}

function clampNumber(val: unknown, min: number, max: number, defaultVal: number): number {
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
}

// --------------------------------------------------------------------------
// LOCAL FALLBACK DATA HELPERS (Ensures zero-downtime if Supabase is offline)
// --------------------------------------------------------------------------
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

// --------------------------------------------------------------------------
// DB SERVICE
// --------------------------------------------------------------------------
export const dbService = {
  /**
   * Record a completed game session with level-by-level telemetry, XP awards,
   * high score updates, and achievement checks.
   */
  async recordGameSession(
    userId: string,
    result: GameResult,
    levelRecords: SessionLevelRecord[] = []
  ): Promise<{
    session: GameResult;
    xpEarned: number;
    newRank: RankTier;
    newAchievements: Achievement[];
    isNewHighScore: boolean;
  }> {
    // 1. Sanitize & clamp all session metrics defensively
    const safeScore = clampNumber(result.score, 0, 50000, 0);
    const safeLevel = clampNumber(result.level, 0, 50, 0);
    const safeAttempts = clampNumber(result.attempts, 0, 500, 0);
    const safeCorrect = clampNumber(result.correct, 0, safeAttempts, 0);
    const safeAccuracy = clampNumber(result.accuracy, 0, 100, 0);
    const safeDuration = clampNumber(result.durationSeconds, 1, 7200, 360);
    const safePI = result.performanceIndex !== undefined && result.performanceIndex !== null
      ? clampNumber(result.performanceIndex, 0, 100, 0)
      : undefined;

    const safeLevelRecords: SessionLevelRecord[] = levelRecords.map(r => ({
      levelNumber: clampNumber(r.levelNumber, 1, 50, 1),
      timeTakenSeconds: Number(clampNumber(r.timeTakenSeconds, 0.01, 600, 1.0).toFixed(2)),
      scoreEarned: clampNumber(r.scoreEarned, 0, 5000, 0),
      isCorrect: Boolean(r.isCorrect),
    }));

    // 2. Compute XP earned
    const baseScoreXp = Math.round(safeScore * 0.5);
    const accuracyBonus = Math.round((safeAccuracy / 100) * 50);
    const levelBonus = safeLevel * 20;
    const performanceIndexBonus = safePI ? Math.round(safePI * 0.8) : 0;
    const totalXpEarned = baseScoreXp + accuracyBonus + levelBonus + performanceIndexBonus;

    // 3. Offline / Local fallback branch if Supabase is not configured or in guest mode
    if (!isSupabaseConfigured || !supabase || userId.startsWith('guest-')) {
      const localSessions = getLocalItem<GameResult[]>('sessions', []);
      const sessionId = 'session_' + Date.now();
      const enrichedResult: GameResult = {
        ...result,
        id: sessionId,
        score: safeScore,
        level: safeLevel,
        attempts: safeAttempts,
        correct: safeCorrect,
        accuracy: safeAccuracy,
        durationSeconds: safeDuration,
        performanceIndex: safePI,
        levelRecords: safeLevelRecords,
        xpEarned: totalXpEarned,
      };

      localSessions.unshift(enrichedResult);
      setLocalItem('sessions', localSessions);

      // Update local profile
      const localProfile = getLocalItem<UserProfile>('profile', {
        id: userId,
        username: userId.startsWith('guest-') ? 'Guest Player' : 'Cadet',
        avatarUrl: 'brain-blue',
        totalXp: 0,
        rankTier: 'Bronze',
        gamesPlayed: 0,
        bestPerformanceIndex: 0,
        isGuest: userId.startsWith('guest-'),
      });

      const updatedXp = localProfile.totalXp + totalXpEarned;
      const updatedRank = calculateRank(updatedXp);
      const updatedBestPI = Math.max(localProfile.bestPerformanceIndex, safePI || 0);

      const updatedProfile: UserProfile = {
        ...localProfile,
        totalXp: updatedXp,
        rankTier: updatedRank,
        gamesPlayed: localProfile.gamesPlayed + 1,
        bestPerformanceIndex: updatedBestPI,
      };
      setLocalItem('profile', updatedProfile);

      // Update High Scores
      const localHighScores = getLocalItem<Record<string, number>>('high_scores', {});
      const previousBest = localHighScores[result.gameId] || 0;
      const isNewHighScore = safeScore > previousBest;
      if (isNewHighScore) {
        localHighScores[result.gameId] = safeScore;
        setLocalItem('high_scores', localHighScores);
      }

      // Check achievements locally
      const localUnlocked = getLocalItem<string[]>('unlocked_achievements', []);
      const newlyUnlocked: Achievement[] = [];

      const checkAndAward = (code: string) => {
        if (!localUnlocked.includes(code)) {
          const ach = ACHIEVEMENTS_CATALOG.find(a => a.code === code);
          if (ach) {
            localUnlocked.push(code);
            newlyUnlocked.push({ ...ach, unlocked: true, unlockedAt: new Date().toISOString() });
          }
        }
      };

      checkAndAward('FIRST_STEP');
      if (safeScore >= 100) checkAndAward('CENTURY_CLUB');
      if (safeAccuracy === 100 && safeAttempts >= 3) checkAndAward('SHARPSHOOTER');
      if (safeLevel >= 5) checkAndAward('DEEP_FOCUS');
      if (safeLevelRecords.some(r => r.isCorrect && r.timeTakenSeconds < 3.0)) checkAndAward('SPEED_DEMON');
      if (result.gameId === 'hanoi' && safeLevel >= 3) checkAndAward('HANOI_ARCHITECT');
      if (result.gameId === 'pixel' && safeAccuracy === 100) checkAndAward('NONOGRAM_ARTIST');
      if (result.gameId === 'digit' && safeLevel >= 5) checkAndAward('EQUATION_BALANCER');
      if (result.gameId === 'sudo' && safeAccuracy === 100) checkAndAward('LATIN_GENIUS');
      if (result.mode === 'marathon') checkAndAward('MARATHON_CHAMPION');
      if (safePI && safePI >= 80) checkAndAward('PERFECT_INDEX');
      if (updatedXp >= 1000) checkAndAward('SILVER_RANK');
      if (updatedXp >= 3000) checkAndAward('GOLD_RANK');
      if (updatedXp >= 7500) checkAndAward('DIAMOND_RANK');
      if (updatedXp >= 15000) checkAndAward('GRANDMASTER');

      setLocalItem('unlocked_achievements', localUnlocked);

      return {
        session: enrichedResult,
        xpEarned: totalXpEarned,
        newRank: updatedRank,
        newAchievements: newlyUnlocked,
        isNewHighScore,
      };
    }

    // 4. Supabase Cloud Database Execution
    const client = supabase;
    if (!client) {
      return this.recordGameSession(`guest-${userId}`, result, levelRecords);
    }

    try {
      // 4.1 Insert Game Session (Database trigger tr_process_game_session automatically updates high scores, profile, XP & achievements)
      const { data: sessionData, error: sessionError } = await client
        .from('game_sessions')
        .insert({
          user_id: userId,
          game_id: result.gameId,
          game_name: result.gameName.slice(0, 64),
          track_id: result.track,
          mode: result.mode || 'practice',
          score: safeScore,
          levels_cleared: safeLevel,
          correct_count: safeCorrect,
          attempts_count: safeAttempts,
          accuracy_pct: safeAccuracy,
          performance_index: safePI ?? null,
          performance_band: result.performanceBand || null,
          duration_seconds: safeDuration,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const sessionId = sessionData.id;

      // 4.2 Insert Granular Level Telemetry if provided
      if (safeLevelRecords.length > 0) {
        const telemetryPayload = safeLevelRecords.map(r => ({
          session_id: sessionId,
          user_id: userId,
          level_number: r.levelNumber,
          time_taken_seconds: r.timeTakenSeconds,
          score_earned: r.scoreEarned,
          is_correct: r.isCorrect,
        }));

        await client.from('session_level_records').insert(telemetryPayload);
      }

      // 4.3 High score status check
      let isNewHighScore = false;
      const { data: existingHighScore } = await client
        .from('user_high_scores')
        .select('best_score')
        .eq('user_id', userId)
        .eq('game_id', result.gameId)
        .maybeSingle();

      if (!existingHighScore || safeScore > (existingHighScore.best_score || 0)) {
        isNewHighScore = true;
      }

      // 4.4 Read authoritative updated profile from Supabase
      const { data: authoritativeProfile } = await client
        .from('profiles')
        .select('total_xp, rank_tier, games_played, best_performance_index')
        .eq('id', userId)
        .maybeSingle();

      const newTotalXp = authoritativeProfile?.total_xp ?? totalXpEarned;
      const newRank = (authoritativeProfile?.rank_tier as RankTier) || calculateRank(newTotalXp);

      // 4.5 Fetch newly unlocked achievements
      const { data: userAchs } = await client
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      const unlockedSet = new Set((userAchs || []).map(a => a.achievement_id));
      const newlyUnlocked: Achievement[] = ACHIEVEMENTS_CATALOG.filter(a => unlockedSet.has(a.id)).map(a => ({
        ...a,
        unlocked: true,
      }));

      return {
        session: {
          ...result,
          id: sessionId,
          score: safeScore,
          level: safeLevel,
          attempts: safeAttempts,
          correct: safeCorrect,
          accuracy: safeAccuracy,
          durationSeconds: safeDuration,
          performanceIndex: safePI,
          levelRecords: safeLevelRecords,
          xpEarned: totalXpEarned,
        },
        xpEarned: totalXpEarned,
        newRank,
        newAchievements: newlyUnlocked,
        isNewHighScore,
      };
    } catch (err) {
      console.error('[Supabase] Failed to write session to cloud, falling back to local storage:', err);
      return this.recordGameSession(`guest-${userId}`, result, levelRecords);
    }
  },

  /**
   * Fetch game history for the current user
   */
  async getUserHistory(
    userId: string,
    filterTrack?: string,
    filterGameId?: string,
    limit = 50
  ): Promise<GameResult[]> {
    const clampedLimit = clampNumber(limit, 1, 100, 50);

    if (!isSupabaseConfigured || !supabase || userId.startsWith('guest-')) {
      let sessions = getLocalItem<GameResult[]>('sessions', []);
      if (filterTrack && filterTrack !== 'all') {
        sessions = sessions.filter(s => s.track === filterTrack);
      }
      if (filterGameId && filterGameId !== 'all') {
        sessions = sessions.filter(s => s.gameId === filterGameId);
      }
      return sessions.slice(0, clampedLimit);
    }

    try {
      let query = supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(clampedLimit);

      if (filterTrack && filterTrack !== 'all') {
        query = query.eq('track_id', filterTrack);
      }
      if (filterGameId && filterGameId !== 'all') {
        query = query.eq('game_id', filterGameId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        gameId: row.game_id as GameId,
        gameName: row.game_name,
        track: row.track_id,
        mode: row.mode,
        score: row.score,
        level: row.levels_cleared,
        correct: row.correct_count,
        attempts: row.attempts_count,
        accuracy: row.accuracy_pct,
        performanceIndex: row.performance_index,
        performanceBand: row.performance_band,
        date: row.created_at,
        durationSeconds: row.duration_seconds,
      }));
    } catch (err) {
      console.warn('[Supabase] Error loading history:', err);
      return getLocalItem<GameResult[]>('sessions', []);
    }
  },

  /**
   * Fetch granular telemetry for a single session
   */
  async getSessionTelemetry(sessionId: string): Promise<SessionLevelRecord[]> {
    if (!isSupabaseConfigured || !supabase || sessionId.startsWith('session_')) {
      const sessions = getLocalItem<GameResult[]>('sessions', []);
      const found = sessions.find(s => s.id === sessionId);
      return found?.levelRecords || [];
    }

    try {
      const { data, error } = await supabase
        .from('session_level_records')
        .select('*')
        .eq('session_id', sessionId)
        .order('level_number', { ascending: true });

      if (error) throw error;
      return (data || []).map(r => ({
        levelNumber: r.level_number,
        timeTakenSeconds: Number(r.time_taken_seconds),
        scoreEarned: r.score_earned,
        isCorrect: r.is_correct,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch global leaderboard
   */
  async getLeaderboard(gameId?: string, limit = 25): Promise<LeaderboardEntry[]> {
    const clampedLimit = clampNumber(limit, 1, 100, 25);

    if (!isSupabaseConfigured || !supabase) {
      const localProfile = getLocalItem<UserProfile>('profile', {
        id: 'local-user',
        username: 'Cadet',
        avatarUrl: 'brain-blue',
        totalXp: 1200,
        rankTier: 'Silver',
        gamesPlayed: 5,
        bestPerformanceIndex: 78,
      });

      return [
        {
          userId: 'bot-1',
          username: 'AptitudePro_99',
          avatarUrl: 'brain-purple',
          totalXp: 16800,
          rankTier: 'Grandmaster',
          gamesPlayed: 82,
          bestScore: 2450,
          bestPerformanceIndex: 94,
        },
        {
          userId: 'bot-2',
          username: 'QuantMaster',
          avatarUrl: 'brain-cyan',
          totalXp: 11400,
          rankTier: 'Diamond',
          gamesPlayed: 54,
          bestScore: 2180,
          bestPerformanceIndex: 88,
        },
        {
          userId: localProfile.id,
          username: localProfile.username + ' (You)',
          avatarUrl: localProfile.avatarUrl,
          totalXp: localProfile.totalXp,
          rankTier: localProfile.rankTier,
          gamesPlayed: localProfile.gamesPlayed,
          bestScore: 1250,
          bestPerformanceIndex: localProfile.bestPerformanceIndex,
        },
      ];
    }

    try {
      if (gameId && gameId !== 'all') {
        const { data, error } = await supabase
          .from('user_high_scores')
          .select(`
            game_id,
            best_score,
            best_level,
            best_accuracy,
            best_performance_index,
            updated_at,
            profiles (
              id,
              username,
              avatar_url,
              total_xp,
              rank_tier,
              games_played
            )
          `)
          .eq('game_id', gameId)
          .order('best_score', { ascending: false })
          .limit(clampedLimit);

        if (error) throw error;

        return (data || []).map((row: any) => ({
          userId: row.profiles?.id || '',
          username: row.profiles?.username || 'Player',
          avatarUrl: sanitizeAvatar(row.profiles?.avatar_url),
          totalXp: row.profiles?.total_xp || 0,
          rankTier: row.profiles?.rank_tier || 'Bronze',
          gamesPlayed: row.profiles?.games_played || 0,
          bestScore: row.best_score,
          bestLevel: row.best_level,
          bestAccuracy: row.best_accuracy,
          bestPerformanceIndex: row.best_performance_index,
          updatedAt: row.updated_at,
        }));
      } else {
        // Overall XP Leaderboard
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, total_xp, rank_tier, games_played, best_performance_index')
          .order('total_xp', { ascending: false })
          .limit(clampedLimit);

        if (error) throw error;

        return (data || []).map(p => ({
          userId: p.id,
          username: p.username,
          avatarUrl: sanitizeAvatar(p.avatar_url),
          totalXp: p.total_xp,
          rankTier: p.rank_tier,
          gamesPlayed: p.games_played,
          bestPerformanceIndex: p.best_performance_index,
        }));
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch leaderboard:', err);
      return [];
    }
  },

  /**
   * Fetch achievements catalog merged with user's unlock statuses
   */
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    if (!isSupabaseConfigured || !supabase || userId.startsWith('guest-')) {
      const unlocked = getLocalItem<string[]>('unlocked_achievements', ['FIRST_STEP']);
      return ACHIEVEMENTS_CATALOG.map(ach => ({
        ...ach,
        unlocked: unlocked.includes(ach.code),
      }));
    }

    try {
      const { data: userAchs, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      if (error) throw error;

      const map = new Map<string, string>();
      (userAchs || []).forEach(r => map.set(r.achievement_id, r.unlocked_at));

      return ACHIEVEMENTS_CATALOG.map(ach => ({
        ...ach,
        unlocked: map.has(ach.id),
        unlockedAt: map.get(ach.id),
      }));
    } catch {
      return ACHIEVEMENTS_CATALOG.map(a => ({ ...a, unlocked: false }));
    }
  },

  /**
   * Compute multi-dimensional cognitive analytics from session history
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const history = await this.getUserHistory(userId, 'all', 'all', 100);

    const calculateCategoryScore = (gameIds: GameId[]): number => {
      const filtered = history.filter(h => gameIds.includes(h.gameId));
      if (filtered.length === 0) return 50; // default baseline
      const avgAcc = filtered.reduce((acc, h) => acc + h.accuracy, 0) / filtered.length;
      const avgPI = filtered.reduce((acc, h) => acc + (h.performanceIndex || (h.accuracy * 0.8)), 0) / filtered.length;
      return Math.round(Math.min(100, Math.max(20, (avgAcc * 0.4 + avgPI * 0.6))));
    };

    const abilities = {
      numerical: calculateCategoryScore(['sum', 'digit']),
      workingMemory: calculateCategoryScore(['seq', 'grid']),
      planning: calculateCategoryScore(['hanoi', 'motion']),
      logical: calculateCategoryScore(['func', 'switch']),
      deductive: calculateCategoryScore(['pixel', 'sudo']),
      pattern: calculateCategoryScore(['matrix', 'inductive']),
    };

    const totalScore = history.reduce((acc, h) => acc + h.score, 0);
    const overallAccuracy = history.length > 0 ? Math.round(history.reduce((acc, h) => acc + h.accuracy, 0) / history.length) : 0;
    const highestPerformanceIndex = history.reduce((max, h) => Math.max(max, h.performanceIndex || 0), 0);

    const recentGamesTimeline = history.slice(0, 7).reverse().map(h => ({
      date: new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      gameName: h.gameName,
      score: h.score,
      accuracy: h.accuracy,
    }));

    return {
      abilities,
      totalGamesPlayed: history.length,
      totalScore,
      overallAccuracy,
      highestPerformanceIndex,
      recentGamesTimeline,
    };
  },

  /**
   * Update profile username and avatar with strict client-side validation
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const cleanUsername = updates.username ? sanitizeUsername(updates.username) : undefined;
    const cleanAvatar = updates.avatarUrl ? sanitizeAvatar(updates.avatarUrl) : undefined;

    if (!isSupabaseConfigured || !supabase || userId.startsWith('guest-')) {
      const current = getLocalItem<UserProfile>('profile', {
        id: userId,
        username: cleanUsername || 'Player',
        avatarUrl: cleanAvatar || 'brain-blue',
        totalXp: 0,
        rankTier: 'Bronze',
        gamesPlayed: 0,
        bestPerformanceIndex: 0,
      });

      const updated = {
        ...current,
        ...(cleanUsername ? { username: cleanUsername } : {}),
        ...(cleanAvatar ? { avatarUrl: cleanAvatar } : {}),
      };
      setLocalItem('profile', updated);
      return updated;
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (cleanUsername) payload.username = cleanUsername;
    if (cleanAvatar) payload.avatar_url = cleanAvatar;

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      avatarUrl: sanitizeAvatar(data.avatar_url),
      totalXp: data.total_xp,
      rankTier: data.rank_tier,
      gamesPlayed: data.games_played,
      bestPerformanceIndex: data.best_performance_index,
    };
  },

  /**
   * Export all user records as sanitized JSON backup (redacting sensitive tokens)
   */
  async exportUserData(userId: string): Promise<string> {
    const history = await this.getUserHistory(userId, 'all', 'all', 500);
    const achievements = await this.getUserAchievements(userId);
    const analytics = await this.getUserAnalytics(userId);

    const exportBundle = {
      exportDate: new Date().toISOString(),
      appVersion: '2.0.0',
      securityCompliance: 'OWASP-ASVS-L2-Aligned',
      userId: userId.startsWith('guest-') ? 'guest-session' : 'player_' + userId.slice(0, 8),
      history,
      achievements: achievements.filter(a => a.unlocked).map(a => ({
        code: a.code,
        title: a.title,
        unlockedAt: a.unlockedAt,
      })),
      analytics,
    };

    return JSON.stringify(exportBundle, null, 2);
  },
};
