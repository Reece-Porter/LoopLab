import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'
import { makeTrackName, getBackendUrl, isStreamingUrl, fmtTime } from '../audio/djHelpers'

// ─── Single deck ──────────────────────────────────────────────────────────────
// Audio plays through an AudioBufferSourceNode. Tempo (and therefore the
// real-time beat rate) is set with playbackRate. Beat-matching works on a
// beatgrid: a track has a natural BPM and a "grid" offset marking beat 1, so a
// bar boundary in track-time is  grid + n * (4 * 60/bpm). Sync aligns the two
// decks' bar phase at one shared instant; with equal tempo they then stay locked.
const Deck = forwardRef(function Deck({ ctx, destNode, label, accent }, ref) {
  const [url, setUrl]           = useState('')
  const [status, setStatus]     = useState('idle')
  const [errorMsg, setErrorMsg]     = useState('')
  const [trackName, setName]        = useState('')
  const [playing, setPlaying]       = useState(false)
  const [origBpm, setOrigBpm]       = useState(120)
  const [bpm, setBpmState]          = useState(120)
  const [progress, setProgress]     = useState(0)
  const [duration, setDuration]     = useState(0)
  const [loopBars, setLoopBars]     = useState(0)
  const [gridSet, setGridSet]   = useState(false)

  // Refs so the imperative sync methods always see live values.
  const bufferRef   = useRef(null)
  const sourceRef   = useRef(null)
  const startCtxRef = useRef(0)
  const startPosRef = useRef(0)
  const rafRef      = useRef(null)
  const canvasRef   = useRef(null)
  const playingRef  = useRef(false)
  const rateRef     = useRef(1)
  const origRef     = useRef(120)
  const bpmRef      = useRef(120)
  const gridRef     = useRef(0)
  const loopRef     = useRef({ active: false, start: 0, len: 0 })

  // ── Live track position (handles scheduled starts + looping) ──────────────
  function currentPos(now = ctx.currentTime) {
    if (!playingRef.current) return startPosRef.current
    if (now < startCtxRef.current) return startPosRef.current
    let raw = startPosRef.current + (now - startCtxRef.current) * rateRef.current
    const lp = loopRef.current
    if (lp.active && lp.len > 0 && raw > lp.start) raw = lp.start + ((raw - lp.start) % lp.len)
    const d = bufferRef.current ? bufferRef.current.duration : 0
    if (raw < 0) raw = 0
    if (d && raw > d) raw = d
    return raw
  }

  function barPhase(now) {
    const barDur = (4 * 60) / (origRef.current || 120)
    let ph = ((currentPos(now) - gridRef.current) / barDur) % 1
    if (ph < 0) ph += 1
    return ph
  }

  // ── Imperative API for the page (sync / master play) ─────────────────────
  useImperativeHandle(ref, () => ({
    isReady:   () => !!bufferRef.current,
    isPlaying: () => playingRef.current,
    getSync:   (now) => ({ ready: !!bufferRef.current, bpm: bpmRef.current, phase: barPhase(now) }),
    applySync: (targetBpm, targetPhase, now) => applySync(targetBpm, targetPhase, now),
    play:      (when) => play(when),
    pause:     () => pause(),
  }), [])

  function stopSource() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch (_) {}
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
  }

  function playFrom(pos, when = ctx.currentTime, rate = rateRef.current) {
    stopSource()
    if (ctx.state === 'suspended') ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = bufferRef.current
    src.playbackRate.value = rate
    if (loopRef.current.active && loopRef.current.len > 0) {
      src.loop = true
      src.loopStart = loopRef.current.start
      src.loopEnd   = loopRef.current.start + loopRef.current.len
    }
    src.connect(destNode)
    src.start(when, pos)
    sourceRef.current   = src
    startCtxRef.current = when
    startPosRef.current = pos
    playingRef.current  = true
    setPlaying(true)
    loopTick()
  }

  function loopTick() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const step = () => {
      const now = ctx.currentTime
      if (now < startCtxRef.current) { rafRef.current = requestAnimationFrame(step); return }
      const pos = currentPos(now)
      if (!loopRef.current.active && bufferRef.current && pos >= bufferRef.current.duration - 0.02) { stop(); return }
      setProgress(bufferRef.current ? pos / bufferRef.current.duration : 0)
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  function play(when = ctx.currentTime) {
    if (!bufferRef.current) return
    playFrom(startPosRef.current, when)
  }
  function pause() {
    if (!playingRef.current) return
    startPosRef.current = currentPos(ctx.currentTime)
    stopSource()
    playingRef.current = false
    setPlaying(false)
  }
  function togglePlay() { playingRef.current ? pause() : play() }
  function stop() {
    stopSource()
    startPosRef.current = 0
    playingRef.current = false
    setPlaying(false)
    setProgress(0)
  }
  function cue() {
    const was = playingRef.current
    startPosRef.current = 0
    setProgress(0)
    if (was) playFrom(0)
  }
  function seek(ratio) {
    const pos = ratio * (bufferRef.current?.duration || 0)
    if (playingRef.current) playFrom(pos)
    else { startPosRef.current = pos; setProgress(ratio) }
  }

  // ── Tempo / BPM ───────────────────────────────────────────────────────────
  function applyBpm(newBpm) {
    const now = ctx.currentTime
    const nr = newBpm / (origRef.current || 120)
    if (playingRef.current && sourceRef.current) {
      startPosRef.current = currentPos(now)
      startCtxRef.current = now
      sourceRef.current.playbackRate.value = nr
    }
    rateRef.current = nr
    bpmRef.current = newBpm
    setBpmState(newBpm)
  }
  function setTrackBpm(v) {
    const n = Number(v) || 120
    origRef.current = n
    setOrigBpm(n)
    applyBpm(n)
  }
  function nudge(d) { applyBpm(Math.max(40, Math.min(240, bpmRef.current + d))) }

  // ── Beatgrid + sync ───────────────────────────────────────────────────────
  function setGrid() {
    gridRef.current = currentPos(ctx.currentTime)
    setGridSet(true)
  }
  function applySync(targetBpm, targetPhase, now) {
    const barDur = (4 * 60) / (origRef.current || 120)
    const curBars = (currentPos(now) - gridRef.current) / barDur
    let newPos = gridRef.current + (Math.floor(curBars) + targetPhase) * barDur
    if (newPos < 0) newPos += barDur
    const nr = targetBpm / (origRef.current || 120)
    rateRef.current = nr
    bpmRef.current = targetBpm
    setBpmState(targetBpm)
    if (playingRef.current) playFrom(newPos, now, nr)
    else { startPosRef.current = newPos; setProgress(bufferRef.current ? newPos / bufferRef.current.duration : 0) }
  }

  // ── Loops ─────────────────────────────────────────────────────────────────
  function setLoop(n) {
    if (loopBars === n) return clearLoop()
    const barDur = (4 * 60) / (origRef.current || 120)
    const pos = currentPos(ctx.currentTime)
    const start = Math.max(0, gridRef.current + Math.floor((pos - gridRef.current) / barDur) * barDur)
    const len = n * barDur
    loopRef.current = { active: true, start, len }
    setLoopBars(n)
    if (sourceRef.current) {
      sourceRef.current.loopStart = start
      sourceRef.current.loopEnd   = start + len
      sourceRef.current.loop = true
    }
  }
  function clearLoop() {
    loopRef.current = { ...loopRef.current, active: false }
    setLoopBars(0)
    if (sourceRef.current) sourceRef.current.loop = false
  }

  function drawWave(buffer) {
    const canvas = canvasRef.current
    if (!canvas || !buffer) return
    const c = canvas.getContext('2d'); const W = canvas.width; const H = canvas.height
    const data = buffer.getChannelData(0); const step = Math.floor(data.length / W)
    c.clearRect(0, 0, W, H)
    for (let x = 0; x < W; x++) {
      let max = 0
      for (let s = 0; s < step; s++) { const v = Math.abs(data[x * step + s] || 0); if (v > max) max = v }
      const h = Math.max(1, max * H * 0.9)
      c.fillStyle = accent; c.globalAlpha = 0.7
      c.fillRect(x, (H - h) / 2, 1, h)
    }
    c.globalAlpha = 1
  }

  async function load() {
    const raw = url.trim(); if (!raw) return
    const backend = getBackendUrl()
    stop(); setStatus('loading'); setErrorMsg(''); setGridSet(false); gridRef.current = 0
    try {
      let arrayBuffer, info = null
      if (isStreamingUrl(raw)) {
        if (!backend) throw new Error('No backend set. Open Player & Downloader → ⚙ Backend first.')
        const infoP = fetch(`${backend}/api/info?url=${encodeURIComponent(raw)}`).then(r => r.ok ? r.json() : null).catch(() => null)
        const res = await fetch(`${backend}/api/fetch?url=${encodeURIComponent(raw)}`)
        if (!res.ok) { const m = await res.json().catch(() => ({})); throw new Error(m.error || `HTTP ${res.status}`) }
        arrayBuffer = await res.arrayBuffer(); info = await infoP
      } else {
        const res = await fetch(raw); if (!res.ok) throw new Error(`HTTP ${res.status}`)
        arrayBuffer = await res.arrayBuffer()
      }
      const buffer = await ctx.decodeAudioData(arrayBuffer)
      bufferRef.current = buffer; startPosRef.current = 0
      setDuration(buffer.duration)
      setName(info ? makeTrackName(info) : (raw.split('/').pop() || 'track'))
      setStatus('ready'); setProgress(0)
      setTimeout(() => drawWave(buffer), 50)
    } catch (err) { setStatus('error'); setErrorMsg(err.message) }
  }

  useEffect(() => () => stopSource(), [])

  const rate = origBpm > 0 ? bpm / origBpm : 1
  const loopBtn = n => (
    <button key={n} onClick={() => setLoop(n)}
      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition border ${loopBars === n ? 'text-white border-transparent' : 'text-gray-400 border-white/10 hover:border-white/30'}`}
      style={loopBars === n ? { background: accent } : {}}>
      {n}
    </button>
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Deck {label}</span>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-2xl font-black" style={{ color: accent }}>{bpm}</span>
          <span className="text-xs text-gray-500">BPM</span>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <input type="text" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="SoundCloud / YouTube link"
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition" />
        <button onClick={load} className="px-3 py-2 rounded-lg text-xs font-semibold text-white transition" style={{ background: accent }}>Load</button>
      </div>

      {status === 'loading' && <p className="text-xs text-gray-400 animate-pulse mb-2">Loading… (Render free tier can take ~40s to wake)</p>}
      {status === 'error'   && <p className="text-xs text-red-400 mb-2 leading-snug">{errorMsg}</p>}
      {trackName && status === 'ready' && <p className="text-xs text-gray-300 truncate mb-2" title={trackName}>♪ {trackName}</p>}

      <div className="relative rounded-lg overflow-hidden bg-black/40 mb-1" style={{ height: 56 }}>
        <canvas ref={canvasRef} width={360} height={56} className="w-full h-full block" />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none" style={{ left: `${progress * 100}%` }} />
        <div className="absolute inset-0 cursor-pointer" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); seek((e.clientX - r.left) / r.width) }} />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-3">
        <span>{fmtTime(progress * duration)}</span><span>{fmtTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-3 mb-3">
        <button onClick={cue} disabled={status !== 'ready'} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-gray-300 transition" title="Cue / restart">⏮</button>
        <button onClick={togglePlay} disabled={status !== 'ready'} className="w-14 h-14 rounded-full disabled:opacity-30 flex items-center justify-center text-2xl text-white shadow-lg transition" style={{ background: accent }}>{playing ? '⏸' : '▶'}</button>
        <button onClick={stop} disabled={status !== 'ready'} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-gray-300 transition" title="Stop">⏹</button>
      </div>

      {/* Loops */}
      <div className="flex items-center gap-2 mb-3 justify-center">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Loop bars</span>
        {[4, 8, 16, 32].map(loopBtn)}
        {loopBars > 0 && <button onClick={clearLoop} className="px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-red-400 transition">✕</button>}
      </div>

      {/* Track BPM + grid */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider w-16">Track BPM</span>
        <input type="number" min={40} max={240} value={origBpm} onChange={e => setTrackBpm(e.target.value)}
          className="w-16 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-white/30" />
        <button onClick={setGrid} disabled={status !== 'ready'}
          className={`ml-auto px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition disabled:opacity-30 ${gridSet ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' : 'border-white/10 text-gray-400 hover:text-white'}`}
          title="Mark beat 1 at the current position">
          ⬇ Set “1” {gridSet ? '✓' : ''}
        </button>
      </div>

      {/* Tempo fader */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider w-16">Tempo</span>
        <input type="range" min={Math.round(origBpm * 0.5)} max={Math.round(origBpm * 1.5)} value={bpm}
          onChange={e => applyBpm(Number(e.target.value))} className="flex-1" style={{ accentColor: accent }} />
        <span className="text-[10px] font-mono text-gray-400 w-12 text-right">{rate.toFixed(3)}×</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button onClick={() => nudge(-1)} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition">− BPM</button>
        <button onClick={() => applyBpm(origBpm)} className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 transition">reset</button>
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
  const [crossfade, setCrossfade] = useState(0.5)
  const [ready, setReady] = useState(false)
  const [bothPlaying, setBothPlaying] = useState(false)
  const hasBackend = !!getBackendUrl()

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const gA = ctx.createGain(); const gB = ctx.createGain()
    gA.connect(ctx.destination); gB.connect(ctx.destination)
    ctxRef.current = ctx; gainARef.current = gA; gainBRef.current = gB
    setReady(true)
    return () => { ctx.close() }
  }, [])

  useEffect(() => {
    if (!gainARef.current) return
    gainARef.current.gain.value = Math.cos(crossfade * 0.5 * Math.PI)
    gainBRef.current.gain.value = Math.cos((1 - crossfade) * 0.5 * Math.PI)
  }, [crossfade])

  // Align deck B's tempo + beat phase to deck A (or vice versa).
  function sync(from, to) {
    const ctx = ctxRef.current
    const now = ctx.currentTime + 0.05
    const info = from.current?.getSync(now)
    if (!info || !info.ready || !to.current?.isReady()) return
    to.current.applySync(info.bpm, info.phase, now)
  }

  // Start both decks locked to the same beat at one scheduled instant.
  function playBoth() {
    const a = deckARef.current, b = deckBRef.current
    const ctx = ctxRef.current
    if (!a?.isReady() || !b?.isReady()) return

    if (bothPlaying || a.isPlaying() || b.isPlaying()) {
      a.pause(); b.pause(); setBothPlaying(false); return
    }
    // Phase-align B to A first, then start both together.
    const now0 = ctx.currentTime
    const ai = a.getSync(now0)
    b.applySync(ai.bpm, ai.phase, now0)
    const when = ctx.currentTime + 0.15
    a.play(when); b.play(when)
    setBothPlaying(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition text-sm">← Back</button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-3xl">🎧</span>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">DJ Deck</h1>
          </div>
          <button onClick={() => navigate('/player')} className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition">Player &amp; Downloader →</button>
        </div>

        {!hasBackend && (
          <div className="rounded-xl bg-amber-900/10 border border-amber-500/20 p-4 text-xs text-amber-300/80 leading-relaxed mb-6">
            <strong>Backend needed for SoundCloud/YouTube.</strong> Open <button onClick={() => navigate('/player')} className="underline hover:text-amber-200">Player &amp; Downloader</button>, set the backend URL under ⚙ Backend, then come back. Direct MP3/WAV links work without it.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {ready && (
            <>
              <Deck ref={deckARef} ctx={ctxRef.current} destNode={gainARef.current} label="A" accent="#06b6d4" />
              <Deck ref={deckBRef} ctx={ctxRef.current} destNode={gainBRef.current} label="B" accent="#a855f7" />
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          {/* Master play + sync */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <button onClick={() => sync(deckARef, deckBRef)} className="px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 text-xs font-semibold transition">⟵ Sync A to B</button>
            <button onClick={playBoth} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-sm font-bold transition shadow-lg">
              {bothPlaying ? '⏸ Pause Both' : '▶ Play Both (beat-locked)'}
            </button>
            <button onClick={() => sync(deckBRef, deckARef)} className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-semibold transition">Sync B to A ⟶</button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-cyan-400 w-6">A</span>
            <input type="range" min={0} max={1} step={0.01} value={crossfade} onChange={e => setCrossfade(Number(e.target.value))} className="flex-1" style={{ accentColor: '#fff' }} />
            <span className="text-xs font-bold text-purple-400 w-6 text-right">B</span>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-2 uppercase tracking-widest">Crossfader</p>
        </div>

        <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-300">Beat-match like Rekordbox:</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Load a track on each deck and set each one's real BPM in <em>Track BPM</em>.</li>
            <li>For tight alignment, play a deck, and right as beat 1 of a bar hits, press <strong className="text-white">⬇ Set “1”</strong> to lock its grid (defaults to the track start otherwise).</li>
            <li>Press <strong className="text-white">Sync B to A</strong> — deck B snaps to A's tempo <em>and</em> beat phase, so the downbeats line up.</li>
            <li>Hit <strong className="text-white">Play Both</strong> to start them locked together, or use the crossfader to blend. Use <strong className="text-white">Loop bars</strong> (4/8/16/32) to hold a section while you mix.</li>
          </ol>
          <p className="mt-2 text-gray-600">Tempo changes pitch slightly (vinyl-style) — normal for beat-matching.</p>
        </div>
      </div>
    </div>
  )
}
