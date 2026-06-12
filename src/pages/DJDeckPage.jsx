import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

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
  ctx.fillStyle = '#0f0f1a'
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
    const r = progress < playhead ? 200 : 100
    const g = progress < playhead ? 100 : 60
    const b = progress < playhead ? 255 : 180
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, (H - h) / 2, 1, h)
  }

  // Playhead line
  const px = Math.floor(playhead * W)
  ctx.fillStyle = '#fff'
  ctx.fillRect(px, 0, 2, H)
}

// ─── Knob component ──────────────────────────────────────────────────────────
function Knob({ label, value, onChange, min = -12, max = 12, color = '#a855f7' }) {
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
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',  onUp)
    window.addEventListener('touchmove', e => {
      if (!dragging.current) return
      const delta = (startY.current - e.touches[0].clientY) / 150 * (max - min)
      onChange(Math.max(min, Math.min(max, startVal.current + delta)))
    })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
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
      <span className="text-xs font-mono text-gray-300">{value > 0 ? '+' : ''}{value.toFixed(1)} dB</span>
      <span className="text-xs text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DJDeckPage() {
  const navigate    = useNavigate()
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
      a.download = `${trackName || 'mix'}-looplab.wav`
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
    setStatus('loading')
    setErrorMsg('')

    // SoundCloud → embed the official widget player (browsers can't fetch its
    // audio for Web Audio EQ, but the widget plays anything public).
    if (/soundcloud\.com|snd\.sc/.test(raw)) {
      bufferRef.current = null
      setScUrl(raw)
      setStatus('soundcloud')
      return
    }

    // Loading a real audio URL clears any SoundCloud embed
    setScUrl('')

    // YouTube note
    if (/youtube\.com|youtu\.be/.test(raw)) {
      setStatus('error')
      setErrorMsg(
        'YouTube links cannot be fetched directly from a browser — YouTube blocks cross-origin audio access. ' +
        'To use this deck with YouTube audio: download the MP3 using a tool like yt-dlp or an online converter, ' +
        'then drag the file onto this page or use "Load File" above.'
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

  return (
    <div className="min-h-screen bg-gray-950 text-white" onDrop={onDrop} onDragOver={e => e.preventDefault()}>
      <div className="w-full max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition text-sm flex items-center gap-1">
            ← Back
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-3xl">🎚️</span>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              DJ Deck
            </h1>
          </div>
        </div>

        {/* Load area */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Load Audio</h2>

          {/* File drop zone */}
          <div
            onClick={() => fileInputRef.current.click()}
            className="border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-xl p-6 text-center cursor-pointer transition mb-4 group"
          >
            <span className="text-3xl block mb-1">📁</span>
            <p className="text-sm text-gray-400 group-hover:text-gray-200 transition">
              Click or drag an audio file here
            </p>
            <p className="text-xs text-gray-600 mt-1">MP3 · WAV · OGG · FLAC · M4A</p>
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
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={loadUrl}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-semibold transition"
            >
              Load
            </button>
          </div>

          {status === 'loading' && (
            <p className="text-xs text-purple-400 mt-3 animate-pulse">Fetching and decoding audio…</p>
          )}
          <p className="text-xs text-gray-600 mt-3">
            Tip: paste a <span className="text-orange-400">SoundCloud</span> track URL to play it in the embedded player below.
          </p>
          {status === 'error' && (
            <div className="mt-3 rounded-xl bg-red-900/20 border border-red-500/20 p-3 text-xs text-red-300 leading-relaxed">
              {errorMsg}
            </div>
          )}
        </div>

        {/* SoundCloud embedded player */}
        {status === 'soundcloud' && scUrl && (
          <div className="rounded-2xl border border-orange-500/20 bg-orange-900/10 p-5 mb-6">
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
              className="rounded-xl"
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
        <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 transition-opacity ${status === 'ready' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

          {/* Waveform */}
          <div className="relative mb-4 rounded-xl overflow-hidden cursor-pointer" onClick={onWaveformClick} style={{ height: 80 }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={80}
              className="w-full h-full"
              style={{ display: 'block' }}
            />
            {status !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-gray-600 text-xs">
                Load a track to see the waveform
              </div>
            )}
          </div>

          {/* Time */}
          <div className="flex justify-between text-xs font-mono text-gray-500 mb-4">
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
            className="w-full mb-5 accent-purple-500"
          />

          {/* Transport */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Rewind */}
            <button
              onClick={() => { stopSource(); offsetRef.current = 0; setCurrent(0); setProgress(0); setPlaying(false) }}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-gray-400 hover:text-white"
            >
              ⏮
            </button>
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-2xl transition shadow-lg shadow-purple-900/40"
            >
              {playing ? '⏸' : '▶'}
            </button>
            {/* Stop */}
            <button
              onClick={() => { stopSource(); offsetRef.current = 0; setCurrent(0); setProgress(0); setPlaying(false) }}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-gray-400 hover:text-white"
            >
              ⏹
            </button>
          </div>

          {/* EQ section */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-center mb-5">3-Band EQ</h3>
            <div className="grid grid-cols-3 gap-4 justify-items-center mb-6">
              <Knob label="Low"  value={lowGain}  onChange={v => setLowGain( Math.round(v * 10) / 10)} color="#3b82f6" />
              <Knob label="Mid"  value={midGain}  onChange={v => setMidGain( Math.round(v * 10) / 10)} color="#a855f7" />
              <Knob label="High" value={highGain} onChange={v => setHighGain(Math.round(v * 10) / 10)} color="#ec4899" />
            </div>
            <p className="text-center text-xs text-gray-600">Double-click any knob to reset to 0 dB</p>
          </div>

          {/* Volume */}
          <div className="border-t border-white/10 pt-5 mt-2">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm">🔈</span>
              <input
                type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-gray-500 text-sm">🔊</span>
              <span className="text-xs font-mono text-gray-400 w-10 text-right">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Download */}
          <div className="border-t border-white/10 pt-5 mt-5">
            <button
              onClick={downloadMix}
              disabled={exporting || status !== 'ready'}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              {exporting ? (
                <><span className="animate-spin">⏳</span> Rendering mix…</>
              ) : (
                <>⬇ Download mix (WAV, with EQ applied)</>
              )}
            </button>
            <p className="text-center text-xs text-gray-600 mt-2">Exports the track with your current EQ &amp; volume baked in</p>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 rounded-xl bg-amber-900/10 border border-amber-500/10 p-4 text-xs text-amber-300/60 leading-relaxed">
          <strong className="text-amber-300/80">Note:</strong> YouTube and SoundCloud do not allow browsers to fetch their audio directly due to cross-origin restrictions.
          To load a YouTube track: copy the URL into <a href="https://github.com/yt-dlp/yt-dlp" target="_blank" rel="noreferrer" className="underline hover:text-amber-200">yt-dlp</a> or
          an online converter to get an MP3, then drag it onto this page.
          Direct links to MP3/WAV files hosted elsewhere (e.g. your own server, S3, or Dropbox direct-download links) load instantly.
        </div>

      </div>
    </div>
  )
}
