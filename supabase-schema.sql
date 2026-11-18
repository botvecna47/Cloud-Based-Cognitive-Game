-- ==============================================================================
-- GAMEFIED APTI: COGNITIVE & APTITUDE GAME ARENA
-- PRODUCTION HARDENED SUPABASE POSTGRESQL 17 SCHEMA (ZERO-TRUST RLS)
-- ==============================================================================
-- Security & Performance Controls Implemented:
-- 1. Zero-Trust Row Level Security (RLS) with (select auth.uid()) initPlan optimization
-- 2. Column-level PII protection: profiles.email revoked from public/anon/authenticated
-- 3. Strict Anti-Cheat: Direct client writes to user_high_scores & user_achievements blocked
-- 4. All SECURITY DEFINER triggers isolated in non-exposed `private` schema with SET search_path = ''
-- 5. Strict Allowlist Domain Constraints, Regex Validation & Full FK/Composite Indexing
-- ==============================================================================

-- 1. Create private schema for internal SECURITY DEFINER triggers/functions (not exposed to Data API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;

-- ==============================================================================
-- 2. CREATE SECURE CORE TABLES
-- ==============================================================================

-- PROFILES TABLE (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (
        username ~ '^[a-zA-Z0-9_\-\.]{3,24}$'
    ),
    email TEXT CHECK (
        email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    avatar_url TEXT NOT NULL DEFAULT 'brain-blue' CHECK (
        avatar_url IN ('brain-blue', 'crown-gold', 'lightning', 'rocket', 'diamond', 'robot', 'fire', 'star')
    ),
    total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    rank_tier TEXT NOT NULL DEFAULT 'Bronze' CHECK (
        rank_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster')
    ),
    games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
    best_performance_index INTEGER NOT NULL DEFAULT 0 CHECK (best_performance_index BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- USER SETTINGS TABLE (Client preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sound_enabled BOOLEAN NOT NULL DEFAULT true,
    volume INTEGER NOT NULL DEFAULT 80 CHECK (volume BETWEEN 0 AND 100),
    haptics_enabled BOOLEAN NOT NULL DEFAULT true,
    high_contrast BOOLEAN NOT NULL DEFAULT false,
    preferred_track TEXT NOT NULL DEFAULT 'cognitive' CHECK (preferred_track IN ('cognitive', 'game-based', 'all')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GAME SESSIONS (Verified records of played rounds)
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL CHECK (
        game_id IN ('sum', 'seq', 'hanoi', 'func', 'pixel', 'matrix', 'digit', 'grid', 'motion', 'switch', 'sudo', 'inductive')
    ),
    game_name TEXT NOT NULL CHECK (char_length(game_name) BETWEEN 2 AND 64),
    track_id TEXT NOT NULL CHECK (track_id IN ('cognitive', 'game-based')),
    mode TEXT NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice', 'assessment', 'marathon')),
    marathon_completed BOOLEAN NOT NULL DEFAULT false,
    score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 50000),
    levels_cleared INTEGER NOT NULL DEFAULT 0 CHECK (levels_cleared BETWEEN 0 AND 50),
    correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count BETWEEN 0 AND 500),
    attempts_count INTEGER NOT NULL DEFAULT 0 CHECK (attempts_count BETWEEN 0 AND 500 AND attempts_count >= correct_count),
    accuracy_pct INTEGER NOT NULL DEFAULT 0 CHECK (accuracy_pct BETWEEN 0 AND 100),
    performance_index INTEGER CHECK (performance_index IS NULL OR (performance_index BETWEEN 0 AND 100)),
    performance_band TEXT CHECK (performance_band IS NULL OR performance_band IN ('Excellent', 'Strong', 'Fair', 'Keep practising')),
    duration_seconds INTEGER NOT NULL DEFAULT 360 CHECK (duration_seconds BETWEEN 1 AND 7200),
    xp_awarded INTEGER NOT NULL DEFAULT 0 CHECK (xp_awarded >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS marathon_completed BOOLEAN NOT NULL DEFAULT false;

-- SESSION LEVEL RECORDS (Granular metrics per individual puzzle level)
CREATE TABLE IF NOT EXISTS public.session_level_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 50),
    time_taken_seconds NUMERIC(6,2) NOT NULL CHECK (time_taken_seconds BETWEEN 0.01 AND 600.00),
    score_earned INTEGER NOT NULL DEFAULT 0 CHECK (score_earned BETWEEN 0 AND 5000),
    is_correct BOOLEAN NOT NULL DEFAULT true,
    moves_count INTEGER CHECK (moves_count IS NULL OR moves_count BETWEEN 1 AND 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.session_level_records ADD COLUMN IF NOT EXISTS moves_count INTEGER CHECK (moves_count IS NULL OR moves_count BETWEEN 1 AND 500);

-- USER HIGH SCORES (Server-maintained personal bests)
CREATE TABLE IF NOT EXISTS public.user_high_scores (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL CHECK (
        game_id IN ('sum', 'seq', 'hanoi', 'func', 'pixel', 'matrix', 'digit', 'grid', 'motion', 'switch', 'sudo', 'inductive')
    ),
    best_score INTEGER NOT NULL DEFAULT 0 CHECK (best_score BETWEEN 0 AND 50000),
    best_level INTEGER NOT NULL DEFAULT 0 CHECK (best_level BETWEEN 0 AND 50),
    best_accuracy INTEGER NOT NULL DEFAULT 0 CHECK (best_accuracy BETWEEN 0 AND 100),
    best_performance_index INTEGER NOT NULL DEFAULT 0 CHECK (best_performance_index BETWEEN 0 AND 100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, game_id)
);

-- ACHIEVEMENTS CATALOG (Static game definitions)
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL CHECK (code ~ '^[A-Z0-9_]{3,32}$'),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 64),
    description TEXT NOT NULL CHECK (char_length(description) BETWEEN 5 AND 256),
    icon TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 100 CHECK (xp_reward BETWEEN 10 AND 5000),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'accuracy', 'speed', 'endurance', 'mastery'))
);

-- USER UNLOCKED ACHIEVEMENTS (Server-maintained unlocked badges)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- ==============================================================================
-- 3. EXPLICIT TABLE & COLUMN-LEVEL PRIVILEGES (PRINCIPLE OF LEAST PRIVILEGE)
-- ==============================================================================

-- Revoke broad default privileges and grant exact least-privilege access
REVOKE ALL ON public.profiles FROM public, anon, authenticated;
GRANT SELECT (id, username, avatar_url, total_xp, rank_tier, games_played, best_performance_index, created_at, updated_at)
    ON public.profiles TO anon, authenticated;
GRANT INSERT (id, username, avatar_url) ON public.profiles TO authenticated;
GRANT UPDATE (username, avatar_url, updated_at) ON public.profiles TO authenticated;

REVOKE ALL ON public.user_settings FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;

REVOKE ALL ON public.game_sessions FROM public, anon, authenticated;
GRANT SELECT, INSERT ON public.game_sessions TO authenticated;

REVOKE ALL ON public.session_level_records FROM public, anon, authenticated;
GRANT SELECT, INSERT ON public.session_level_records TO authenticated;

REVOKE ALL ON public.user_high_scores FROM public, anon, authenticated;
GRANT SELECT ON public.user_high_scores TO anon, authenticated;

REVOKE ALL ON public.achievements FROM public, anon, authenticated;
GRANT SELECT ON public.achievements TO anon, authenticated;

REVOKE ALL ON public.user_achievements FROM public, anon, authenticated;
GRANT SELECT ON public.user_achievements TO authenticated;

-- ==============================================================================
-- 4. HIGH-PERFORMANCE COMPOSITE & FOREIGN-KEY INDEXING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_created ON public.game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON public.game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_session_level_records_session_id ON public.session_level_records(session_id);
CREATE INDEX IF NOT EXISTS idx_session_level_records_user_id ON public.session_level_records(user_id);
CREATE INDEX IF NOT EXISTS idx_high_scores_game_score ON public.user_high_scores(game_id, best_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES WITH (select auth.uid()) INITPLAN
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_level_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view their own level records" ON public.session_level_records;
DROP POLICY IF EXISTS "Users can insert their own level records" ON public.session_level_records;
DROP POLICY IF EXISTS "High scores are viewable by everyone" ON public.user_high_scores;
DROP POLICY IF EXISTS "Users can insert their own high scores" ON public.user_high_scores;
DROP POLICY IF EXISTS "Users can update their own high scores" ON public.user_high_scores;
DROP POLICY IF EXISTS "Achievements catalog is viewable by everyone" ON public.achievements;
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can unlock their own achievements" ON public.user_achievements;

-- 5.1 PROFILES POLICIES (email column is revoked at table privilege level)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- 5.2 USER SETTINGS POLICIES
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- 5.3 GAME SESSIONS POLICIES
CREATE POLICY "Users can view their own sessions"
ON public.game_sessions FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.game_sessions FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- 5.4 SESSION LEVEL RECORDS POLICIES
CREATE POLICY "Users can view their own level records"
ON public.session_level_records FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own level records"
ON public.session_level_records FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- 5.5 USER HIGH SCORES POLICIES (READ-ONLY FOR CLIENTS — ANTI-CHEAT)
CREATE POLICY "High scores are viewable by everyone"
ON public.user_high_scores FOR SELECT
TO anon, authenticated
USING (true);

-- 5.6 ACHIEVEMENTS POLICIES (READ-ONLY FOR CLIENTS — ANTI-CHEAT)
CREATE POLICY "Achievements catalog is viewable by everyone"
ON public.achievements FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);

-- ==============================================================================
-- 6. SERVER-SIDE SECURITY FUNCTIONS & TRIGGERS (ISOLATED IN `private` SCHEMA)
-- ==============================================================================

-- Helper: Calculate rank tier from XP
CREATE OR REPLACE FUNCTION private.compute_rank_tier(xp INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
    IF xp >= 25000 THEN RETURN 'Grandmaster';
    ELSIF xp >= 15000 THEN RETURN 'Master';
    ELSIF xp >= 9000 THEN RETURN 'Diamond';
    ELSIF xp >= 5500 THEN RETURN 'Platinum';
    ELSIF xp >= 3000 THEN RETURN 'Gold';
    ELSIF xp >= 1000 THEN RETURN 'Silver';
    ELSE RETURN 'Bronze';
    END IF;
END;
$$;

-- Helper: Safely award an achievement and return its bonus XP if newly unlocked
CREATE OR REPLACE FUNCTION private.award_achievement_if_new(p_user_id UUID, p_ach_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    inserted_id TEXT;
    reward INTEGER := 0;
BEGIN
    INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (p_user_id, p_ach_id)
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING achievement_id INTO inserted_id;

    IF inserted_id IS NOT NULL THEN
        SELECT xp_reward INTO reward FROM public.achievements WHERE id = p_ach_id;
        RETURN COALESCE(reward, 0);
    END IF;

    RETURN 0;
END;
$$;

-- 6.1 PREVENT PROFILE STAT TAMPERING VIA DIRECT INSERT OR UPDATE
CREATE OR REPLACE FUNCTION private.protect_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF current_setting('app.allow_stat_update', true) = 'true' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.total_xp := 0;
        NEW.rank_tier := 'Bronze';
        NEW.games_played := 0;
        NEW.best_performance_index := 0;
        RETURN NEW;
    END IF;

    NEW.total_xp := OLD.total_xp;
    NEW.rank_tier := OLD.rank_tier;
    NEW.games_played := OLD.games_played;
    NEW.best_performance_index := OLD.best_performance_index;
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_stats ON public.profiles;
CREATE TRIGGER tr_protect_profile_stats
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION private.protect_profile_stats();

-- 6.2 AUTOMATIC PROFILE AND SETTINGS CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    clean_username TEXT;
    avatar_val TEXT;
BEGIN
    clean_username := COALESCE(
        REGEXP_REPLACE(NEW.raw_user_meta_data->>'username', '[^a-zA-Z0-9_\-\.]', '', 'g'),
        REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_\-\.]', '', 'g'),
        'Cadet_' || SUBSTRING(NEW.id::TEXT, 1, 6)
    );

    IF char_length(clean_username) < 3 THEN
        clean_username := 'Cadet_' || SUBSTRING(NEW.id::TEXT, 1, 6);
    ELSIF char_length(clean_username) > 24 THEN
        clean_username := SUBSTRING(clean_username, 1, 24);
    END IF;

    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) THEN
        clean_username := SUBSTRING(clean_username, 1, 19) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4);
    END IF;

    avatar_val := COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'brain-blue');
    IF avatar_val NOT IN ('brain-blue', 'crown-gold', 'lightning', 'rocket', 'diamond', 'robot', 'fire', 'star') THEN
        avatar_val := 'brain-blue';
    END IF;

    PERFORM set_config('app.allow_stat_update', 'true', true);

    INSERT INTO public.profiles (id, username, email, avatar_url, total_xp, rank_tier, games_played, best_performance_index)
    VALUES (NEW.id, clean_username, NEW.email, avatar_val, 0, 'Bronze', 0, 0)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- 6.3 AUTOMATIC GAME SESSION PROGRESSION & ACHIEVEMENTS PROCESSOR
