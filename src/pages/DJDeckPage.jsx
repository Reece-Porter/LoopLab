import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PlaylistDownloader from '../components/PlaylistDownloader'
import { backendFetch, accessMessage } from '../lib/backend'
import { useAuth } from '../context/AuthContext'
import { makeTrackName } from '../audio/djHelpers'

// ─── Web Audio chain: source → low → mid → high → gain → destination ─────────
function buildEQChain(ctx) {
  const low  = ctx.createBiquadFilter(); low.type  = 'lowshelf';  low.frequency.value  = 200;  low.gain.value  = 0
  const mid  = ctx.createBiquadFilter(); mid.type  = 'peaking';   mid.frequency.value  = 1000; mid.Q.value     = 0.8; mid.gain.value = 0
  const high = ctx.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 4000; high.gain.value = 0
  const vol  = ctx.createGain();         vol.gain.value = 1
  low.connect(mid); mid.connect(high); high.connect(vol); vol.connect(ctx.destination)
  return { low, mid, high, vol, input: low }
}

// ─── Encode an AudioBuffer to a 16-bit PCM WAV blob ──────────────────────────
function audioBufferToWav(buffer) {
  const numCh   = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numFrames  = buffer.length
  const bytesPerSample = 2
  const blockAlign = numCh * bytesPerSample
  const dataSize   = numFrames * blockAlign
  const ab  = new ArrayBuffer(44 + dataSize)
  const dv  = new DataView(ab)

  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)) }

  writeStr(0, 'RIFF')
  dv.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  dv.setUint32(16, 16, true)            // fmt chunk size
  dv.setUint16(20, 1, true)             // PCM
  dv.setUint16(22, numCh, true)
  dv.setUint32(24, sampleRate, true)
  dv.setUint32(28, sampleRate * blockAlign, true)
  dv.setUint16(32, blockAlign, true)
  dv.setUint16(34, 16, true)            // bits per sample
  writeStr(36, 'data')
  dv.setUint32(40, dataSize, true)

  // Interleave channels
  const channels = []
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c))
  let offset = 44
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, channels[c][i]))
      dv.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }
  return new Blob([ab], { type: 'audio/wav' })
}

// ─── Render the source buffer through the EQ settings, offline ───────────────
async function renderWithEQ(buffer, { low, mid, high, vol }) {
  const off = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

  const lo  = off.createBiquadFilter(); lo.type  = 'lowshelf';  lo.frequency.value  = 200;  lo.gain.value  = low
  const md  = off.createBiquadFilter(); md.type  = 'peaking';   md.frequency.value  = 1000; md.Q.value     = 0.8; md.gain.value = mid
  const hi  = off.createBiquadFilter(); hi.type  = 'highshelf'; hi.frequency.value  = 4000; hi.gain.value  = high
  const gn  = off.createGain();         gn.gain.value = vol

  const src = off.createBufferSource()
  src.buffer = buffer
  src.connect(lo); lo.connect(md); md.connect(hi); hi.connect(gn); gn.connect(off.destination)
  src.start(0)

  return off.startRendering()
}

// ─── Waveform drawer ─────────────────────────────────────────────────────────
function drawWaveform(canvas, audioBuffer, playhead = 0) {
  if (!canvas || !audioBuffer) return
  const ctx  = canvas.getContext('2d')
  const W    = canvas.width
  const H    = canvas.height
  const data = audioBuffer.getChannelData(0)
  const step = Math.floor(data.length / W)

  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = '#0a0a0b'
  ctx.fillRect(0, 0, W, H)

  // Waveform bars
  for (let x = 0; x < W; x++) {
    let max = 0
    for (let s = 0; s < step; s++) {
      const v = Math.abs(data[x * step + s] || 0)
      if (v > max) max = v
    }
    const h = Math.max(1, max * H * 0.9)
    const progress = x / W
    const r = progress < playhead ? 198 : 110
    const g = progress < playhead ? 242 : 130
    const b = progress < playhead ? 78 : 70
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, (H - h) / 2, 1, h)
  }

  // Playhead line
  const px = Math.floor(playhead * W)
  ctx.fillStyle = '#fff'
  ctx.fillRect(px, 0, 2, H)
}

