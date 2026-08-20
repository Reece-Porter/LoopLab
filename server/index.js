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

// Allow any origin by default; lock this down to your GitHub Pages / custom
// domain in production by setting ALLOWED_ORIGIN (e.g. https://looplab.uk).
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'
app.use(cors({ origin: ALLOWED_ORIGIN }))

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
    .replace(/[\\/:*?"<>|\r\n]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || fallback
}

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'looplab-audio', usage: '/api/fetch?url=<soundcloud|youtube url>' })
})

app.get('/health', (_req, res) => res.json({ ok: true }))

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

  // --flat-playlist is fast: it lists entries without resolving each track.
  const dl = spawn('yt-dlp', ['--flat-playlist', '--dump-single-json', url])
  let out = '', err = ''
  dl.stdout.on('data', d => { out += d })
  dl.stderr.on('data', d => { err += d })
  dl.on('close', code => {
    if (code !== 0) return res.status(500).json({ error: 'yt-dlp failed', detail: err.slice(-500) })
    try {
      const j = JSON.parse(out)
      const entries = Array.isArray(j.entries) ? j.entries : []
      if (!entries.length) {
        return res.status(422).json({ error: 'No tracks found. Is this a public playlist/set URL?' })
      }
      const tracks = entries
        .filter(e => e && (e.url || e.id))
        .map(e => ({
          // For flat playlists, `url` is usually the full webpage URL. Fall back
          // to webpage_url or the id if needed.
          url: e.url || e.webpage_url || e.id,
          title: e.title || 'Untitled',
          uploader: e.uploader || e.channel || j.uploader || '',
          duration: e.duration || null,
        }))
      res.json({
        playlistTitle: j.title || 'Playlist',
        uploader: j.uploader || '',
        count: tracks.length,
        tracks,
      })
    } catch {
      res.status(500).json({ error: 'Could not parse playlist' })
    }
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
