import { useState, useRef, useEffect, useCallback } from 'react'
import { saveClip, loadAllClips, deleteClip, deserialise } from '../audio/vocalStore'
import { getContext } from '../audio/synth'

// Draw a mono waveform onto a canvas. trimStart/trimEnd are 0..1 fractions.
function drawWave(canvas, buffer, trimStart = 0, trimEnd = 1, accentColor = '#a855f7') {
  if (!canvas || !buffer) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const data = buffer.getChannelData(0)
  const step = Math.max(1, Math.floor(data.length / W))
  ctx.clearRect(0, 0, W, H)

  // Dim zone
  ctx.fillStyle = '#0f0f1a'
  ctx.fillRect(0, 0, W, H)

  const startX = Math.floor(trimStart * W)
  const endX   = Math.ceil(trimEnd   * W)

  for (let x = 0; x < W; x++) {
    let max = 0
    for (let s = 0; s < step; s++) { const v = Math.abs(data[x * step + s] || 0); if (v > max) max = v }
    const h = Math.max(1, max * (H - 4) * 0.92)
    ctx.fillStyle = (x >= startX && x < endX) ? accentColor : '#2d2d4a'
    ctx.globalAlpha = 0.85
    ctx.fillRect(x, (H - h) / 2, 1, h)
  }
  ctx.globalAlpha = 1

  // Trim handles
  ctx.fillStyle = '#fff'
  ctx.fillRect(startX, 0, 2, H)
  ctx.fillRect(endX - 2, 0, 2, H)
  // Shaded outside trim region
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0, 0, startX, H)
  ctx.fillRect(endX, 0, W - endX, H)
}

// Trim an AudioBuffer to the [start..end] fraction.
function trimBuffer(ctx, buffer, start, end) {
  const from   = Math.floor(start * buffer.length)
  const to     = Math.ceil(end   * buffer.length)
  const length = Math.max(1, to - from)
  const out    = ctx.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate)
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    out.copyToChannel(buffer.getChannelData(c).slice(from, to), c)
  }
  return out
}

// ─── Saved clip pill ──────────────────────────────────────────────────────────
function ClipPill({ clip, audioCtx, onDelete, onDragStart }) {
  const [previewing, setPreviewing] = useState(false)
  const srcRef = useRef(null)

  function preview() {
    if (previewing) { try { srcRef.current?.stop() } catch {} srcRef.current = null; setPreviewing(false); return }
    const buf = deserialise(audioCtx, clip)
    const src = audioCtx.createBufferSource()
    src.buffer = buf; src.connect(audioCtx.destination); src.start()
    src.onended = () => setPreviewing(false)
    srcRef.current = src; setPreviewing(true)
  }
  useEffect(() => () => { try { srcRef.current?.stop() } catch {} }, [])

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, clip)}
      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 cursor-grab active:cursor-grabbing select-none transition group"
    >
      <span className="text-base">🎤</span>
      <span className="text-xs text-gray-300 truncate flex-1 min-w-0" title={clip.name}>{clip.name}</span>
      <span className="text-[10px] text-gray-600 shrink-0">{(clip.length / clip.sampleRate).toFixed(1)}s</span>
      <button onClick={preview} className={`text-xs transition shrink-0 ${previewing ? 'text-purple-400' : 'text-gray-500 hover:text-white'}`} title="Preview">
        {previewing ? '⏹' : '▶'}
      </button>
      <button onClick={() => onDelete(clip.id)} className="text-[10px] text-gray-600 hover:text-red-400 transition shrink-0" title="Delete">✕</button>
      <span className="text-[10px] text-gray-600 shrink-0 hidden group-hover:block">drag →</span>
    </div>
  )
}

