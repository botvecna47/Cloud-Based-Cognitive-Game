import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '../services/supabase';
import { UserProfile } from '../types';
import { dbService, calculateRank, sanitizeUsername, sanitizeAvatar } from '../services/dbService';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [connectionStatusMessage, setConnectionStatusMessage] = useState<string>('Initializing...');
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize and check Supabase auth state
  const loadProfileForUser = useCallback(async (supabaseUserId: string, email?: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUserId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          username: sanitizeUsername(data.username),
          email: data.email || email,
          avatarUrl: sanitizeAvatar(data.avatar_url),
          totalXp: data.total_xp || 0,
          rankTier: data.rank_tier || calculateRank(data.total_xp || 0),
          gamesPlayed: data.games_played || 0,
          bestPerformanceIndex: data.best_performance_index || 0,
          isGuest: false,
          createdAt: data.created_at,
        });
      } else {
        // Fallback: profile row not created by trigger yet, create manually
        const derivedName = email ? email.split('@')[0] : 'Player_' + supabaseUserId.slice(0, 5);
        const cleanName = sanitizeUsername(derivedName);
        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUserId,
            username: cleanName,
            email: email,
            avatar_url: 'brain-blue',
          })
          .select()
          .single();

        if (!insertErr && newProfile) {
          setUser({
            id: newProfile.id,
            username: sanitizeUsername(newProfile.username),
            email: newProfile.email,
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

  const refreshProfile = useCallback(async () => {
    if (user && !user.isGuest && supabase) {
      await loadProfileForUser(user.id, user.email);
    }
  }, [user, loadProfileForUser]);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      setIsLoading(true);

      // 1. Test Supabase connectivity
      const status = await testSupabaseConnection();
      if (!isMounted) return;

      setIsSupabaseOnline(status.connected);
      setConnectionStatusMessage(status.message);

      if (isSupabaseConfigured && supabase) {
        // Get active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadProfileForUser(session.user.id, session.user.email);
        } else {
          // Check for saved guest or default demo session
          const savedGuest = localStorage.getItem('mount_adept_guest_profile');
          if (savedGuest) {
            try {
              setUser(JSON.parse(savedGuest));
            } catch {
              setUser(null);
            }
          }
        }

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await loadProfileForUser(session.user.id, session.user.email);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        });

        setIsLoading(false);
        return () => {
          authListener.subscription.unsubscribe();
        };
      } else {
        // Local Sandbox Mode: Load or create local guest profile
        const savedGuest = localStorage.getItem('mount_adept_guest_profile');
        if (savedGuest) {
          try {
            setUser(JSON.parse(savedGuest));
          } catch {
            createDefaultGuest();
          }
        } else {
          createDefaultGuest();
        }
        setIsLoading(false);
      }
    }

    function createDefaultGuest() {
      const guestUser: UserProfile = {
        id: 'guest-' + Math.random().toString(36).substring(2, 9),
        username: 'AptitudeCadet',
        avatarUrl: 'brain-blue',
        totalXp: 350,
        rankTier: 'Bronze',
        gamesPlayed: 2,
        bestPerformanceIndex: 65,
        isGuest: true,
      };
      localStorage.setItem('mount_adept_guest_profile', JSON.stringify(guestUser));
      setUser(guestUser);
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [loadProfileForUser]);

  // Sign In
  const signIn = async (email: string, password: string) => {
    setAuthError(null);

    // Input Validation
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
      // Local sandbox simulation
      const localProfile: UserProfile = {
        id: 'user-' + cleanEmail.replace(/[^a-zA-Z0-9]/g, ''),
        username: sanitizeUsername(cleanEmail.split('@')[0]),
        email: cleanEmail,
        avatarUrl: 'brain-cyan',
        totalXp: 1200,
        rankTier: 'Silver',
        gamesPlayed: 5,
        bestPerformanceIndex: 78,
        isGuest: false,
      };
      setUser(localProfile);
      localStorage.setItem('mount_adept_guest_profile', JSON.stringify(localProfile));
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
    } catch (err: any) {
      const safeMsg = sanitizeAuthError(err?.message);
      setAuthError(safeMsg);
      return { success: false, error: safeMsg };
    }
  };

  // Sign Up
  const signUp = async (email: string, password: string, username: string) => {
    setAuthError(null);

    // Input Validation
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
        avatarUrl: 'brain-cyan',
        totalXp: 0,
        rankTier: 'Bronze',
        gamesPlayed: 0,
        bestPerformanceIndex: 0,
        isGuest: false,
      };
      setUser(localProfile);
      localStorage.setItem('mount_adept_guest_profile', JSON.stringify(localProfile));
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
    } catch (err: any) {
      const safeMsg = sanitizeAuthError(err?.message);
      setAuthError(safeMsg);
      return { success: false, error: safeMsg };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('mount_adept_guest_profile');
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
    localStorage.setItem('mount_adept_guest_profile', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  // Update Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await dbService.updateProfile(user.id, updates);
    setUser(prev => (prev ? { ...prev, ...updated } : updated));
    if (user.isGuest) {
      localStorage.setItem('mount_adept_guest_profile', JSON.stringify({ ...user, ...updated }));
    }
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
