// LoopLab audio fetch service
// ─────────────────────────────────────────────────────────────────────────────
// A tiny proxy that uses yt-dlp to pull audio from a SoundCloud or YouTube URL
// and streams it back to the browser as MP3 — with CORS headers so the DJ Deck
// can load it for EQ, playback and download. Also supports enumerating a
// SoundCloud/YouTube PLAYLIST and downloading each track with embedded metadata
// + artwork, so a whole set can be zipped in the browser and dragged straight
// into Rekordbox / Serato / Traktor.
//
// IMPORTANT: only download audio you have the right to (your own uploads,
// Creative Commons, or tracks where the artist enabled downloads).

import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import { createReadStream } from 'fs'
import { unlink, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const app  = express()
const PORT = process.env.PORT || 3000

// CORS. The LoopLab site's own origins are ALWAYS allowed so a stale
// ALLOWED_ORIGIN env var can never lock the real site out. You can add more
// allowed origins via ALLOWED_ORIGIN (comma-separated); set it to "*" to allow
// everything.
const ALWAYS_ALLOWED = [
  'https://looplab.uk',
  'https://www.looplab.uk',
  'https://reece-porter.github.io',
]
const extraOrigins = (process.env.ALLOWED_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean)
const allowAll = extraOrigins.includes('*')
const allowList = new Set([...ALWAYS_ALLOWED, ...extraOrigins])

app.use(cors({
  origin(origin, cb) {
    // Non-browser requests (no Origin header) and any allowed origin pass.
    if (allowAll || !origin || allowList.has(origin)) return cb(null, true)
    // Allow any *.onrender.com / localhost during testing too.
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true)
    return cb(null, false)
  },
}))

const ALLOWED_HOSTS = /(^|\.)(soundcloud\.com|snd\.sc|youtube\.com|youtu\.be|m\.soundcloud\.com)$/i

function isAllowed(raw) {
  try {
    const u = new URL(raw)
    return ALLOWED_HOSTS.test(u.hostname)
  } catch {
    return false
  }
}

function sanitiseName(raw, fallback = 'looplab-track') {
  return (raw || fallback).toString()
    // Transliterate the common "smart" punctuation that shows up in track
    // titles into plain ASCII so it survives an HTTP header intact.
    .replace(/[‐-―−]/g, '-')   // en/em dashes, minus → hyphen
    .replace(/[‘’‛′]/g, "'") // smart single quotes → '
    .replace(/[“”″]/g, '')       // smart double quotes → drop
    .replace(/[\\/:*?"<>|\r\n]/g, '')
    // Strip anything still outside printable ASCII — HTTP header values must be
    // ASCII, and a stray Unicode char (accents, emoji, …) crashes setHeader.
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || fallback
}

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'looplab-audio', usage: '/api/fetch?url=<soundcloud|youtube url>' })
})

app.get('/health', (_req, res) => res.json({ ok: true }))

// ─────────────────────────────────────────────────────────────────────────────
// AUTH + AUTHORISATION  (every /api/* endpoint)
//
// Enforced SERVER-SIDE — gating the page in React only hides the button. A
// caller must present a valid Supabase access token (Authorization: Bearer …)
// AND have download access on their profile (can_download = true, or role =
// 'admin'). The service role key lives ONLY in Render's environment and is
// never sent to the browser.
//
// Config comes from Render env vars:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// If they are missing the gate FAILS CLOSED (503) — no config, no downloads.
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL              = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
const SUPABASE_ANON_KEY         = process.env.SUPABASE_ANON_KEY || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const authConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY)

if (!authConfigured) {
  console.warn('[looplab] SUPABASE_* env vars not set — /api/* will return 503 until configured.')
}

