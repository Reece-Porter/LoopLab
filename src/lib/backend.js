import { supabase } from './supabase'

// Fetch a backend (/api/*) endpoint with the signed-in user's Supabase access
// token attached. The backend enforces auth + download access server-side; this
// just carries the credential. Backward-compatible: if the server isn't gating
// yet it simply ignores the header.
export async function backendFetch(url, opts = {}) {
  let token = null
  try {
    const { data } = await supabase.auth.getSession()
    token = data?.session?.access_token || null
  } catch { /* not signed in / not configured */ }
  const headers = { ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(url, { ...opts, headers })
}

// Human-readable copy for a gated backend response. Returns null for statuses
// that aren't an access problem (so callers fall through to their own handling).
export function accessMessage(status) {
  if (status === 401) return "Sign in to use the downloader — it's invite-only while in early access."
  if (status === 403) return "You're signed in, but the downloader isn't switched on for your account yet. Request access and I'll enable it."
  if (status === 429) return 'You have hit the download rate limit — please try again in a little while.'
  if (status === 503) return 'The downloader is not configured on the server yet.'
  return null
}