CREATE OR REPLACE FUNCTION private.process_game_session()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    computed_xp INTEGER;
    bonus_xp INTEGER := 0;
    new_total_xp INTEGER;
    calculated_rank TEXT;
    current_pi INTEGER;
BEGIN
    computed_xp := ROUND(NEW.score * 0.5)
                 + ROUND((NEW.accuracy_pct::NUMERIC / 100.0) * 50)
                 + (NEW.levels_cleared * 20)
                 + COALESCE(ROUND(NEW.performance_index * 0.8), 0);

    INSERT INTO public.user_high_scores (user_id, game_id, best_score, best_level, best_accuracy, best_performance_index, updated_at)
    VALUES (
        NEW.user_id,
        NEW.game_id,
        NEW.score,
        NEW.levels_cleared,
        NEW.accuracy_pct,
        COALESCE(NEW.performance_index, 0),
        NOW()
    )
    ON CONFLICT (user_id, game_id) DO UPDATE SET
        best_score = GREATEST(public.user_high_scores.best_score, EXCLUDED.best_score),
        best_level = GREATEST(public.user_high_scores.best_level, EXCLUDED.best_level),
        best_accuracy = GREATEST(public.user_high_scores.best_accuracy, EXCLUDED.best_accuracy),
        best_performance_index = GREATEST(public.user_high_scores.best_performance_index, EXCLUDED.best_performance_index),
        updated_at = NOW();

    bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-1');
    IF NEW.score >= 100 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-2');
    END IF;
    IF NEW.accuracy_pct = 100 AND NEW.attempts_count >= 3 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-3');
    END IF;
    IF NEW.levels_cleared >= 5 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-4');
    END IF;
    IF NEW.game_id = 'hanoi' AND NEW.levels_cleared >= 2 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-6');
    END IF;
    IF NEW.game_id = 'pixel' AND NEW.accuracy_pct = 100 AND NEW.levels_cleared >= 1 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-8');
    END IF;
    IF NEW.game_id = 'digit' AND NEW.levels_cleared >= 5 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-9');
    END IF;
    IF NEW.game_id = 'sudo' AND NEW.accuracy_pct = 100 AND NEW.levels_cleared >= 1 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-10');
    END IF;
    IF NEW.mode = 'marathon' AND NEW.marathon_completed = true THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-11');
    END IF;
    IF NEW.performance_index >= 80 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-12');
    END IF;

    PERFORM set_config('app.allow_stat_update', 'true', true);

    SELECT total_xp, best_performance_index INTO new_total_xp, current_pi
    FROM public.profiles
    WHERE id = NEW.user_id;

    new_total_xp := COALESCE(new_total_xp, 0) + computed_xp + bonus_xp;
    current_pi := GREATEST(COALESCE(current_pi, 0), COALESCE(NEW.performance_index, 0));

    IF new_total_xp >= 1000 THEN
        new_total_xp := new_total_xp + private.award_achievement_if_new(NEW.user_id, 'ach-13');
    END IF;
    IF new_total_xp >= 3000 THEN
        new_total_xp := new_total_xp + private.award_achievement_if_new(NEW.user_id, 'ach-14');
    END IF;
    IF new_total_xp >= 9000 THEN
        new_total_xp := new_total_xp + private.award_achievement_if_new(NEW.user_id, 'ach-15');
    END IF;
    IF new_total_xp >= 25000 THEN
        new_total_xp := new_total_xp + private.award_achievement_if_new(NEW.user_id, 'ach-16');
    END IF;

    calculated_rank := private.compute_rank_tier(new_total_xp);
    NEW.xp_awarded := computed_xp + bonus_xp;

    UPDATE public.profiles
    SET total_xp = new_total_xp,
        rank_tier = calculated_rank,
        games_played = games_played + 1,
        best_performance_index = current_pi,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_process_game_session ON public.game_sessions;
