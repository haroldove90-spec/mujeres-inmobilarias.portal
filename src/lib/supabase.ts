import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const supabaseUrl = rawUrl
  .trim()
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

const supabaseAnonKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '').trim();

const hasValidConfig =
  Boolean(supabaseUrl && supabaseUrl.startsWith('https://')) &&
  Boolean(supabaseAnonKey && supabaseAnonKey.length > 20);

export const isSupabaseConfigured = hasValidConfig;

export const supabase: SupabaseClient | null = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
