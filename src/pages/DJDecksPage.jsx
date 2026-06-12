import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeTrackName, getBackendUrl, isStreamingUrl, fmtTime } from '../audio/djHelpers'

// ─── Single deck ──────────────────────────────────────────────────────────────
// Pulls audio through the backend, decodes it, and plays it through an
// AudioBufferSourceNode whose playbackRate is used to beat-match. Output is
// routed into `destNode` (a per-deck gain feeding the crossfader).
const Deck = forwardRef(function Deck({ ctx, destNode, label, accent }, ref) {
  const [url, setUrl]           = useState('')
  const [status, setStatus]     = useState('idle') // idle | loading | ready | error
  const [errorMsg, setErrorMsg] = useState('')
  const [trackName, setTrackName] = useState('')
  const [playing, setPlaying]   = useState(false)
  const [origBpm, setOrigBpm]   = useState(120)   // the track's natural BPM (user-set)
  const [bpm, setBpm]           = useState(120)   // target / playing BPM
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const bufferRef    = useRef(null)
  const sourceRef    = useRef(null)
  const startCtxRef  = useRef(0)   // ctx.currentTime at last (re)start
  const startPosRef  = useRef(0)   // track position (s) at last (re)start
  const rafRef       = useRef(null)
  const canvasRef    = useRef(null)

  const rate = origBpm > 0 ? bpm / origBpm : 1

  // ── Expose BPM controls to the parent (for SYNC) ─────────────────────────
  useImperativeHandle(ref, () => ({
    getBpm: () => bpm,
    isReady: () => status === 'ready',
    syncTo: targetBpm => { if (status === 'ready') setBpm(Math.round(targetBpm)) },
  }), [bpm, status])

  // ── Live position (accounts for variable playbackRate) ───────────────────
  const currentPos = useCallback(() => {
    if (!playing) return startPosRef.current
    return startPosRef.current + (ctx.currentTime - startCtxRef.current) * (rate)
  }, [playing, rate, ctx])

  const tick = useCallback(() => {
    if (!bufferRef.current) return
    const pos = currentPos()
    if (pos >= bufferRef.current.duration) {
      stop()
      return
    }
    setProgress(pos / bufferRef.current.duration)
    rafRef.current = requestAnimationFrame(tick)
  }, [currentPos])

  // ── Apply rate changes live, rebasing the clock so position stays smooth ──
  useEffect(() => {
    if (playing && sourceRef.current) {
      startPosRef.current = currentPos()
      startCtxRef.current = ctx.currentTime
      sourceRef.current.playbackRate.value = rate
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate])

  function stopSource() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch (_) {}
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
  }

  function playFrom(pos) {
    stopSource()
    if (ctx.state === 'suspended') ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = bufferRef.current
    src.playbackRate.value = rate
    src.connect(destNode)
    src.start(0, pos)
    sourceRef.current  = src
    startCtxRef.current = ctx.currentTime
    startPosRef.current = pos
    setPlaying(true)
    rafRef.current = requestAnimationFrame(tick)
  }

  function togglePlay() {
    if (!bufferRef.current) return
    if (playing) {
      startPosRef.current = currentPos()
      stopSource()
      setPlaying(false)
    } else {
      playFrom(startPosRef.current)
    }
  }

  function stop() {
    stopSource()
    startPosRef.current = 0
    setProgress(0)
    setPlaying(false)
  }

  function cue() {
    // Jump back to the start; keep playing if we were.
    const wasPlaying = playing
    startPosRef.current = 0
    setProgress(0)
    if (wasPlaying) playFrom(0)
  }

  function seek(ratio) {
    const pos = ratio * (bufferRef.current?.duration || 0)
    startPosRef.current = pos
    setProgress(ratio)
    if (playing) playFrom(pos)
  }

  function nudge(delta) { setBpm(b => Math.max(40, Math.min(220, b + delta))) }

  function drawWave(buffer) {
    const canvas = canvasRef.current
    if (!canvas || !buffer) return
    const c = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const data = buffer.getChannelData(0)
    const step = Math.floor(data.length / W)
    c.clearRect(0, 0, W, H)
    for (let x = 0; x < W; x++) {
      let max = 0
      for (let s = 0; s < step; s++) { const v = Math.abs(data[x * step + s] || 0); if (v > max) max = v }
      const h = Math.max(1, max * H * 0.9)
      c.fillStyle = accent
      c.globalAlpha = 0.7
      c.fillRect(x, (H - h) / 2, 1, h)
    }
    c.globalAlpha = 1
  }

  async function load() {
    const raw = url.trim()
    if (!raw) return
    const backend = getBackendUrl()

    stop()
    setStatus('loading')
    setErrorMsg('')

    try {
      let arrayBuffer, info = null
      if (isStreamingUrl(raw)) {
        if (!backend) throw new Error('No backend set. Open Player & Downloader → ⚙ Backend to configure it first.')
        const infoP = fetch(`${backend}/api/info?url=${encodeURIComponent(raw)}`).then(r => r.ok ? r.json() : null).catch(() => null)
        const res = await fetch(`${backend}/api/fetch?url=${encodeURIComponent(raw)}`)
        if (!res.ok) { const m = await res.json().catch(() => ({})); throw new Error(m.error || `HTTP ${res.status}`) }
        arrayBuffer = await res.arrayBuffer()
        info = await infoP
      } else {
        const res = await fetch(raw)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        arrayBuffer = await res.arrayBuffer()
      }
      const buffer = await ctx.decodeAudioData(arrayBuffer)
      bufferRef.current = buffer
      startPosRef.current = 0
      setDuration(buffer.duration)
      setTrackName(info ? makeTrackName(info) : (raw.split('/').pop() || 'track'))
      setStatus('ready')
      setProgress(0)
      setTimeout(() => drawWave(buffer), 50)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    }
  }

  // Redraw the playhead overlay isn't needed; keep static waveform + a CSS bar.
  useEffect(() => () => stopSource(), [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col">
      {/* Label + BPM */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Deck {label}</span>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-2xl font-black" style={{ color: accent }}>{bpm}</span>
          <span className="text-xs text-gray-500">BPM</span>
        </div>
      </div>

      {/* Load */}
      <div className="flex gap-2 mb-3">
        <input
          type="text" value={url} onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="SoundCloud / YouTube link"
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition"
        />
        <button onClick={load} className="px-3 py-2 rounded-lg text-xs font-semibold transition text-white" style={{ background: accent }}>
          Load
        </button>
      </div>

      {status === 'loading' && <p className="text-xs text-gray-400 animate-pulse mb-2">Loading… (Render free tier can take ~40s to wake)</p>}
      {status === 'error'   && <p className="text-xs text-red-400 mb-2 leading-snug">{errorMsg}</p>}
      {trackName && status === 'ready' && <p className="text-xs text-gray-300 truncate mb-2" title={trackName}>♪ {trackName}</p>}

      {/* Waveform */}
      <div className="relative rounded-lg overflow-hidden bg-black/40 mb-1" style={{ height: 56 }}>
        <canvas ref={canvasRef} width={360} height={56} className="w-full h-full block" />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none" style={{ left: `${progress * 100}%` }} />
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width) }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-3">
        <span>{fmtTime(progress * duration)}</span>
        <span>{fmtTime(duration)}</span>
      </div>

      {/* Transport */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={cue} disabled={status !== 'ready'} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-gray-300 transition" title="Cue / restart">⏮</button>
        <button onClick={togglePlay} disabled={status !== 'ready'} className="w-14 h-14 rounded-full disabled:opacity-30 flex items-center justify-center text-2xl text-white shadow-lg transition" style={{ background: accent }}>
          {playing ? '⏸' : '▶'}
        </button>
        <button onClick={stop} disabled={status !== 'ready'} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-gray-300 transition" title="Stop">⏹</button>
      </div>

      {/* Track BPM (natural) */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider w-20">Track BPM</span>
        <input
          type="number" min={40} max={220} value={origBpm}
          onChange={e => { const v = Number(e.target.value) || 120; setOrigBpm(v); setBpm(v) }}
          className="w-16 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-white/30"
        />
        <span className="text-[10px] text-gray-600">set this to the track's real tempo</span>
      </div>

      {/* Tempo / pitch fader */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider w-20">Tempo</span>
        <input
          type="range" min={Math.round(origBpm * 0.5)} max={Math.round(origBpm * 1.5)} value={bpm}
          onChange={e => setBpm(Number(e.target.value))}
          className="flex-1" style={{ accentColor: accent }}
        />
        <span className="text-[10px] font-mono text-gray-400 w-14 text-right">{rate.toFixed(3)}×</span>
      </div>

      {/* Nudge */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => nudge(-1)} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition">− BPM</button>
        <button onClick={() => setBpm(origBpm)} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition">reset</button>
        <button onClick={() => nudge(1)} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition">+ BPM</button>
      </div>
    </div>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DJDecksPage() {
  const navigate = useNavigate()
  const ctxRef   = useRef(null)
  const gainARef = useRef(null)
  const gainBRef = useRef(null)
  const deckARef = useRef(null)
  const deckBRef = useRef(null)
  const [crossfade, setCrossfade] = useState(0.5) // 0 = full A, 1 = full B
  const [ready, setReady] = useState(false)
  const hasBackend = !!getBackendUrl()

  // Init shared audio graph once.
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const gA = ctx.createGain(); const gB = ctx.createGain()
    gA.connect(ctx.destination); gB.connect(ctx.destination)
    ctxRef.current = ctx; gainARef.current = gA; gainBRef.current = gB
    setReady(true)
    return () => { ctx.close() }
  }, [])

  // Equal-power crossfade.
  useEffect(() => {
    if (!gainARef.current) return
    gainARef.current.gain.value = Math.cos(crossfade * 0.5 * Math.PI)
    gainBRef.current.gain.value = Math.cos((1 - crossfade) * 0.5 * Math.PI)
  }, [crossfade])

  // Beat-match: set one deck's BPM to the other's.
  function syncBtoA() {
    if (deckARef.current && deckBRef.current) deckBRef.current.syncTo(deckARef.current.getBpm())
  }
  function syncAtoB() {
    if (deckARef.current && deckBRef.current) deckARef.current.syncTo(deckBRef.current.getBpm())
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition text-sm">← Back</button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-3xl">🎧</span>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">DJ Deck</h1>
          </div>
          <button onClick={() => navigate('/player')} className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition">
            Player &amp; Downloader →
          </button>
        </div>

        {!hasBackend && (
          <div className="rounded-xl bg-amber-900/10 border border-amber-500/20 p-4 text-xs text-amber-300/80 leading-relaxed mb-6">
            <strong>Backend needed for SoundCloud/YouTube.</strong> To mix and beat-match streaming tracks the decks
            need the downloader backend. Open <button onClick={() => navigate('/player')} className="underline hover:text-amber-200">Player &amp; Downloader</button>,
            set the backend URL under ⚙ Backend, then come back. Direct MP3/WAV links work without it.
          </div>
        )}

        {/* Decks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {ready && (
            <>
              <Deck ref={deckARef} ctx={ctxRef.current} destNode={gainARef.current} label="A" accent="#06b6d4" />
              <Deck ref={deckBRef} ctx={ctxRef.current} destNode={gainBRef.current} label="B" accent="#a855f7" />
            </>
          )}
        </div>

        {/* Beat-match + crossfader */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-center gap-3 mb-5">
            <button onClick={syncAtoB} className="px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 text-xs font-semibold transition">
              ⟵ Match A to B
            </button>
            <span className="text-xs text-gray-500 uppercase tracking-widest">Beat Match</span>
            <button onClick={syncBtoA} className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-semibold transition">
              Match B to A ⟶
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-cyan-400 w-6">A</span>
            <input type="range" min={0} max={1} step={0.01} value={crossfade} onChange={e => setCrossfade(Number(e.target.value))} className="flex-1" style={{ accentColor: '#fff' }} />
            <span className="text-xs font-bold text-purple-400 w-6 text-right">B</span>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2 uppercase tracking-widest">Crossfader</p>
        </div>

        {/* How-to */}
        <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-300">How to beat-match:</strong> Load a track on each deck, then type each track's
          real BPM into <em>Track BPM</em> (you can find it on the SoundCloud/Hypeddit page or by tapping along). Hit
          <strong className="text-white"> Match B to A</strong> to lock deck B's tempo to deck A. Use the tempo fader and
          ± BPM nudge for fine adjustments, and the crossfader to blend between them.
        </div>
      </div>
    </div>
  )
}