CREATE TRIGGER tr_process_game_session
    BEFORE INSERT ON public.game_sessions
    FOR EACH ROW EXECUTE FUNCTION private.process_game_session();

-- 6.4 LEVEL TELEMETRY ACHIEVEMENT PROCESSOR (SPEED_DEMON & MAZE_NAVIGATOR)
CREATE OR REPLACE FUNCTION private.process_level_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    parent_game_id TEXT;
    bonus_xp INTEGER := 0;
BEGIN
    IF NOT NEW.is_correct THEN
        RETURN NEW;
    END IF;

    IF NEW.time_taken_seconds < 3.0 THEN
        bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-5');
    END IF;

    IF NEW.moves_count IS NOT NULL AND NEW.moves_count < 10 THEN
        SELECT game_id INTO parent_game_id FROM public.game_sessions WHERE id = NEW.session_id;
        IF parent_game_id = 'motion' THEN
            bonus_xp := bonus_xp + private.award_achievement_if_new(NEW.user_id, 'ach-7');
        END IF;
    END IF;

    IF bonus_xp > 0 THEN
        PERFORM set_config('app.allow_stat_update', 'true', true);
        UPDATE public.profiles
        SET total_xp = total_xp + bonus_xp,
            rank_tier = private.compute_rank_tier(total_xp + bonus_xp),
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_process_level_record ON public.session_level_records;
CREATE TRIGGER tr_process_level_record
    AFTER INSERT ON public.session_level_records
    FOR EACH ROW EXECUTE FUNCTION private.process_level_record();

