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
  const [showUnzipTip, setShowUnzipTip] = useState(false)

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
    // Each track is retried a couple of times (transient timeouts / rate-limits
    // are common on the free tier), with a short pause between requests.
    let anySuccess = false
    let firstError = ''
    const sleep = ms => new Promise(r => setTimeout(r, ms))

    for (let i = 0; i < total; i++) {
      const t = playlist.tracks[i]
      const label = numbered
        ? `${pad(i + 1, total)} - ${safe(t.uploader ? `${t.uploader} - ${t.title}` : t.title)}`
        : safe(t.uploader ? `${t.uploader} - ${t.title}` : t.title)

      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        if (attempt > 0) await sleep(2000) // back off before a retry
        try {
          const res = await fetch(
            `${base}/api/track?url=${encodeURIComponent(t.url)}&q=${quality}&name=${encodeURIComponent(label)}`,
            { signal: AbortSignal.timeout(180000) }, // up to 3 min per track
          )
          if (!res.ok) {
            // Capture the server's reason so we can show why it failed.
            let detail = `HTTP ${res.status}`
            try { const j = await res.json(); detail = j.detail || j.error || detail } catch { /* not json */ }
            if (!firstError) firstError = detail
            throw new Error(detail)
          }
          const blob = await res.blob()
          if (blob.size < 1024) throw new Error('empty file') // guard against error pages
          folder.file(`${label}.mp3`, blob)
          ok = true; anySuccess = true
        } catch (e) {
          if (!firstError) firstError = e.message || 'request failed'
        }
      }
      prog[i] = ok ? 'done' : 'failed'
      setProgress({ ...prog })
      await sleep(600) // pace requests so SoundCloud doesn't rate-limit the IP
    }

    if (!anySuccess) {
      setError(`Every track failed to download. First error from the server: "${firstError || 'unknown'}". ` +
               `This is usually the free Render tier running out of CPU/memory, or SoundCloud rate-limiting the server. ` +
               `Try a smaller set, or upgrade the Render instance.`)
      setPhase('listed')
      return
    }
    if (firstError) setError(`Some tracks failed. First error: "${firstError}".`)

    const out = await folder.generateAsync({ type: 'blob' }, () => {})
    const a = document.createElement('a')
    a.href = URL.createObjectURL(out)
    a.download = `${safe(playlist.playlistTitle, 'playlist')}.zip`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    setPhase('done')

    // First-time reminder: the ZIP must be unzipped before Rekordbox can read it.
    try {
      if (!localStorage.getItem('looplab-unzip-tip-seen')) {
        setShowUnzipTip(true)
        localStorage.setItem('looplab-unzip-tip-seen', '1')
      }
    } catch { setShowUnzipTip(true) }
  }

  const doneCount = Object.values(progress).filter(v => v === 'done').length
  const failCount = Object.values(progress).filter(v => v === 'failed').length

  return (
    <div className="border border-hairline bg-surface p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🗂️</span>
        <h2 className="text-sm font-semibold text-acid uppercase tracking-widest">Playlist Downloader</h2>
      </div>
      <p className="text-xs text-dim mb-4">
        Paste a SoundCloud set or YouTube playlist link — download the whole thing as a ZIP of tagged MP3s,
        ready to drag straight into Rekordbox.
      </p>

      {/* How to use */}
      <div className=" border border-hairline bg-surface-2 p-3.5 mb-4">
        <p className="text-[11px] font-semibold text-dim uppercase tracking-wide mb-2">How to use</p>
        <ol className="space-y-1.5 text-xs text-dim leading-relaxed">
          <li className="flex gap-2">
            <span className="text-acid font-bold shrink-0">1.</span>
            <span>Paste your SoundCloud set / YouTube playlist link and hit <strong className="text-ink">Load list</strong>.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-acid font-bold shrink-0">2.</span>
            <span>Hit <strong className="text-ink">Download all as ZIP</strong> — every track downloads with its name and artwork baked in.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-acid font-bold shrink-0">3.</span>
            <span>
              <strong className="text-acid">Unzip the file first</strong> (right-click → Extract All on Windows, or double-click on Mac),
              then drag the unzipped folder into Rekordbox. Rekordbox can't read tracks while they're still inside the ZIP.
            </span>
          </li>
        </ol>
      </div>

      {!configured ? (
        <div className=" bg-surface-2 border border-hairline p-3 text-xs text-dim leading-relaxed">
          This needs the downloader backend. Open <strong className="text-ink">⚙ Backend</strong> above, paste your
          backend URL and hit <strong className="text-ink">Save &amp; Wake</strong>, then come back here.
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
              className="flex-1 bg-surface-2 border border-hairline  px-4 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition"
            />
            <button
              onClick={fetchPlaylist}
              disabled={phase === 'listing' || phase === 'downloading'}
              className="px-4 py-2.5 bg-acid hover:bg-acid-dim disabled:opacity-40  text-sm font-semibold transition whitespace-nowrap"
            >
              {phase === 'listing' ? 'Loading…' : 'Load list'}
            </button>
          </div>

          {/* Options */}
          <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-dim">Quality</span>
              {['320', '192'].map(q => (
                <button key={q} onClick={() => setQuality(q)}
                  className={`px-2.5 py-1  border transition ${quality === q ? 'border-acid bg-acid/10 text-acid' : 'border-hairline text-dim hover:text-ink'}`}
                >{q}k</button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-dim">
              <input type="checkbox" checked={numbered} onChange={e => setNumbered(e.target.checked)} className="accent-acid" />
              Number tracks (keeps set order)
            </label>
          </div>

          {phase === 'listing' && (
            <p className="text-xs text-acid/80 animate-pulse mb-3">
              Reading the playlist and fetching each track's name + artwork… big sets can take up to a minute.
            </p>
          )}

          {error && (
            <div className=" bg-surface-2 border border-red-500/40 p-3 text-xs text-red-300 leading-relaxed mb-3">{error}</div>
          )}

          {/* Track list */}
          {playlist && (
            <div className=" border border-hairline bg-surface-2 overflow-hidden mb-3">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline">
                <span className="text-sm font-semibold text-ink truncate">{playlist.playlistTitle}</span>
                <span className="text-xs text-dim whitespace-nowrap ml-3">{playlist.tracks.length} tracks</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {playlist.tracks.map((t, i) => {
                  const st = progress[i]
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2 text-xs">
                      <span className="text-faint w-5 text-right shrink-0">{i + 1}</span>
                      {t.thumbnail ? (
                        <img src={t.thumbnail} alt="" loading="lazy" className="w-9 h-9 rounded object-cover shrink-0 bg-white/5" />
                      ) : (
                        <div className="w-9 h-9 rounded shrink-0 bg-white/5 flex items-center justify-center text-faint">♪</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-ink truncate">{t.title}</p>
                        {t.uploader && <p className="text-faint truncate">{t.uploader}</p>}
                      </div>
                      {st === 'done' && <span className="text-emerald-400 shrink-0">✓</span>}
                      {st === 'failed' && <span className="text-red-400 shrink-0">✗</span>}
                      {st === 'pending' && phase === 'downloading' && <span className="text-acid animate-pulse shrink-0">…</span>}
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
                className="flex-1 px-4 py-3 bg-acid hover:bg-acid-dim disabled:opacity-50  text-sm font-semibold transition"
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
            <p className="text-xs text-dim mt-3 leading-relaxed">
              Each track is fetched and transcoded on the server, so a big set can take a few minutes.
              Keep this tab open — the ZIP downloads automatically when it's finished.
            </p>
          )}
          {phase === 'done' && failCount > 0 && (
            <p className="text-xs text-acid mt-3">{doneCount} downloaded, {failCount} failed (skipped in the ZIP).</p>
          )}

          <p className="text-[11px] text-faint mt-4 leading-relaxed">
            Only download audio you have the right to — your own uploads, Creative Commons, or tracks where the artist enabled downloads.
          </p>
        </>
      )}

      {/* First-download reminder popup */}
      {showUnzipTip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShowUnzipTip(false)}
        >
          <div
            className="w-full max-w-sm bg-surface border border-hairline  p-6 shadow-2xl text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🗂️</div>
            <h3 className="text-ink font-semibold text-base mb-2">Unzip before Rekordbox</h3>
            <p className="text-sm text-dim leading-relaxed mb-1">
              Your set downloaded as a <strong className="text-ink">.zip</strong> file. Rekordbox can't read tracks
              while they're inside the ZIP.
            </p>
            <div className="text-left text-sm text-dim bg-surface-2 border border-hairline  p-3.5 my-4 space-y-2">
              <p><span className="text-acid font-bold">1.</span> Unzip it — <span className="text-dim">right-click → Extract All (Windows) or double-click (Mac)</span></p>
              <p><span className="text-acid font-bold">2.</span> Drag the unzipped folder into Rekordbox</p>
            </div>
            <p className="text-xs text-dim mb-4">Names and artwork are already baked into each track.</p>
            <button
              onClick={() => setShowUnzipTip(false)}
              className="w-full py-2.5 bg-acid hover:bg-acid-dim text-base  text-sm font-semibold transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
