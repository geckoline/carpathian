import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
  : null;

export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabase) {
    throw new Error('Supabase is not configured; using mock fallback data instead.');
  }

  return supabase;
};

export const PROJECTS_CHANNEL = 'public:projects';
export const EXPERTS_CHANNEL = 'public:experts';