// ─── Knob component ──────────────────────────────────────────────────────────
function Knob({ label, value, onChange, min = -12, max = 12, color = '#c6f24e' }) {
  const svgRef     = useRef()
  const dragging   = useRef(false)
  const startY     = useRef(0)
  const startVal   = useRef(value)

  const norm    = (value - min) / (max - min)             // 0..1
  const angle   = -135 + norm * 270                       // -135° to +135°
  const rad     = (angle * Math.PI) / 180
  const cx      = 36; const cy = 36; const r = 26
  const x       = cx + r * Math.sin(rad)
  const y       = cy - r * Math.cos(rad)

  const onMouseDown = e => {
    dragging.current = true
    startY.current   = e.clientY
    startVal.current = value
    e.preventDefault()
  }
  useEffect(() => {
    const onMove = e => {
      if (!dragging.current) return
      const delta = (startY.current - e.clientY) / 150 * (max - min)
      onChange(Math.max(min, Math.min(max, startVal.current + delta)))
    }
    const onUp = () => { dragging.current = false }
    const onTouchMove = e => {
      if (!dragging.current) return
      const delta = (startY.current - e.touches[0].clientY) / 150 * (max - min)
      onChange(Math.max(min, Math.min(max, startVal.current + delta)))
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',  onUp)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend',  onUp)
    }
  }, [min, max, onChange])

  const onDblClick = () => onChange(0)

  return (
    <div className="flex flex-col items-center gap-1 select-none" onDoubleClick={onDblClick}>
      <svg ref={svgRef} width="72" height="72" onMouseDown={onMouseDown} onTouchStart={e => { dragging.current=true; startY.current=e.touches[0].clientY; startVal.current=value; e.preventDefault() }} style={{ cursor: 'ns-resize' }}>
        {/* Track arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1f2937" strokeWidth="6" strokeDasharray="3.14159" />
        {/* Knob body */}
        <circle cx={cx} cy={cy} r="20" fill="#111827" stroke="#374151" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="20" fill="none" stroke={color} strokeWidth="2" opacity="0.3" />
        {/* Indicator */}
        <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth="3" strokeLinecap="round" />
        {/* Zero dot */}
        <circle cx={cx} cy={cy + r} r="2" fill={Math.abs(value) < 0.5 ? color : '#374151'} />
      </svg>
      <span className="text-xs font-mono text-dim">{value > 0 ? '+' : ''}{value.toFixed(1)} dB</span>
      <span className="text-xs text-dim uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ─── Access gate shown when a visitor can't use the downloader ─────────────────
function DownloaderGate({ mode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      <div className="w-full max-w-3xl mx-auto px-4 py-8 w-full">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-faint hover:text-acid transition-colors duration-150 font-mono text-[11px] uppercase tracking-[0.14em]">← Back</button>
      </div>
      <div className="flex-1 flex items-center justify-center px-5 pb-24">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight mb-3">Player &amp; Downloader</h1>
          {mode === 'loading' && (
            <p className="text-dim text-sm font-mono uppercase tracking-widest animate-pulse">Checking access…</p>
          )}
          {mode === 'signin' && (
            <>
              <p className="text-dim text-sm leading-relaxed mb-6">Sign in to use the Player &amp; Downloader — it's invite-only while in early access.</p>
              <button onClick={() => navigate('/login')} className="font-display font-semibold uppercase tracking-wide text-sm bg-acid text-base px-6 py-3 hover:bg-acid-dim transition-colors duration-150">Sign in</button>
            </>
          )}
          {mode === 'denied' && (
            <>
              <p className="text-dim text-sm leading-relaxed mb-2">You're signed in, but the downloader isn't switched on for your account yet.</p>
              <p className="text-faint text-[13px] leading-relaxed mb-6">It's limited while the service is in early access. Request access and I'll enable it for you.</p>
              <a href="mailto:reece_tp02@outlook.com?subject=LoopLab%20downloader%20access" className="font-display font-semibold uppercase tracking-wide text-sm border border-acid/50 text-acid px-6 py-3 hover:bg-acid hover:text-base transition-colors duration-150 inline-block">Request access</a>
              <p className="text-faint text-[11px] mt-6">Playing and building arrangements stays free for everyone.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DJDeckPage() {
  const navigate    = useNavigate()
  const { user, canDownload, profileLoading, configured: authConfigured } = useAuth()
  const [url, setUrl]             = useState('')
  const [status, setStatus]       = useState('idle') // idle | loading | ready | error
  const [errorMsg, setErrorMsg]   = useState('')
  const [playing, setPlaying]     = useState(false)
  const [progress, setProgress]   = useState(0)   // 0..1
  const [duration, setDuration]   = useState(0)
  const [currentTime, setCurrent] = useState(0)
  const [lowGain,  setLowGain]    = useState(0)
  const [midGain,  setMidGain]    = useState(0)
  const [highGain, setHighGain]   = useState(0)
  const [volume,   setVolume]     = useState(0.8)
  const [trackName, setTrackName] = useState('mix')
  const [exporting, setExporting] = useState(false)
  const [scUrl, setScUrl]         = useState('') // SoundCloud track URL (embed mode)
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem('looplab-backend') || '')
  const [showBackend, setShowBackend] = useState(false)
  const [backendStatus, setBackendStatus] = useState('unknown') // unknown | waking | ok | error
  const [wakeElapsed, setWakeElapsed] = useState(0) // seconds spent waking
  const [copied, setCopied]         = useState(false)
  const [streamUrl, setStreamUrl] = useState('') // SC/YT url loaded via backend
  const [dlBusy, setDlBusy]       = useState(false) // original-MP3 download in flight
  const [dlMsg, setDlMsg]         = useState('')    // original-MP3 download error/gated copy

  // Download the original MP3 through the (authenticated) backend. An anchor
  // can't carry the Supabase bearer, so we fetch → blob → save instead.
  async function downloadOriginal() {
    if (!streamUrl || !backendUrl) return
    setDlBusy(true); setDlMsg('')
    try {
      const res = await backendFetch(
        `${backendUrl.replace(/\/$/, '')}/api/fetch?url=${encodeURIComponent(streamUrl)}&name=${encodeURIComponent(trackName)}`
      )
      if (!res.ok) {
        setDlMsg(accessMessage(res.status) || `Download failed (HTTP ${res.status}).`)
        return
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${trackName || 'track'}_looplab.mp3`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    } catch {
      setDlMsg('Download failed — please try again.')
    } finally {
      setDlBusy(false)
    }
  }
  const wakeIntervalRef = useRef(null)
  const wakePollRef     = useRef(null)

  const audioCtxRef  = useRef(null)
  const eqRef        = useRef(null)
  const sourceRef    = useRef(null)
  const bufferRef    = useRef(null)
  const startTimeRef = useRef(0)   // ctx.currentTime when last play() called
  const offsetRef    = useRef(0)   // buffered seek offset
  const rafRef       = useRef(null)
  const canvasRef    = useRef(null)
  const fileInputRef = useRef(null)

  // ── Init audio context lazily ──────────────────────────────────────────────
  function getCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      eqRef.current = buildEQChain(audioCtxRef.current)
    }
    return audioCtxRef.current
  }

  // ── Sync EQ knobs → filter nodes ──────────────────────────────────────────
  useEffect(() => { if (eqRef.current) eqRef.current.low.gain.value  = lowGain  }, [lowGain])
  useEffect(() => { if (eqRef.current) eqRef.current.mid.gain.value  = midGain  }, [midGain])
  useEffect(() => { if (eqRef.current) eqRef.current.high.gain.value = highGain }, [highGain])
  useEffect(() => { if (eqRef.current) eqRef.current.vol.gain.value  = volume   }, [volume])

  // ── Draw waveform whenever buffer or progress changes ─────────────────────
  useEffect(() => {
    if (canvasRef.current) drawWaveform(canvasRef.current, bufferRef.current, progress)
  }, [progress, status])

  // ── RAF progress tracker ──────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (!audioCtxRef.current || !bufferRef.current) return
    const elapsed = audioCtxRef.current.currentTime - startTimeRef.current
    const t = Math.min(offsetRef.current + elapsed, bufferRef.current.duration)
    setCurrent(t)
    setProgress(t / bufferRef.current.duration)
    if (t < bufferRef.current.duration) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      setPlaying(false)
      offsetRef.current = 0
      setCurrent(0)
      setProgress(0)
    }
  }, [])

  // ── Stop + cleanup source ─────────────────────────────────────────────────
  function stopSource() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch (_) {}
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
  }

  // ── Play from offset ──────────────────────────────────────────────────────
  function playFrom(offset) {
    stopSource()
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = bufferRef.current
    src.connect(eqRef.current.input)
    src.start(0, offset)
    sourceRef.current  = src
    startTimeRef.current = ctx.currentTime
    offsetRef.current  = offset
    setPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }

  // ── Toggle play/pause ─────────────────────────────────────────────────────
  function togglePlay() {
    if (!bufferRef.current) return
    if (playing) {
      stopSource()
      offsetRef.current = currentTime
      setPlaying(false)
    } else {
      playFrom(offsetRef.current)
    }
  }

  // ── Download the track rendered through the current EQ settings ───────────
  async function downloadMix() {
    if (!bufferRef.current || exporting) return
    setExporting(true)
    try {
      const rendered = await renderWithEQ(bufferRef.current, {
        low: lowGain, mid: midGain, high: highGain, vol: volume,
      })
      const blob = audioBufferToWav(rendered)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${trackName || 'track'}_looplab.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(`Could not export audio: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  // ── Seek on waveform click ────────────────────────────────────────────────
  function onWaveformClick(e) {
    if (!bufferRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const newOffset = ratio * bufferRef.current.duration
    offsetRef.current = newOffset
    setCurrent(newOffset)
    setProgress(ratio)
    if (playing) playFrom(newOffset)
  }

  // ── Load audio buffer from ArrayBuffer ───────────────────────────────────
  async function decodeAndLoad(arrayBuffer) {
    const ctx = getCtx()
    try {
      const buffer = await ctx.decodeAudioData(arrayBuffer)
      bufferRef.current = buffer
      offsetRef.current = 0
      setDuration(buffer.duration)
      setStatus('ready')
      setProgress(0)
      setCurrent(0)
      setTimeout(() => drawWaveform(canvasRef.current, buffer, 0), 50)
    } catch (err) {
      setStatus('error')
      setErrorMsg('Could not decode audio. Make sure the file is a valid MP3, WAV, OGG, or FLAC.')
    }
  }

  // ── Load from file upload ─────────────────────────────────────────────────
  async function loadFile(file) {
    stopSource()
    setScUrl('')
    setStreamUrl('')
    setPlaying(false)
    setStatus('loading')
    setErrorMsg('')
    setTrackName((file.name || 'mix').replace(/\.[^.]+$/, ''))
    const ab = await file.arrayBuffer()
    await decodeAndLoad(ab)
  }

  // ── Load from direct audio URL (CORS-permitting) ──────────────────────────
  async function loadUrl() {
    const raw = url.trim()
    if (!raw) return

    stopSource()
    setPlaying(false)
    setErrorMsg('')

    const isStreaming = /soundcloud\.com|snd\.sc|youtube\.com|youtu\.be/.test(raw)
    const backend = backendUrl.replace(/\/$/, '')

    // SoundCloud / YouTube with a backend configured → fetch real audio through
    // it so EQ + download work. Without a backend, fall back to the SC embed.
    if (isStreaming && backend) {
      setScUrl('')
      setStatus('loading')
      try {
        // Grab the track's real name/artist in parallel with the audio.
        const infoPromise = backendFetch(`${backend}/api/info?url=${encodeURIComponent(raw)}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)

        const res = await backendFetch(`${backend}/api/fetch?url=${encodeURIComponent(raw)}`)
        if (!res.ok) {
          const gated = accessMessage(res.status)
          if (gated) { setStatus('error'); setErrorMsg(gated); return }
          const msg = await res.json().catch(() => ({}))
          throw new Error(msg.error || `HTTP ${res.status}`)
        }
        const ab = await res.arrayBuffer()

        const info = await infoPromise
        setTrackName(makeTrackName(info))
        setStreamUrl(raw)
        await decodeAndLoad(ab)
      } catch (err) {
        setStatus('error')
        setErrorMsg(
          `Backend fetch failed: ${err.message}. ` +
          `If the backend is on Render's free tier it may be waking up — wait ~40s and try again. ` +
          `Also check the backend URL in ⚙ Backend settings.`
        )
      }
      return
    }

    // SoundCloud, no backend → embed the official widget player (playback only).
    if (/soundcloud\.com|snd\.sc/.test(raw)) {
      bufferRef.current = null
      setScUrl(raw)
      setStatus('soundcloud')
      return
    }

    setScUrl('')
    setStatus('loading')

    // YouTube, no backend → can't be done client-side.
    if (/youtube\.com|youtu\.be/.test(raw)) {
      setStatus('error')
      setErrorMsg(
        'YouTube links need the backend service to download. Click ⚙ Backend, deploy the LoopLab audio ' +
        'service (see server/README.md), and paste its URL. Or download the MP3 with yt-dlp and drop the file here.'
      )
      return
    }

    try {
      const res = await fetch(raw)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const ab  = await res.arrayBuffer()
      const base = raw.split('/').pop().split('?')[0].replace(/\.[^.]+$/, '')
      setTrackName(base || 'mix')
      await decodeAndLoad(ab)
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        `Could not load the URL. Make sure it's a direct link to an audio file (ending in .mp3, .wav, etc.) ` +
        `and that the server allows cross-origin requests. Error: ${err.message}`
      )
    }
  }

  // ── Wake + ping the backend ───────────────────────────────────────────────
  // Render's free tier cold-starts in ~30–60s. Rather than one long fetch that
  // just fails, we poll /health every few seconds while a timer counts up, and
  // flip to green the instant it responds. Gives the user live feedback.
  function clearWakeTimers() {
    if (wakeIntervalRef.current) { clearInterval(wakeIntervalRef.current); wakeIntervalRef.current = null }
    if (wakePollRef.current)     { clearTimeout(wakePollRef.current);       wakePollRef.current = null }
  }

  function wakeBackend(url) {
    if (!url) return
    const base = url.replace(/\/$/, '')
    clearWakeTimers()
    setBackendStatus('waking')
    setWakeElapsed(0)

    const started = Date.now()
    const MAX_MS  = 120000 // give Render up to 2 min to cold-start

    wakeIntervalRef.current = setInterval(() => {
      setWakeElapsed(Math.floor((Date.now() - started) / 1000))
    }, 1000)

    const attempt = async () => {
      try {
        const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(8000) })
        if (res.ok) { clearWakeTimers(); setBackendStatus('ok'); return }
      } catch { /* still waking — keep polling */ }
      if (Date.now() - started > MAX_MS) { clearWakeTimers(); setBackendStatus('error'); return }
      wakePollRef.current = setTimeout(attempt, 3000)
    }
    attempt()
  }

  // Stop polling when the page unmounts.
  useEffect(() => () => clearWakeTimers(), [])

  function copyBackendUrl() {
    if (!backendUrl) return
    navigator.clipboard.writeText(backendUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  function onDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }

  function fmt(s) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── Access gate: the whole page is invite-only. Signed-out → sign-in prompt;
  //    signed-in without approval → the "not enabled" message. Real enforcement
  //    is still server-side; this just stops people reaching the tools at all.
  if (authConfigured) {
    if (!user) return <DownloaderGate mode="signin" />
    if (profileLoading) return <DownloaderGate mode="loading" />
    if (!canDownload) return <DownloaderGate mode="denied" />
  }

  return (
    <div className="min-h-screen bg-base text-ink" onDrop={onDrop} onDragOver={e => e.preventDefault()}>
      <div className="w-full max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/')} className="text-dim hover:text-ink transition text-sm flex items-center gap-1">
            ← Back
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-3xl">🎚️</span>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-acid to-acid bg-clip-text text-transparent">
              Player &amp; Downloader
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {backendUrl && !showBackend && (
              <button
                onClick={copyBackendUrl}
                title="Click to copy backend URL"
                className="hidden sm:flex items-center gap-1.5 text-xs text-dim hover:text-emerald-300 transition font-mono max-w-[220px] truncate"
              >
                <span className="truncate">{backendUrl.replace(/^https?:\/\//, '')}</span>
                <span className="shrink-0">{copied ? '✓' : '⎘'}</span>
              </button>
            )}
            <button
              onClick={() => {
                const next = !showBackend
                setShowBackend(next)
                if (next && backendUrl) wakeBackend(backendUrl)
              }}
              className={`text-xs px-3 py-1.5  border transition flex items-center gap-1.5 ${backendUrl ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' : 'border-hairline text-dim hover:text-ink'}`}
            >
              ⚙ Backend
              {backendUrl && backendStatus === 'ok'      && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.7)] shrink-0" />}
              {backendUrl && backendStatus === 'waking'  && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
              {backendUrl && (backendStatus === 'error' || backendStatus === 'unknown') && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
            </button>
          </div>
        </div>

        {/* How-to banner */}
        {!backendUrl && (
          <div className=" border border-acid/20 bg-surface p-5 mb-6">
            <h2 className="text-sm font-bold text-acid mb-3">Load SoundCloud &amp; YouTube tracks</h2>
            <p className="text-xs text-dim leading-relaxed mb-3">
              This uses the LoopLab audio backend — a free service that's already set up and ready.
              You just need to connect it once:
            </p>
            <ol className="space-y-2.5 text-xs text-dim leading-relaxed">
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-acid/50 text-acid flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                <span>Click the <strong className="text-ink">⚙ Backend</strong> button above.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-acid/50 text-acid flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                <span>Paste your backend URL and hit <strong className="text-ink">Save &amp; Wake</strong> — it may take ~30s to spin up on first use.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="w-5 h-5 rounded-full bg-acid/50 text-acid flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                <span>Paste any SoundCloud or YouTube link below — the track loads straight into the deck with full EQ and download.</span>
              </li>
            </ol>
          </div>
        )}

        {/* Backend settings */}
        {showBackend && (
          <div className=" border border-emerald-500/20 bg-emerald-900/10 p-5 mb-6">
            <h2 className="text-sm font-semibold text-emerald-300 uppercase tracking-widest mb-3">Downloader Backend</h2>

            {/* Status row */}
            <div className="flex items-center gap-2.5 mb-4">
              {/* Status light: red (off/error) · amber pulse (waking) · green (live) */}
              <span className="relative flex h-3 w-3 shrink-0">
                {backendStatus === 'waking' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  backendStatus === 'ok' ? 'bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]'
                  : backendStatus === 'waking' ? 'bg-amber-400'
                  : 'bg-red-500'
                }`} />
              </span>

              {backendStatus === 'unknown' && <span className="text-xs text-dim">Offline — hit <strong className="text-ink">Wake now</strong> to start the backend</span>}
              {backendStatus === 'waking'  && (
                <span className="text-xs text-amber-300 font-mono tabular-nums">
                  Waking up Render… <strong className="text-amber-200">{wakeElapsed}s</strong>
                  <span className="text-amber-400/60"> (usually 30–60s on free tier)</span>
                </span>
              )}
              {backendStatus === 'ok'      && <span className="text-xs text-emerald-400 font-semibold">● Live — backend is awake and responding</span>}
              {backendStatus === 'error'   && <span className="text-xs text-red-400">Not reachable after 2 min — check the URL, or the service may be asleep/down</span>}

              {backendUrl && backendStatus !== 'waking' && (
                <button
                  onClick={() => wakeBackend(backendUrl)}
                  className="ml-auto text-xs px-2.5 py-1  bg-surface hover:bg-surface-2 border border-hairline transition shrink-0"
                >
                  Wake now
                </button>
              )}
              {backendStatus === 'waking' && (
                <span className="ml-auto text-xs text-dim shrink-0">checking…</span>
              )}
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                placeholder="https://looplab-audio.onrender.com"
                className="flex-1 bg-surface-2 border border-hairline px-4 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150 font-mono"
              />
              <button
                onClick={() => {
                  const u = backendUrl.trim()
                  localStorage.setItem('looplab-backend', u)
                  setBackendStatus('unknown')
                  setShowBackend(false)
                  if (u) wakeBackend(u)
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500  text-sm font-semibold transition"
              >
                Save &amp; Wake
              </button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-faint leading-relaxed">
                After deploying to Render, paste your service URL above — it looks like{' '}
                <code className="text-emerald-300/70">https://looplab-audio.onrender.com</code>
              </p>
              {backendUrl && (
                <button
                  onClick={() => { setBackendUrl(''); setBackendStatus('unknown'); localStorage.removeItem('looplab-backend') }}
                  className="text-xs text-faint hover:text-red-400 ml-4 shrink-0 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Load area */}
        <div className=" border border-hairline bg-surface p-5 mb-6">
          <h2 className="text-sm font-semibold text-dim uppercase tracking-widest mb-4">Load Audio</h2>

          {/* File drop zone */}
          <div
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-hairline hover:border-acid/50  p-6 text-center cursor-pointer transition mb-4 group"
          >
            <span className="text-3xl block mb-1">📁</span>
            <p className="text-sm text-dim group-hover:text-ink transition">
              Click or drag an audio file here
            </p>
            <p className="text-xs text-faint mt-1">MP3 · WAV · OGG · FLAC · M4A</p>
          </div>
          <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && loadFile(e.target.files[0])} />

          {/* URL input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadUrl()}
              placeholder="Paste a direct audio URL (MP3, SoundCloud stream…)"
              className="flex-1 bg-surface-2 border border-hairline px-4 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:border-acid transition-colors duration-150"
            />
            <button
              onClick={loadUrl}
              className="px-4 py-2.5 bg-acid hover:bg-acid-dim  text-sm font-semibold transition"
            >
              Load
            </button>
          </div>

          {status === 'loading' && (
            <p className="text-xs text-acid mt-3 animate-pulse">Fetching and decoding audio…</p>
          )}
          <p className="text-xs text-faint mt-3">
            Tip: paste a <span className="text-orange-400">SoundCloud</span> track URL to play it in the embedded player below.
          </p>
          {status === 'error' && (
            <div className="mt-3  bg-red-900/20 border border-red-500/20 p-3 text-xs text-red-300 leading-relaxed">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Playlist downloader */}
        <PlaylistDownloader backendUrl={backendUrl} />

        {/* SoundCloud embedded player */}
        {status === 'soundcloud' && scUrl && (
          <div className=" border border-orange-500/20 bg-orange-900/10 p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">☁️</span>
              <h2 className="text-sm font-semibold text-orange-300 uppercase tracking-widest">SoundCloud Player</h2>
            </div>
            <iframe
              key={scUrl}
              title="SoundCloud player"
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              className=""
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(scUrl)}&color=%23a855f7&auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`}
            />
            <p className="text-xs text-orange-300/50 mt-3 leading-relaxed">
              SoundCloud audio plays inside its own player, so the 3-band EQ and download below can't process it
              (browser security blocks cross-origin audio access). For full EQ + download control, load a file or a
              direct audio URL instead.
            </p>
          </div>
        )}

        {/* Deck — visible once ready */}
        <div className={` border border-hairline bg-surface p-5 transition-opacity ${status === 'ready' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

          {/* Waveform */}
          <div className="relative mb-4  overflow-hidden cursor-pointer" onClick={onWaveformClick} style={{ height: 80 }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={80}
              className="w-full h-full"
              style={{ display: 'block' }}
            />
            {status !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-faint text-xs">
                Load a track to see the waveform
              </div>
            )}
          </div>

          {/* Time */}
          <div className="flex justify-between text-xs font-mono text-dim mb-4">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>

          {/* Seek bar */}
          <input
            type="range" min={0} max={1} step={0.001} value={progress}
            onChange={e => {
              const r = parseFloat(e.target.value)
              const newOffset = r * (bufferRef.current?.duration || 0)
              offsetRef.current = newOffset
              setCurrent(newOffset)
              setProgress(r)
              if (playing) playFrom(newOffset)
            }}
            className="w-full mb-5 accent-acid"
          />

          {/* Transport */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Rewind */}
            <button
              onClick={() => { stopSource(); offsetRef.current = 0; setCurrent(0); setProgress(0); setPlaying(false) }}
              className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center transition text-dim hover:text-ink"
            >
              ⏮
            </button>
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-acid hover:bg-acid-dim flex items-center justify-center text-2xl text-base transition-colors duration-150"
            >
              {playing ? '⏸' : '▶'}
            </button>
            {/* Stop */}
            <button
              onClick={() => { stopSource(); offsetRef.current = 0; setCurrent(0); setProgress(0); setPlaying(false) }}
              className="w-10 h-10 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center transition text-dim hover:text-ink"
            >
              ⏹
            </button>
          </div>

          {/* EQ section */}
          <div className="border-t border-hairline pt-6">
            <h3 className="text-xs font-semibold text-dim uppercase tracking-widest text-center mb-5">3-Band EQ</h3>
            <div className="grid grid-cols-3 gap-4 justify-items-center mb-6">
              <Knob label="Low"  value={lowGain}  onChange={v => setLowGain( Math.round(v * 10) / 10)} color="#3b82f6" />
              <Knob label="Mid"  value={midGain}  onChange={v => setMidGain( Math.round(v * 10) / 10)} color="#a855f7" />
              <Knob label="High" value={highGain} onChange={v => setHighGain(Math.round(v * 10) / 10)} color="#ec4899" />
            </div>
            <p className="text-center text-xs text-faint">Double-click any knob to reset to 0 dB</p>
          </div>

          {/* Volume */}
          <div className="border-t border-hairline pt-5 mt-2">
            <div className="flex items-center gap-3">
              <span className="text-dim text-sm">🔈</span>
              <input
                type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-acid"
              />
              <span className="text-dim text-sm">🔊</span>
              <span className="text-xs font-mono text-dim w-10 text-right">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Download */}
          <div className="border-t border-hairline pt-5 mt-5">
            <button
              onClick={downloadMix}
              disabled={exporting || status !== 'ready'}
              className="w-full py-3 bg-acid text-base hover:bg-acid-dim disabled:opacity-40 disabled:cursor-not-allowed font-display font-semibold uppercase tracking-wide text-sm transition-colors duration-150 flex items-center justify-center gap-2"
            >
              {exporting ? (
                <><span className="animate-spin">⏳</span> Rendering mix…</>
              ) : (
                <>⬇ Download mix (WAV, with EQ applied)</>
              )}
            </button>
            <p className="text-center text-xs text-faint mt-2">Exports the track with your current EQ &amp; volume baked in</p>

            {streamUrl && backendUrl && (
              <>
                <button
                  onClick={downloadOriginal}
                  disabled={dlBusy}
                  className="mt-3 w-full py-3 bg-surface hover:bg-surface-2 border border-hairline font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 text-ink disabled:opacity-50"
                >
                  {dlBusy ? <><span className="animate-spin">⏳</span> Downloading…</> : <>⬇ Download original MP3 (no EQ)</>}
                </button>
                {dlMsg && <p className="text-center text-xs text-amber-300/80 mt-2">{dlMsg}</p>}
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6  bg-amber-900/10 border border-amber-500/10 p-4 text-xs text-amber-300/60 leading-relaxed">
          <strong className="text-amber-300/80">SoundCloud / YouTube downloads:</strong> deploy the small
          backend service in <code className="text-amber-200/80">server/</code> (one-click Render steps are in
          <code className="text-amber-200/80"> server/README.md</code>), then paste its URL into
          <strong> ⚙ Backend</strong> above. After that, SoundCloud/YouTube links load straight into the deck with
          full EQ, playback and download.
          <br /><br />
          Without a backend, the browser can't fetch their audio (cross-origin security) — SoundCloud links fall back
          to an embedded player, and you can always drop in a file or a direct MP3/WAV URL.
          <br /><br />
          <span className="text-amber-300/40">Only download audio you have the right to — your own uploads, Creative Commons, or tracks where the artist enabled downloads.</span>
        </div>

      </div>
    </div>
  )
}