// Per-user fixed-window rate limit (in-memory; single Render instance).
// Generous enough for a big playlist download, tight enough to stop abuse.
const RATE_MAX_PER_HOUR = Number(process.env.RATE_MAX_PER_HOUR || 400)
const rlBuckets = new Map() // userId -> { windowStart, count }
function rateLimited(userId) {
  const now = Date.now()
  const b = rlBuckets.get(userId)
  if (!b || now - b.windowStart > 3600_000) {
    rlBuckets.set(userId, { windowStart: now, count: 1 })
    return false
  }
  b.count += 1
  return b.count > RATE_MAX_PER_HOUR
}

// Service-role headers — server-only, bypass RLS. Never sent to the client.
const svc = () => ({ apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` })

function bearer(req) {
  const h = req.get('authorization') || ''
  return h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

// Validate a Supabase access token → the user object, or null.
async function getUserFromToken(token) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!r.ok) return null
  const user = await r.json()
  return user && user.id ? user : null
}

// The caller's profile (role + can_download), read with the service role.
async function getProfile(userId) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=can_download,role`,
    { headers: svc() },
  )
  const rows = r.ok ? await r.json() : []
  return Array.isArray(rows) ? rows[0] || null : null
}

// Global kill switch. Defaults to enabled if the row/table is missing.
async function downloadsGloballyEnabled() {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?id=eq.1&select=downloads_enabled`, { headers: svc() })
    const rows = r.ok ? await r.json() : []
    return !rows[0] || rows[0].downloads_enabled !== false
  } catch {
    return true
  }
}

async function requireDownloadAccess(req, res, next) {
  if (!authConfigured) return res.status(503).json({ error: 'The downloader is not configured on the server yet.' })
  const token = bearer(req)
  if (!token) return res.status(401).json({ error: 'Sign in to use the downloader.' })
  try {
    const user = await getUserFromToken(token)
    if (!user) return res.status(401).json({ error: 'Your session has expired — sign in again.' })
    if (!(await downloadsGloballyEnabled())) return res.status(503).json({ error: 'Downloads are temporarily disabled.' })
    if (rateLimited(user.id)) {
      res.setHeader('Retry-After', '3600')
      return res.status(429).json({ error: 'Download rate limit reached — please try again later.' })
    }
    const profile = await getProfile(user.id)
    if (!profile || (profile.can_download !== true && profile.role !== 'admin')) {
      return res.status(403).json({ error: 'Download access is not enabled on your account.' })
    }
    req.userId = user.id
    next()
  } catch {
    return res.status(502).json({ error: 'Could not verify access — please try again.' })
  }
}

async function requireAdmin(req, res, next) {
  if (!authConfigured) return res.status(503).json({ error: 'Admin API is not configured on the server yet.' })
  const token = bearer(req)
  if (!token) return res.status(401).json({ error: 'Sign in.' })
  try {
    const user = await getUserFromToken(token)
    if (!user) return res.status(401).json({ error: 'Your session has expired — sign in again.' })
    const profile = await getProfile(user.id)
    if (!profile || profile.role !== 'admin') return res.status(403).json({ error: 'Admins only.' })
    req.userId = user.id
    next()
  } catch {
    return res.status(502).json({ error: 'Auth check failed.' })
  }
}

// ── Admin: list users (registered BEFORE the download gate so it isn't subject
//    to can_download). Joins auth.users (email, signup, last sign-in) with
//    profiles (role, flags) using the service role. Admin-only. ───────────────
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const aRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers: svc() })
    if (!aRes.ok) return res.status(502).json({ error: 'Could not list users.' })
    const aData = await aRes.json()
    const authUsers = Array.isArray(aData.users) ? aData.users : (Array.isArray(aData) ? aData : [])

    const pRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,display_name,role,can_download,created_at`, { headers: svc() })
    const profiles = pRes.ok ? await pRes.json() : []
    const byId = new Map((Array.isArray(profiles) ? profiles : []).map(p => [p.id, p]))

    const users = authUsers.map(u => {
      const p = byId.get(u.id) || {}
      return {
        id: u.id,
        email: u.email || '',
        display_name: p.display_name || (u.user_metadata && u.user_metadata.display_name) || '',
        role: p.role || 'user',
        can_download: p.can_download === true,
        created_at: u.created_at || p.created_at || null,
        last_sign_in_at: u.last_sign_in_at || null,
      }
    })
    users.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    res.json({ users, count: users.length })
  } catch {
    res.status(502).json({ error: 'Could not list users.' })
  }
})

