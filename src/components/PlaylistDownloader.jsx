import { useState } from 'react'
import JSZip from 'jszip'

// Sanitise a filename for the zip.
function safe(name, fallback = 'track') {
  return (name || fallback).replace(/[\\/:*?"<>|\r\n]/g, '').replace(/\s+/g, ' ').trim().slice(0, 150) || fallback
}

// Pad track numbers so they sort correctly in Rekordbox (01, 02 … 10).
function pad(n, total) {
  const width = String(total).length
  return String(n).padStart(width, '0')
}

export default function PlaylistDownloader({ backendUrl }) {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState('idle') // idle | listing | listed | downloading | done | error
  const [error, setError] = useState('')
  const [playlist, setPlaylist] = useState(null) // { playlistTitle, tracks: [] }
  const [progress, setProgress] = useState({}) // index → 'pending'|'done'|'failed'
  const [quality, setQuality] = useState('320')
  const [numbered, setNumbered] = useState(true)

  const base = (backendUrl || '').replace(/\/$/, '')
  const configured = !!base

  async function fetchPlaylist() {
    if (!url.trim()) return
    setError(''); setPhase('listing'); setPlaylist(null); setProgress({})
    try {
      const res = await fetch(`${base}/api/playlist?url=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load playlist')
      if (!data.tracks?.length) throw new Error('No tracks found in that playlist.')
      setPlaylist(data)
      setPhase('listed')
    } catch (err) {
      setError(err.message || 'Failed to load playlist')
      setPhase('error')
    }
  }

  async function downloadAll() {
    if (!playlist) return
    setPhase('downloading')
    setError('')
    const zip = new JSZip()
    const folder = zip.folder(safe(playlist.playlistTitle, 'playlist'))
    const total = playlist.tracks.length
    const prog = {}
    playlist.tracks.forEach((_, i) => { prog[i] = 'pending' })
    setProgress({ ...prog })

    // Sequential download — keeps the Render free tier from being hammered and
    // gives clear per-track progress. yt-dlp transcodes each track server-side.
    let anySuccess = false
    for (let i = 0; i < total; i++) {
      const t = playlist.tracks[i]
      const label = numbered
        ? `${pad(i + 1, total)} - ${safe(t.uploader ? `${t.uploader} - ${t.title}` : t.title)}`
        : safe(t.uploader ? `${t.uploader} - ${t.title}` : t.title)
      try {
        const res = await fetch(`${base}/api/track?url=${encodeURIComponent(t.url)}&q=${quality}&name=${encodeURIComponent(label)}`)
        if (!res.ok) throw new Error('track failed')
        const blob = await res.blob()
        folder.file(`${label}.mp3`, blob)
        prog[i] = 'done'; anySuccess = true
      } catch {
        prog[i] = 'failed'
      }
      setProgress({ ...prog })
    }

    if (!anySuccess) {
      setError('Every track failed to download. The backend may have timed out — try a smaller playlist.')
      setPhase('listed')
      return
    }

    const out = await folder.generateAsync({ type: 'blob' }, () => {})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(out)
    a.download = `${safe(playlist.playlistTitle, 'playlist')}.zip`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    setPhase('done')
  }

  const doneCount = Object.values(progress).filter(v => v === 'done').length
  const failCount = Object.values(progress).filter(v => v === 'failed').length

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🗂️</span>
        <h2 className="text-sm font-semibold text-cyan-300 uppercase tracking-widest">Playlist Downloader</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Paste a SoundCloud set or YouTube playlist link — download the whole thing as a ZIP of tagged MP3s,
        ready to drag straight into Rekordbox.
      </p>

      {!configured ? (
        <div className="rounded-xl bg-amber-900/20 border border-amber-500/25 p-3 text-xs text-amber-200 leading-relaxed">
          This needs the downloader backend. Open <strong className="text-white">⚙ Backend</strong> above, paste your
          backend URL and hit <strong className="text-white">Save &amp; Wake</strong>, then come back here.
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchPlaylist()}
              placeholder="https://soundcloud.com/user/sets/…"
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              onClick={fetchPlaylist}
              disabled={phase === 'listing' || phase === 'downloading'}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 rounded-xl text-sm font-semibold transition whitespace-nowrap"
            >
              {phase === 'listing' ? 'Loading…' : 'Load list'}
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Quality</span>
              {['320', '192'].map(q => (
                <button key={q} onClick={() => setQuality(q)}
                  className={`px-2.5 py-1 rounded-lg border transition ${quality === q ? 'border-cyan-500/60 bg-cyan-500/15 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                >{q}k</button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-gray-400">
              <input type="checkbox" checked={numbered} onChange={e => setNumbered(e.target.checked)} className="accent-cyan-500" />
              Number tracks (keeps set order)
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-red-900/20 border border-red-500/20 p-3 text-xs text-red-300 leading-relaxed mb-3">{error}</div>
          )}

          {/* Track list */}
          {playlist && (
            <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden mb-3">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
                <span className="text-sm font-semibold text-white truncate">{playlist.playlistTitle}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-3">{playlist.tracks.length} tracks</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {playlist.tracks.map((t, i) => {
                  const st = progress[i]
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2 text-xs">
                      <span className="text-gray-600 w-6 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 truncate">{t.title}</p>
                        {t.uploader && <p className="text-gray-600 truncate">{t.uploader}</p>}
                      </div>
                      {st === 'done' && <span className="text-emerald-400">✓</span>}
                      {st === 'failed' && <span className="text-red-400">✗</span>}
                      {st === 'pending' && phase === 'downloading' && <span className="text-cyan-400 animate-pulse">…</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Download button + progress */}
          {playlist && (
            <div className="flex items-center gap-3">
              <button
                onClick={downloadAll}
                disabled={phase === 'downloading'}
                className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition"
              >
                {phase === 'downloading'
                  ? `Downloading ${doneCount + failCount}/${playlist.tracks.length}…`
                  : phase === 'done'
                    ? '✓ Done — download again'
                    : `Download all as ZIP (${playlist.tracks.length} tracks)`}
              </button>
            </div>
          )}

          {phase === 'downloading' && (
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              Each track is fetched and transcoded on the server, so a big set can take a few minutes.
              Keep this tab open — the ZIP downloads automatically when it's finished.
            </p>
          )}
          {phase === 'done' && failCount > 0 && (
            <p className="text-xs text-amber-400 mt-3">{doneCount} downloaded, {failCount} failed (skipped in the ZIP).</p>
          )}

          <p className="text-[11px] text-gray-600 mt-4 leading-relaxed">
            Only download audio you have the right to — your own uploads, Creative Commons, or tracks where the artist enabled downloads.
          </p>
        </>
      )}
    </div>
  )
}