-- ==============================================================================
-- 7. LEADERBOARD VIEW WITH SECURITY INVOKER (NO EMAIL EXPOSED)
-- ==============================================================================
CREATE OR REPLACE VIEW public.leaderboard_view
WITH (security_invoker = true)
AS
SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    p.total_xp,
    p.rank_tier,
    p.games_played,
    p.best_performance_index,
    h.game_id,
    h.best_score,
    h.best_level,
    h.best_accuracy,
    h.updated_at
FROM public.profiles p
LEFT JOIN public.user_high_scores h ON p.id = h.user_id;

GRANT SELECT ON public.leaderboard_view TO anon, authenticated;

-- ==============================================================================
-- 8. SEED ACHIEVEMENTS CATALOG
-- ==============================================================================
INSERT INTO public.achievements (id, code, title, description, icon, xp_reward, category)
VALUES
    ('ach-1', 'FIRST_STEP', 'First Step', 'Complete your very first practice round in any game', '🚀', 100, 'general'),
    ('ach-2', 'CENTURY_CLUB', 'Century Club', 'Score 100 or more points in a single round', '💯', 150, 'general'),
    ('ach-3', 'SHARPSHOOTER', 'Flawless Mind', 'Finish an assessment round with 100% accuracy', '🎯', 250, 'accuracy'),
    ('ach-4', 'DEEP_FOCUS', 'Deep Focus', 'Clear 5 consecutive levels in any cognitive game', '🧠', 200, 'mastery'),
    ('ach-5', 'SPEED_DEMON', 'Lightning Reflexes', 'Solve any puzzle level in under 3 seconds', '⚡', 200, 'speed'),
    ('ach-6', 'HANOI_ARCHITECT', 'Tower Architect', 'Clear Stack Sort with 4 or more disks', '🗼', 300, 'mastery'),
    ('ach-7', 'MAZE_NAVIGATOR', 'Pathfinder', 'Reach the hole in Motion Challenge in under 10 moves', '🏁', 250, 'speed'),
    ('ach-8', 'NONOGRAM_ARTIST', 'Pixel Detective', 'Complete a Pixel Logic puzzle without any wrong checks', '🔳', 300, 'accuracy'),
    ('ach-9', 'EQUATION_BALANCER', 'Math Wizard', 'Complete 5 levels of Digit Challenge', '🔢', 250, 'mastery'),
    ('ach-10', 'LATIN_GENIUS', 'Sudo Master', 'Solve a Geo-Sudo puzzle without checking errors', '🔷', 350, 'mastery'),
    ('ach-11', 'MARATHON_CHAMPION', 'Cognitive Marathoner', 'Complete the 6-game Grand Cognitive Marathon', '🏆', 500, 'endurance'),
    ('ach-12', 'PERFECT_INDEX', 'Aptitude Prodigy', 'Achieve an official Performance Index of 80+ (Excellent Band)', '👑', 500, 'mastery'),
    ('ach-13', 'SILVER_RANK', 'Rising Contender', 'Reach Silver Tier rank (1,000+ XP)', '🥈', 200, 'general'),
    ('ach-14', 'GOLD_RANK', 'Aptitude Veteran', 'Reach Gold Tier rank (3,000+ XP)', '🥇', 400, 'general'),
    ('ach-15', 'DIAMOND_RANK', 'Elite Strategist', 'Reach Diamond Tier rank (9,000+ XP)', '💎', 800, 'general'),
    ('ach-16', 'GRANDMASTER', 'Cognitive Grandmaster', 'Reach Grandmaster Tier (25,000+ XP)', '🌌', 1500, 'mastery')
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    xp_reward = EXCLUDED.xp_reward,
    category = EXCLUDED.category;
