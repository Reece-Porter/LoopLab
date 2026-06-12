// LoopLab audio fetch service
// ─────────────────────────────────────────────────────────────────────────────
// A tiny proxy that uses yt-dlp to pull the audio stream from a SoundCloud or
// YouTube URL and streams it back to the browser as MP3 — with CORS headers so
// the DJ Deck can load it for EQ, playback and download.
//
// IMPORTANT: only download audio you have the right to (your own uploads,
// Creative Commons, or tracks where the artist enabled downloads).

import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'

const app  = express()
const PORT = process.env.PORT || 3000

// Allow any origin by default; lock this down to your GitHub Pages domain in
// production by setting ALLOWED_ORIGIN (e.g. https://reece-porter.github.io).
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

// Streams the track as MP3.
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

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Disposition', 'attachment; filename="looplab-track.mp3"')

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
