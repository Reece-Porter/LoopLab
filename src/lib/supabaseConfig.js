// ─────────────────────────────────────────────────────────────────────────────
// Supabase connection settings.
//
// SETUP (one time, ~5 min):
//   1. Go to https://supabase.com → create a free account → "New project".
//   2. Once it's ready, open Project Settings → API.
//   3. Copy the "Project URL" and the "anon / public" key below.
//   4. Paste them into the two values here, commit, and push.
//
// The anon key is SAFE to expose publicly — it only allows the actions your
// Row Level Security policies permit (see supabase-schema.sql). It is NOT a
// secret like the service_role key (never put that here).
//
// You can also override these at build time with the env vars
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
// ─────────────────────────────────────────────────────────────────────────────

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// True once real values have been filled in.
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20
