import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../services/supabase';
import { UserProfile } from '../types';
import {
  dbService,
  calculateRank,
  sanitizeUsername,
  sanitizeAvatar,
  loadLocalProfile,
  saveLocalProfile,
  clearLocalProfile,
} from '../services/dbService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isSupabaseOnline: boolean;
  connectionStatusMessage: string;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsGuest: (customUsername?: string) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sanitizeAuthError(rawMsg: string): string {
  if (!rawMsg) return 'Authentication error. Please check your credentials and try again.';
  if (rawMsg.includes('Invalid login credentials')) return 'Invalid email or password.';
  if (rawMsg.includes('User already registered')) return 'An account with this email already exists.';
  if (rawMsg.includes('Password should be at least')) return 'Password must be at least 6 characters long.';
  if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
    return 'Unable to contact authentication server. Please check your internet connection.';
  }
  return rawMsg;
}

const PROFILE_COLUMNS =
  'id, username, avatar_url, total_xp, rank_tier, games_played, best_performance_index, created_at';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [connectionStatusMessage, setConnectionStatusMessage] = useState<string>('Initializing...');
  const [authError, setAuthError] = useState<string | null>(null);

  // Load authenticated Supabase user profile (explicit columns, email comes from Auth session)
  const loadProfileForUser = useCallback(async (supabaseUserId: string, email?: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', supabaseUserId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          username: sanitizeUsername(data.username),
          email,
          avatarUrl: sanitizeAvatar(data.avatar_url),
          totalXp: data.total_xp || 0,
          rankTier: data.rank_tier || calculateRank(data.total_xp || 0),
          gamesPlayed: data.games_played || 0,
          bestPerformanceIndex: data.best_performance_index || 0,
          isGuest: false,
          createdAt: data.created_at,
        });
      } else {
        const derivedName = email ? email.split('@')[0] : 'Player_' + supabaseUserId.slice(0, 5);
        const cleanName = sanitizeUsername(derivedName);
        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUserId,
            username: cleanName,
            avatar_url: 'brain-blue',
          })
          .select(PROFILE_COLUMNS)
          .single();

        if (!insertErr && newProfile) {
          setUser({
            id: newProfile.id,
            username: sanitizeUsername(newProfile.username),
            email,
            avatarUrl: sanitizeAvatar(newProfile.avatar_url),
            totalXp: 0,
            rankTier: 'Bronze',
            gamesPlayed: 0,
            bestPerformanceIndex: 0,
            isGuest: false,
          });
        }
      }
    } catch (err) {
      console.error('[AuthContext] Error loading user profile:', err);
    }
  }, []);

  // Refresh user profile in BOTH Supabase Cloud mode and Local Sandbox / Guest mode
  const refreshProfile = useCallback(async () => {
    if (user && !user.isGuest && isSupabaseConfigured && supabase) {
      await loadProfileForUser(user.id, user.email);
      return;
    }
    const updatedLocal = loadLocalProfile();
    if (updatedLocal) {
      setUser(prev => (prev ? { ...prev, ...updatedLocal } : updatedLocal));
    }
  }, [user, loadProfileForUser]);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    function createDefaultGuest() {
      const guestUser: UserProfile = {
        id: 'guest-' + Math.random().toString(36).substring(2, 9),
        username: 'AptitudePlayer',
        avatarUrl: 'brain-blue',
        totalXp: 0,
        rankTier: 'Bronze',
        gamesPlayed: 0,
        bestPerformanceIndex: 0,
        isGuest: true,
      };
      saveLocalProfile(guestUser);
      setUser(guestUser);
    }

    async function initAuth() {
      setIsLoading(true);

      const status = await testSupabaseConnection();
      if (!isMounted) return;

      setIsSupabaseOnline(status.connected);
      setConnectionStatusMessage(status.message);

      if (isSupabaseConfigured && supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          await loadProfileForUser(session.user.id, session.user.email);
        } else {
          const savedLocal = loadLocalProfile();
          if (savedLocal) {
            setUser(savedLocal);
          } else {
            createDefaultGuest();
          }
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
          if (!isMounted) return;
          if (event === 'SIGNED_IN' && nextSession?.user) {
            await loadProfileForUser(nextSession.user.id, nextSession.user.email);
          } else if (event === 'SIGNED_OUT') {
            createDefaultGuest();
          }
        });
        authSubscription = authListener.subscription;
      } else {
        const savedLocal = loadLocalProfile();
        if (savedLocal) {
          setUser(savedLocal);
        } else {
          createDefaultGuest();
        }
      }

      if (isMounted) setIsLoading(false);
    }

    initAuth();

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, [loadProfileForUser]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    setAuthError(null);

    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      const err = 'Please enter a valid email address.';
      setAuthError(err);
      return { success: false, error: err };
    }
    if (!password || password.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setAuthError(err);
      return { success: false, error: err };
    }

    if (!isSupabaseConfigured || !supabase) {
      const existing = loadLocalProfile();
      const localProfile: UserProfile = {
        id: 'user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, ''),
        username: sanitizeUsername(cleanEmail.split('@')[0]),
        email: cleanEmail,
        avatarUrl: existing?.avatarUrl || 'brain-blue',
        totalXp: existing?.totalXp ?? 1200,
        rankTier: calculateRank(existing?.totalXp ?? 1200),
        gamesPlayed: existing?.gamesPlayed ?? 0,
        bestPerformanceIndex: existing?.bestPerformanceIndex ?? 0,
        isGuest: false,
      };
      saveLocalProfile(localProfile);
      setUser(localProfile);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        const safeMsg = sanitizeAuthError(error.message);
        setAuthError(safeMsg);
        return { success: false, error: safeMsg };
      }
      if (data.user) {
        await loadProfileForUser(data.user.id, data.user.email);
      }
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      const safeMsg = sanitizeAuthError(raw);
      setAuthError(safeMsg);
      return { success: false, error: safeMsg };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, username: string) => {
    setAuthError(null);

    const cleanEmail = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      const err = 'Please enter a valid email address.';
      setAuthError(err);
      return { success: false, error: err };
    }
    if (!password || password.length < 6) {
      const err = 'Password must be at least 6 characters.';
      setAuthError(err);
      return { success: false, error: err };
    }

    const cleanUsername = sanitizeUsername(username || cleanEmail.split('@')[0]);

    if (!isSupabaseConfigured || !supabase) {
      const localProfile: UserProfile = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        username: cleanUsername,
        email: cleanEmail,
        avatarUrl: 'brain-blue',
        totalXp: 0,
        rankTier: 'Bronze',
        gamesPlayed: 0,
        bestPerformanceIndex: 0,
        isGuest: false,
      };
      saveLocalProfile(localProfile);
      setUser(localProfile);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            avatar_url: 'brain-blue',
          },
        },
      });

      if (error) {
        const safeMsg = sanitizeAuthError(error.message);
        setAuthError(safeMsg);
        return { success: false, error: safeMsg };
      }

      if (data.user) {
        await loadProfileForUser(data.user.id, data.user.email);
      }
      return { success: true };
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : '';
      const safeMsg = sanitizeAuthError(raw);
      setAuthError(safeMsg);
      return { success: false, error: safeMsg };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearLocalProfile();
    loginAsGuest();
  };

  // Continue as Guest
  const loginAsGuest = (customUsername = 'Guest_' + Math.floor(1000 + Math.random() * 9000)) => {
    const cleanUsername = sanitizeUsername(customUsername);
    const guestUser: UserProfile = {
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      username: cleanUsername,
      avatarUrl: 'brain-blue',
      totalXp: 0,
      rankTier: 'Bronze',
      gamesPlayed: 0,
      bestPerformanceIndex: 0,
      isGuest: true,
    };
    saveLocalProfile(guestUser);
    setUser(guestUser);
  };

  // Update Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await dbService.updateProfile(user.id, updates);
    setUser(prev => {
      const merged = prev ? { ...prev, ...updated } : updated;
      if (merged.isGuest || !isSupabaseConfigured || !supabase) {
        saveLocalProfile(merged);
      }
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSupabaseOnline,
        connectionStatusMessage,
        authError,
        signIn,
        signUp,
        signOut,
        loginAsGuest,
        updateUserProfile,
        refreshProfile,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
