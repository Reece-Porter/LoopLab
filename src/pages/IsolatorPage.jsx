import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContext } from '../audio/synth'
import { isolateVocalCentre, trimBuffer, encodeWav } from '../audio/vocalIsolate'
import { saveClip, loadAllClips, deleteClip, deserialise } from '../audio/vocalStore'
import { backendFetch, accessMessage } from '../lib/backend'
import { useSeo } from '../utils/useSeo'

// Draw a mono waveform with the selected [start..end] region highlighted and an
// optional playhead (head, a 0..1 fraction) showing the current play position.
function drawWave(canvas, buffer, start, end, head = null) {
  if (!canvas || !buffer) return
  const g = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  const data = buffer.getChannelData(0)
  const step = Math.max(1, Math.floor(data.length / W))
  g.clearRect(0, 0, W, H)
  g.fillStyle = '#0f0f1a'; g.fillRect(0, 0, W, H)
  const sx = Math.floor(start * W), ex = Math.ceil(end * W)
  for (let x = 0; x < W; x++) {
    let max = 0
    for (let s = 0; s < step; s++) { const v = Math.abs(data[x * step + s] || 0); if (v > max) max = v }
    const h = Math.max(1, max * (H - 4) * 0.92)
    g.fillStyle = (x >= sx && x < ex) ? '#c6f24e' : '#2d2d4a'
    g.fillRect(x, (H - h) / 2, 1, h)
  }
  g.fillStyle = 'rgba(0,0,0,0.45)'
  g.fillRect(0, 0, sx, H); g.fillRect(ex, 0, W - ex, H)
  g.fillStyle = '#fff'; g.fillRect(sx, 0, 2, H); g.fillRect(ex - 2, 0, 2, H)
  if (head != null) {
    const hx = Math.round(head * W)
    g.fillStyle = '#ff5db1'; g.fillRect(hx, 0, 2, H)   // playhead
  }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export default function IsolatorPage() {
  const navigate = useNavigate()
  useSeo('Vocal Isolator — LoopLab', 'Pull a rough vocal out of a track in your browser, chop it live, and save or download the chunks. Free, no upload.')

  const [name, setName] = useState('')        // source file name
  const [vocal, setVocal] = useState(null)    // isolated AudioBuffer
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sel, setSel] = useState({ a: 0, b: 1 }) // selection fractions
  const [playing, setPlaying] = useState(false)
  const [chunkName, setChunkName] = useState('')
  const [saved, setSaved] = useState([])
  const [aiState, setAiState] = useState('idle') // idle | uploading | processing | done | error
  const [aiError, setAiError] = useState('')
  const [aiProgress, setAiProgress] = useState(0) // 0..100 during separation
  const [aiEta, setAiEta] = useState(null)        // seconds remaining (estimate)
  const aiStartRef = useRef(0)
  const [hasFile, setHasFile] = useState(false)  // an uploadable File is loaded (vs a saved clip)

  const canvasRef = useRef(null)
  const srcRef = useRef(null)
  const dragRef = useRef(false)
  const fileRef = useRef(null)   // original File, for AI upload
  const pollRef = useRef(null)
  const viewRef = useRef({ buffer: null, a: 0, b: 1 }) // current draw state (avoids stale closures)
  const rafRef = useRef(null)
  const playRef = useRef(null)   // { start, a, b, dur } while a buffer is playing

  const ctx = getContext()

  const refreshSaved = useCallback(() => { loadAllClips().then(setSaved).catch(() => {}) }, [])
  useEffect(() => { refreshSaved() }, [refreshSaved])

  const redraw = useCallback((head = null) => {
    const v = viewRef.current
    drawWave(canvasRef.current, v.buffer, v.a, v.b, head)
  }, [])

  // Keep the draw state in sync and repaint (without a playhead) on any change.
  useEffect(() => {
    viewRef.current = { buffer: vocal, a: sel.a, b: sel.b }
    if (!playRef.current) redraw(null)
  }, [vocal, sel, redraw])

  const stop = useCallback(() => {
    if (srcRef.current) { try { srcRef.current.stop() } catch { /* already stopped */ } srcRef.current = null }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    playRef.current = null
    setPlaying(false)
    redraw(null)
  }, [redraw])
  useEffect(() => () => stop(), [stop])

  const cancelPoll = useCallback(() => { if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null } }, [])
  useEffect(() => () => cancelPoll(), [cancelPoll])

  async function onFile(file) {
    if (!file) return
    cancelPoll(); setAiState('idle'); setAiError('')
    fileRef.current = file; setHasFile(true)
    stop(); setError(''); setVocal(null); setBusy(true); setName(file.name.replace(/\.[^.]+$/, ''))
    try {
      const arr = await file.arrayBuffer()
      const decoded = await ctx.decodeAudioData(arr)
      const iso = await isolateVocalCentre(decoded)
      setVocal(iso); setSel({ a: 0, b: 1 }); setChunkName(file.name.replace(/\.[^.]+$/, '') + ' vocal')
    } catch (err) {
      setError('Could not read that file — try a WAV or MP3. (' + err.message + ')')
    } finally {
      setBusy(false)
    }
  }

  // Clean isolation via the Render backend (Demucs). Uploads the track, polls
  // the async job, then loads the returned vocal stem into the same chop UI.
  async function runAI() {
    const backend = (localStorage.getItem('looplab-backend') || '').replace(/\/$/, '')
    if (!backend) { setAiState('error'); setAiError('Add your audio-service URL on the DJ Deck first, then come back — the clean isolator runs on it.'); return }
    if (!fileRef.current) return
    // Match the server's length cap so we don't upload a track it will reject.
    if (vocal && vocal.length / vocal.sampleRate > 390) {
      setAiState('error'); setAiError('That track is too long for the clean isolator (limit ~6.5 min). Trim it first, or use the quick browser version.'); return
    }
    cancelPoll(); setAiError(''); setAiState('uploading')
    if (ctx.state === 'suspended') ctx.resume() // keep the clock moving for the ETA
    try {
      const fd = new FormData()
      fd.append('audio', fileRef.current)
      const res = await backendFetch(`${backend}/api/isolate`, { method: 'POST', body: fd })
      if (!res.ok) {
        const msg = accessMessage(res.status) || (await res.json().catch(() => ({}))).error || 'Upload failed.'
        setAiState('error'); setAiError(msg); return
      }
      const { jobId } = await res.json()
      setAiState('processing'); setAiProgress(0); setAiEta(null); aiStartRef.current = ctx.currentTime
      const poll = async () => {
        try {
          const sr = await backendFetch(`${backend}/api/isolate/${jobId}`)
          if (!sr.ok) { setAiState('error'); setAiError('Lost track of the job — try again.'); return }
          const st = await sr.json()
          if (st.state === 'processing') {
            const pct = Math.max(0, Math.min(99, st.progress || 0))
            setAiProgress(pct)
            const elapsed = ctx.currentTime - aiStartRef.current
            setAiEta(pct > 4 ? Math.max(1, Math.round(elapsed / (pct / 100) - elapsed)) : null)
            pollRef.current = setTimeout(poll, 2000); return
          }
          if (st.state !== 'done') { setAiState('error'); setAiError(st.error || 'Separation failed.'); return }
          const rr = await backendFetch(`${backend}/api/isolate/${jobId}/result`)
          if (!rr.ok) { setAiState('error'); setAiError('Could not fetch the result.'); return }
          const decoded = await ctx.decodeAudioData(await rr.arrayBuffer())
          stop(); setVocal(decoded); setSel({ a: 0, b: 1 }); setAiState('done')
        } catch (e) { setAiState('error'); setAiError(String(e.message || e)) }
      }
      poll()
    } catch (e) { setAiState('error'); setAiError(String(e.message || e)) }
  }

  function play(fromSel = true) {
    if (!vocal) return
    stop()
    const a = fromSel ? sel.a : 0, b = fromSel ? sel.b : 1
    const buf = fromSel ? trimBuffer(ctx, vocal, a, b) : vocal
    if (ctx.state === 'suspended') ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf; src.connect(ctx.destination); src.start()
    src.onended = () => stop()
    srcRef.current = src; setPlaying(true)
    // Animate the playhead across the played region.
    playRef.current = { start: ctx.currentTime, a, b, dur: buf.length / buf.sampleRate }
    const tick = () => {
      const p = playRef.current
      if (!p) return
      const elapsed = ctx.currentTime - p.start
      const head = p.a + Math.min(1, elapsed / p.dur) * (p.b - p.a)
      redraw(head)
      if (elapsed < p.dur) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  // Canvas selection by click-drag.
  function posFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  }
  function onDown(e) { dragRef.current = true; const p = posFromEvent(e); setSel({ a: p, b: p }) }
  function onMove(e) {
    if (!dragRef.current) return
    const p = posFromEvent(e)
    setSel(s => (p >= s.a ? { a: s.a, b: p } : { a: p, b: s.a }))
  }
  function onUp() { dragRef.current = false; setSel(s => (s.b - s.a < 0.005 ? { a: 0, b: 1 } : s)) }

  async function saveChunk() {
    if (!vocal) return
    const buf = trimBuffer(ctx, vocal, sel.a, sel.b)
    try { await saveClip(chunkName || 'Vocal', buf); refreshSaved() }
    catch (err) { setError('Could not save: ' + err.message) }
  }
  function downloadChunk() {
    if (!vocal) return
    download(encodeWav(trimBuffer(ctx, vocal, sel.a, sel.b)), (chunkName || 'vocal') + '.wav')
  }
  function downloadFull() {
    if (!vocal) return
    download(encodeWav(vocal), (name || 'vocal') + ' (isolated).wav')
  }

  // Load a saved clip into the player above so you can scrub/play/re-chop it.
  function openSaved(clip) {
    stop(); cancelPoll(); setAiState('idle'); setAiError(''); setError('')
    fileRef.current = null; setHasFile(false)
    setVocal(deserialise(ctx, clip)); setName(clip.name); setChunkName(clip.name); setSel({ a: 0, b: 1 })
    if (canvasRef.current) canvasRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const dur = vocal ? vocal.length / vocal.sampleRate : 0
  const selDur = dur * (sel.b - sel.a)

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="w-full max-w-4xl mx-auto px-5 sm:px-8 lg:px-12">
        <nav className="flex items-center justify-between py-5 border-b border-hairline">
          <button onClick={() => navigate('/')} className="flex items-center hover:opacity-80 transition-opacity duration-150">
            <img src={`${import.meta.env.BASE_URL}logo-wordmark.png`} alt="LoopLab" className="h-7 w-auto" />
          </button>
          <button onClick={() => navigate('/')} className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint hover:text-acid transition-colors duration-150">← Back</button>
        </nav>

        <div className="py-8 sm:py-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="w-1.5 h-1.5 bg-acid" />
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-dim">Vocal Isolator</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold uppercase tracking-tight leading-[0.9] mb-3">Isolate a vocal</h1>
          <p className="text-dim text-sm max-w-lg leading-relaxed">Drop in a track, pull a rough vocal out of it in your browser, then drag to select a section and chop it into chunks. Save them to your vocals or download as WAV.</p>
        </div>

        {/* Upload */}
        <label
          onDragOver={e => { e.preventDefault() }}
          onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
          className="block border border-dashed border-hairline hover:border-dim bg-surface p-8 text-center cursor-pointer transition-colors duration-150 mb-6"
        >
          <input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac" className="hidden" onChange={e => onFile(e.target.files[0])} />
          <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-dim">{busy ? 'Isolating…' : name ? `↻ ${name} — drop another to replace` : '↑ Drop an audio file or click to choose'}</p>
          <p className="text-faint text-[11px] mt-2">Stays on your device — nothing is uploaded. WAV, MP3, M4A, FLAC.</p>
        </label>

        {error && <p className="text-red-400 text-xs mb-6">{error}</p>}

        {/* Method: quick (browser, already shown) vs clean (AI on the backend) */}
        {hasFile && (
          <div className="border border-hairline bg-surface p-4 sm:p-5 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              {aiState === 'uploading' || aiState === 'processing' ? (
                <button disabled className="font-display font-semibold uppercase tracking-wide text-sm bg-surface-2 border border-hairline text-dim px-5 py-3 cursor-wait">
                  {aiState === 'uploading' ? '↑ Uploading…' : '✨ Separating…'}
                </button>
              ) : (
                <button onClick={runAI} className="font-display font-semibold uppercase tracking-wide text-sm bg-acid text-base px-5 py-3 hover:bg-acid-dim transition-colors duration-150">✨ Clean isolate (AI)</button>
              )}
              <span className="font-mono text-[11px] text-faint">
                {aiState === 'done' ? 'Clean AI vocal loaded ✓' : 'Loaded above is the quick browser version'}
              </span>
            </div>

            {/* Separation progress */}
            {aiState === 'processing' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">{aiProgress > 0 ? `Separating · ${aiProgress}%` : 'Loading model…'}</span>
                  <span className="font-mono text-[11px] text-faint">
                    {aiEta != null ? `~${aiEta >= 60 ? `${Math.floor(aiEta / 60)}m ${aiEta % 60}s` : `${aiEta}s`} left` : 'estimating…'}
                  </span>
                </div>
                <div className="h-2 bg-surface-2 border border-hairline overflow-hidden">
                  <div className="h-full bg-acid transition-[width] duration-500 ease-linear" style={{ width: `${Math.max(3, aiProgress)}%` }} />
                </div>
              </div>
            )}
            {aiState === 'uploading' && (
              <div className="mt-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim mb-1.5">Uploading track…</div>
                <div className="h-2 bg-surface-2 border border-hairline overflow-hidden">
                  <div className="h-full w-1/3 bg-acid/60 animate-pulse" />
                </div>
              </div>
            )}
            {aiError && <p className="text-red-400 text-xs mt-3">{aiError}</p>}
            <p className="text-faint text-[11px] leading-relaxed mt-3 max-w-xl">
              The <strong className="text-dim">quick</strong> version runs instantly in your browser (centred vocal + filter — leaks some drums/bass, stereo only, nothing uploaded). <strong className="text-dim">Clean isolate</strong> sends the track to your audio service and runs real AI separation — much cleaner, takes a minute or two, and the track is uploaded to your Render box to do it.
            </p>
          </div>
        )}

        {vocal && (
          <div className="border border-hairline bg-surface p-5 sm:p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-dim">Isolated vocal · {dur.toFixed(1)}s</span>
              <span className="font-mono text-[11px] text-faint">selection {selDur.toFixed(1)}s</span>
            </div>

            <canvas
              ref={canvasRef} width={900} height={140}
              className="w-full h-[110px] border border-hairline cursor-crosshair mb-4 touch-none"
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            />

            <div className="flex flex-wrap items-center gap-3 mb-4">
              {playing ? (
                <button onClick={stop} className="font-display font-semibold uppercase tracking-wide text-sm bg-surface-2 border border-hairline text-ink px-5 py-3">■ Stop</button>
              ) : (
                <button onClick={() => play(true)} className="font-display font-semibold uppercase tracking-wide text-sm bg-acid text-base px-5 py-3 hover:bg-acid-dim transition-colors duration-150">▶ Play selection</button>
              )}
              <button onClick={() => play(false)} className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint hover:text-acid transition-colors duration-150">▶ Play whole</button>
              <button onClick={() => setSel({ a: 0, b: 1 })} className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint hover:text-acid transition-colors duration-150">↺ Select all</button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={chunkName} onChange={e => setChunkName(e.target.value)} placeholder="Chunk name"
                className="flex-1 min-w-[140px] bg-surface-2 border border-hairline px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-dim outline-none"
              />
              <button onClick={saveChunk} className="font-display font-semibold uppercase tracking-wide text-sm bg-acid text-base px-4 py-2 hover:bg-acid-dim transition-colors duration-150">Save chunk</button>
              <button onClick={downloadChunk} className="font-display font-semibold uppercase tracking-wide text-sm border border-acid/50 text-acid px-4 py-2 hover:bg-acid hover:text-base transition-colors duration-150">↓ Chunk WAV</button>
              <button onClick={downloadFull} className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint hover:text-acid transition-colors duration-150 px-2 py-2">↓ Full vocal</button>
            </div>
          </div>
        )}

        {/* Saved chunks */}
        {saved.length > 0 && (
          <div className="mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint mb-3">Your vocals · {saved.length}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {saved.map(clip => (
                <SavedChunk key={clip.id} clip={clip} ctx={ctx} onOpen={() => openSaved(clip)} onDelete={async id => { await deleteClip(id); refreshSaved() }} />
              ))}
            </div>
            <p className="text-faint text-[11px] mt-3">Click a chunk's name to open it in the player above and scrub through it. Saved chunks also show up in the <strong className="text-dim">Your Vocals</strong> row on any genre page, ready to drop into an arrangement.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SavedChunk({ clip, ctx, onOpen, onDelete }) {
  const [previewing, setPreviewing] = useState(false)
  const srcRef = useRef(null)
  function preview() {
    if (previewing) { try { srcRef.current?.stop() } catch { /* gone */ } srcRef.current = null; setPreviewing(false); return }
    const src = ctx.createBufferSource()
    src.buffer = deserialise(ctx, clip); src.connect(ctx.destination); src.start()
    src.onended = () => setPreviewing(false)
    srcRef.current = src; setPreviewing(true)
  }
  function dl() { download(encodeWav(deserialise(ctx, clip)), clip.name + '.wav') }
  useEffect(() => () => { try { srcRef.current?.stop() } catch { /* gone */ } }, [])
  return (
    <div className="flex items-center gap-2 bg-surface border border-hairline px-3 py-2">
      <span className="text-base">🎤</span>
      <button onClick={onOpen} className="text-xs text-dim hover:text-acid truncate flex-1 min-w-0 text-left" title={`Open “${clip.name}” in the player`}>{clip.name}</button>
      <span className="text-[10px] text-faint shrink-0">{(clip.length / clip.sampleRate).toFixed(1)}s</span>
      <button onClick={preview} className={`text-xs shrink-0 ${previewing ? 'text-acid' : 'text-dim hover:text-white'}`} title="Quick preview">{previewing ? '⏹' : '▶'}</button>
      <button onClick={dl} className="text-[11px] text-faint hover:text-acid shrink-0" title="Download WAV">↓</button>
      <button onClick={() => onDelete(clip.id)} className="text-[10px] text-faint hover:text-red-400 shrink-0" title="Delete">✕</button>
    </div>
  )
}
