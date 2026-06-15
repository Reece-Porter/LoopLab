import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './supabaseConfig'

// A single shared Supabase client for the whole app. When the project hasn't
// been configured yet, `supabase` is null and the UI shows a friendly
// "backend not set up" state instead of crashing.
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export { isSupabaseConfigured }