// ─── Main recorder component ─────────────────────────────────────────────────
export default function VocalRecorder({ onClipsChange }) {
  const [state, setState]         = useState('idle') // idle | requesting | recording | review | saving
  const [error, setError]         = useState('')
  const [clipName, setClipName]   = useState('')
  const [savedClips, setSaved]    = useState([])
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd,   setTrimEnd]   = useState(1)
  const [open, setOpen]           = useState(false)

  const mediaRef    = useRef(null) // MediaRecorder
  const chunksRef   = useRef([])
  const rawBufRef   = useRef(null) // decoded full recording
  const canvasRef   = useRef(null)
  const trimDrag    = useRef(null) // 'start' | 'end' | null
  const audioCtxRef = useRef(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = getContext()
    return audioCtxRef.current
  }

  // Load saved clips from IndexedDB on mount.
  useEffect(() => {
    loadAllClips().then(clips => { setSaved(clips); onClipsChange?.(clips) }).catch(() => {})
  }, [])

  // Redraw waveform when trim handles move.
  useEffect(() => {
    drawWave(canvasRef.current, rawBufRef.current, trimStart, trimEnd)
  }, [trimStart, trimEnd])

  // ── Record ─────────────────────────────────────────────────────────────────
  async function startRecording() {
    setError(''); setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const ab   = await blob.arrayBuffer()
        const ctx  = getAudioCtx()
        const buf  = await ctx.decodeAudioData(ab)
        rawBufRef.current = buf
        setTrimStart(0); setTrimEnd(1)
        setClipName(`Vocal ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
        setState('review')
        setTimeout(() => drawWave(canvasRef.current, buf, 0, 1), 30)
      }
      mr.start(); mediaRef.current = mr; setState('recording')
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Microphone access denied — allow mic in your browser settings.' : err.message)
      setState('idle')
    }
  }

  function stopRecording() {
    mediaRef.current?.stop(); setState('reviewing')
  }

  // ── Trim drag on canvas ───────────────────────────────────────────────────
  function onCanvasPointerDown(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const dStart = Math.abs(x - trimStart)
    const dEnd   = Math.abs(x - trimEnd)
    trimDrag.current = dStart < dEnd ? 'start' : 'end'
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onCanvasPointerMove(e) {
    if (!trimDrag.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (trimDrag.current === 'start') setTrimStart(Math.min(x, trimEnd - 0.01))
    else                               setTrimEnd(Math.max(x, trimStart + 0.01))
  }
  function onCanvasPointerUp() { trimDrag.current = null }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save() {
    if (!rawBufRef.current) return
    setState('saving')
    try {
      const ctx     = getAudioCtx()
      const trimmed = trimBuffer(ctx, rawBufRef.current, trimStart, trimEnd)
      await saveClip(clipName || 'Vocal', trimmed)
      const clips = await loadAllClips()
      setSaved(clips); onClipsChange?.(clips)
      setState('idle'); rawBufRef.current = null
    } catch (err) {
      setError('Could not save: ' + err.message); setState('review')
    }
  }

  function discard() { rawBufRef.current = null; setState('idle') }

  async function handleDelete(id) {
    await deleteClip(id)
    const clips = await loadAllClips()
    setSaved(clips); onClipsChange?.(clips)
  }

  function onDragStart(e, clip) {
    e.dataTransfer.setData('looplab/vocal-clip', JSON.stringify({ id: clip.id, name: clip.name }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const dur = rawBufRef.current ? rawBufRef.current.duration : 0
  const trimmedDur = dur * (trimEnd - trimStart)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden mt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎤</span>
          <span className="text-sm font-semibold text-white">Your Vocals</span>
          {savedClips.length > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">{savedClips.length} clip{savedClips.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <span className="text-gray-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-white/10">
          <p className="text-xs text-gray-500 mt-3 mb-4 leading-relaxed">
            Record your voice, trim it, save it — then drag any saved clip onto the <strong className="text-gray-300">Your Vocals</strong> row in the arrangement above.
          </p>

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          {/* Controls */}
          {state === 'idle' && (
            <button onClick={startRecording} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" /> Record
            </button>
          )}
          {state === 'requesting' && <p className="text-xs text-gray-400 animate-pulse">Requesting microphone…</p>}
          {state === 'recording' && (
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs text-red-400 font-semibold animate-pulse">Recording…</span>
              <button onClick={stopRecording} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold text-white transition">Stop</button>
            </div>
          )}

          {/* Review / trim */}
          {state === 'review' && rawBufRef.current && (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-black/40" style={{ height: 72 }}>
                <canvas
                  ref={canvasRef} width={600} height={72}
                  className="w-full h-full block cursor-ew-resize"
                  onPointerDown={onCanvasPointerDown}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={onCanvasPointerUp}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span>Drag white handles to trim</span>
                <span>{trimmedDur.toFixed(2)}s selected of {dur.toFixed(2)}s total</span>
              </div>
              <input
                type="text" value={clipName} onChange={e => setClipName(e.target.value)}
                placeholder="Name this clip…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition"
              />
              <div className="flex gap-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white transition">
                  {state === 'saving' ? 'Saving…' : 'Save clip'}
                </button>
                <button onClick={discard} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 transition">Discard</button>
              </div>
            </div>
          )}

          {/* Saved clips library */}
          {savedClips.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">Saved clips — drag onto the Vocals row</p>
              {savedClips.map(clip => (
                <ClipPill key={clip.id} clip={clip} audioCtx={getContext()} onDelete={handleDelete} onDragStart={onDragStart} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