// Gate everything else under /api/* (leaves "/" and "/health" open for the wake check).
app.use('/api', requireDownloadAccess)

// Returns track title/duration without downloading the whole thing.
app.get('/api/info', (req, res) => {
  const url = req.query.url
  if (!url || !isAllowed(url)) return res.status(400).json({ error: 'Provide a valid SoundCloud or YouTube url.' })

  const dl = spawn('yt-dlp', ['--no-playlist', '--dump-single-json', url])
  let out = '', err = ''
  dl.stdout.on('data', d => { out += d })
  dl.stderr.on('data', d => { err += d })
  dl.on('close', code => {
    if (code !== 0) return res.status(500).json({ error: 'yt-dlp failed', detail: err.slice(-500) })
    try {
      const j = JSON.parse(out)
      res.json({ title: j.title, uploader: j.uploader, duration: j.duration, thumbnail: j.thumbnail })
    } catch {
      res.status(500).json({ error: 'Could not parse track info' })
    }
  })
})

// ── Playlist enumeration ─────────────────────────────────────────────────────
// Returns the list of tracks in a SoundCloud set / YouTube playlist WITHOUT
// downloading any audio (fast, flat). The browser then requests each track from
// /api/track and zips them client-side.
app.get('/api/playlist', (req, res) => {
  const url = req.query.url
  if (!url || !isAllowed(url)) {
    return res.status(400).json({ error: 'Provide a valid SoundCloud or YouTube playlist url.' })
  }

  // We resolve FULL metadata for each entry (not --flat-playlist), because on
  // SoundCloud a flat listing has no real track title, no per-track artist and
  // no artwork — it just echoes the set owner. Resolving is slower but gives us
  // the real track name, artist (uploader) and thumbnail for every track.
  // --dump-json prints one JSON object per line (per track) as it resolves them.
  const dl = spawn('yt-dlp', ['--dump-json', '--ignore-errors', url])
  let out = '', err = ''
  dl.stdout.on('data', d => { out += d })
  dl.stderr.on('data', d => { err += d })
  dl.on('close', code => {
    // With --ignore-errors yt-dlp may exit non-zero even when most tracks
    // resolved, so parse whatever we got before treating it as a failure.
    const lines = out.split('\n').map(l => l.trim()).filter(Boolean)
    const entries = []
    for (const line of lines) {
      try { entries.push(JSON.parse(line)) } catch { /* skip partial line */ }
    }
    if (!entries.length) {
      if (code !== 0) return res.status(500).json({ error: 'yt-dlp failed', detail: err.slice(-500) })
      return res.status(422).json({ error: 'No tracks found. Is this a public playlist/set URL?' })
    }
    const tracks = entries
      .filter(e => e && (e.webpage_url || e.url || e.id))
      .map(e => ({
        url: e.webpage_url || e.url || e.id,
        title: e.track || e.title || 'Untitled',
        // Prefer real artist tags; fall back to the track's own uploader.
        uploader: e.artist || e.uploader || e.creator || e.channel || '',
        thumbnail: e.thumbnail || (Array.isArray(e.thumbnails) && e.thumbnails.length ? e.thumbnails[e.thumbnails.length - 1].url : null),
        duration: e.duration || null,
      }))
    res.json({
      playlistTitle: (entries[0] && (entries[0].playlist_title || entries[0].playlist)) || 'Playlist',
      count: tracks.length,
      tracks,
    })
  })
})

