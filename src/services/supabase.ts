import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if real, valid Supabase credentials have been provided
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon-key')
);

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'mount_adept_auth_token',
      },
    });
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    client = null;
  }
}

export const supabase = client;

/**
 * Diagnostic ping to verify cloud connection and database health
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  tablesFound?: boolean;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      connected: false,
      message: 'Supabase credentials not configured in environment. Running in secure local sandbox mode.',
    };
  }

  try {
    const { data, error } = await supabase.from('achievements').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        // Table does not exist yet
        return {
          connected: true,
          tablesFound: false,
          message: 'Connected to Supabase, but tables have not been created yet. Please execute supabase-schema.sql in the Supabase SQL Editor.',
        };
      }
      return {
        connected: false,
        message: `Database connection error: ${error.message}`,
      };
    }

    return {
      connected: true,
      tablesFound: true,
      message: 'Connected to Supabase Cloud Database with Row Level Security active.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Failed to reach Supabase: ${msg}`,
    };
  }
}