// ── Single track with embedded metadata + artwork ───────────────────────────
// Downloads one track to a temp file WITH id3 tags and cover art embedded (so
// Rekordbox/Serato read title, artist and artwork), then streams the file and
// deletes it. Used by the playlist batch downloader.
app.get('/api/track', async (req, res) => {
  const url = req.query.url
  if (!url || !isAllowed(url)) {
    return res.status(400).json({ error: 'Provide a valid SoundCloud or YouTube url.' })
  }

  const quality = (req.query.q === '320' ? '320K' : req.query.q === '192' ? '192K' : '320K')
  const safeName = sanitiseName(req.query.name)
  const tmpBase = join(tmpdir(), `looplab-${randomUUID()}`)

  // Embedding a thumbnail (cover art) requires writing to a real file rather
  // than stdout, so we download to a temp path then stream it back.
  //
  // SoundCloud often serves artwork as WebP, which cannot be written into an
  // MP3 cover-art (APIC) frame — so we force the thumbnail to JPEG first, else
  // the art silently fails to embed. --embed-metadata writes the ID3 title +
  // artist tags (so Rekordbox shows the real track name and artist), and
  // --parse-metadata maps the SoundCloud uploader into the artist field when
  // yt-dlp hasn't already set one.
  const args = [
    '--no-playlist',
    '-x', '--audio-format', 'mp3', '--audio-quality', quality,
    '--embed-metadata',
    '--embed-thumbnail', '--convert-thumbnails', 'jpg',
    '--parse-metadata', '%(uploader)s:%(artist)s',
    '--no-progress',
    '-o', `${tmpBase}.%(ext)s`,
    url,
  ]

  const dl = spawn('yt-dlp', args)
  let err = ''
  dl.stderr.on('data', d => { err += d.toString() })

  let killed = false
  req.on('close', () => { if (!res.writableEnded) { killed = true; try { dl.kill('SIGKILL') } catch {} } })

  dl.on('close', async code => {
    if (killed) { cleanup(tmpBase); return }
    if (code !== 0) {
      cleanup(tmpBase)
      if (!res.headersSent) res.status(500).json({ error: 'Download failed', detail: err.slice(-500) })
      return
    }
    const file = `${tmpBase}.mp3`
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.mp3"`)
    const stream = createReadStream(file)
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).json({ error: 'Could not read downloaded file' })
      cleanup(tmpBase)
    })
    stream.on('close', () => cleanup(tmpBase))
    stream.pipe(res)
  })
})

// Remove any temp files matching the base (mp3 + any leftover intermediates).
async function cleanup(base) {
  try {
    const dir = tmpdir()
    const prefix = base.split('/').pop()
    const files = await readdir(dir)
    await Promise.all(
      files.filter(f => f.startsWith(prefix)).map(f => unlink(join(dir, f)).catch(() => {}))
    )
  } catch { /* ignore */ }
}

// Streams the track as MP3 (original single-track download, no EQ). Kept for the
// existing deck-load + single download flow.
app.get('/api/fetch', (req, res) => {
  const url = req.query.url
  if (!url || !isAllowed(url)) {
    return res.status(400).json({ error: 'Provide a valid SoundCloud or YouTube url.' })
  }

  // -x extract audio, mp3 at 192k, stream to stdout (-o -).
  const args = [
    '--no-playlist',
    '-x', '--audio-format', 'mp3', '--audio-quality', '192K',
    '-o', '-',
    url,
  ]

  const safeName = sanitiseName(req.query.name)

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_looplab.mp3"`)

  const dl = spawn('yt-dlp', args)
  let err = ''
  dl.stderr.on('data', d => { err += d.toString() })

  dl.stdout.pipe(res)

  dl.on('close', code => {
    if (code !== 0 && !res.headersSent) {
      res.status(500).json({ error: 'Download failed', detail: err.slice(-500) })
    }
  })

  // If the client disconnects, kill yt-dlp so we don't leak processes.
  req.on('close', () => { try { dl.kill('SIGKILL') } catch {} })
})

app.listen(PORT, () => console.log(`LoopLab audio service listening on :${PORT}`))
