import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { usePlayer } from '../audio/usePlayer'
import { voiceFor } from '../audio/player'
import { patternClip } from '../audio/arrangementClip'
import { deserialise } from '../audio/vocalStore'
import { getContext } from '../audio/synth'
import PlayButton from './PlayButton'

const LABEL_W = 220
const BAR_W   = 60       // px per bar — wide enough to read pattern names
const BAR_OPTIONS = [8, 16, 24, 32, 48, 64]

const VOICE_COLOR = {
  kick: '#f97316', snare: '#ef4444', clap: '#ef4444', perc: '#84cc16',
  hat: '#eab308', bass: '#a855f7', reese: '#8b5cf6', donk: '#d946ef',
  piano: '#3b82f6', chord: '#3b82f6', supersaw: '#06b6d4', pluck: '#06b6d4',
  eight08: '#a855f7', vox: '#ec4899', break: '#f97316',
}

function useLanes(parts) {
  return useMemo(() => parts
    .map(p => ({
      name:     p.name,
      icon:     p.icon,
      voice:    voiceFor(p.name),
      patterns: (p.patterns || []).filter(pt => pt.type !== 'structure'),
    }))
    .filter(l => l.patterns.length > 0),
  [parts])
}

const VOCAL_LANE = 'Your Vocals'

export default function CustomArrangement({ parts, genreId, accentClass, bpm, savedVocalClips = [] }) {
  const lanes = useLanes(parts)

  const [bars,   setBars]   = useState(32)
  // grid[partName][barIndex] = patternIndex (number)
  const [grid,   setGrid]   = useState({})
  // vocalGrid[barIndex] = clipId string
  const [vocalGrid, setVocalGrid] = useState({})
  // armedVocal = clipId string | null
  const [armedVocal, setArmedVocal] = useState(null)
  // armed = { part, idx } — pattern currently selected for paint; null = none
  const [armed,  setArmed]  = useState(null)
  const [frac,   setFrac]   = useState(null)
  const [follow, setFollow] = useState(true)

  const scrollRef       = useRef(null)
  const gridRef         = useRef({})
  const mutedRef        = useRef({})
  const gainsRef        = useRef({})
  const vocalBuffersRef = useRef({}) // clipId -> AudioBuffer
  const [volumes, setVolumes] = useState({}) // laneName -> volume
  // paintRef tracks an in-progress left-button drag across bars:
  //   { laneName, idx, mode: 'place'|'erase', painted: Set<bar> }
  const paintRef  = useRef(null)

  const { playing, start, stop, getPosition } = usePlayer(`custom-${genreId}`)
  const tracks = useMemo(() => [
    ...lanes.map(l => ({ name: l.name, voice: l.voice })),
    { name: VOCAL_LANE, voice: 'vox' },
  ], [lanes])

  // Pre-decode vocal AudioBuffers whenever savedVocalClips changes.
  useEffect(() => {
    const ctx = getContext()
    savedVocalClips.forEach(clip => {
      if (!vocalBuffersRef.current[clip.id]) {
        vocalBuffersRef.current[clip.id] = deserialise(ctx, clip)
      }
    })
  }, [savedVocalClips])

  // ---- compile grid → live clips read by the audio engine every step ----
  useEffect(() => {
    const compiled = {}
    lanes.forEach(lane => {
      const placed = grid[lane.name] || {}
      const barClips = new Array(bars).fill(null)
      Object.keys(placed).forEach(barStr => {
        const bar = Number(barStr)
        const idx = placed[barStr]
        const pat = lane.patterns[idx]
        if (pat && bar < bars) barClips[bar] = patternClip(lane.voice, pat)
      })
      compiled[lane.name] = barClips
    })
    // Vocal lane: each bar gets a 16-step clip with vocalBuffer at step 0.
    const vocalBarClips = new Array(bars).fill(null)
    Object.keys(vocalGrid).forEach(barStr => {
      const bar = Number(barStr)
      const id = vocalGrid[barStr]
      if (id && bar < bars) {
        const clip16 = new Array(16).fill(null)
        clip16[0] = { vocalBuffer: vocalBuffersRef.current[id] || null, level: 0.8 }
        vocalBarClips[bar] = clip16
      }
    })
    compiled[VOCAL_LANE] = vocalBarClips
    gridRef.current = compiled
  }, [grid, vocalGrid, lanes, bars])

  // ---- grid mutations ----
  const place = useCallback((partName, bar, idx) => {
    setGrid(g => ({ ...g, [partName]: { ...(g[partName] || {}), [bar]: idx } }))
  }, [])

  const erase = useCallback((partName, bar) => {
    setGrid(g => {
      const lane = { ...(g[partName] || {}) }
      delete lane[bar]
      return { ...g, [partName]: lane }
    })
  }, [])

  // ---- paint-drag handlers on each bar cell ----
  const onCellMouseDown = (lane, bar, e) => {
    if (e.button === 2) return  // right-click handled by onContextMenu
    e.preventDefault()
    if (armed && armed.part === lane.name) {
      // Armed pattern: start a paint drag
      paintRef.current = { laneName: lane.name, idx: armed.idx, mode: 'place', painted: new Set([bar]) }
      place(lane.name, bar, armed.idx)
    } else {
      // No armed pattern: erase-drag over filled cells
      const existing = (grid[lane.name] || {})[bar]
      if (existing != null) {
        paintRef.current = { laneName: lane.name, idx: null, mode: 'erase', painted: new Set([bar]) }
        erase(lane.name, bar)
      }
    }
  }

  const onCellMouseEnter = (lane, bar) => {
    const p = paintRef.current
    if (!p || p.laneName !== lane.name || p.painted.has(bar)) return
    p.painted.add(bar)
    if (p.mode === 'place') place(lane.name, bar, p.idx)
    else                    erase(lane.name, bar)
  }

  const onContextMenu = (lane, bar, e) => {
    e.preventDefault()
    erase(lane.name, bar)
    // Also start an erase drag so you can right-drag across multiple bars
    paintRef.current = { laneName: lane.name, idx: null, mode: 'erase', painted: new Set([bar]) }
  }

  // Drop from the draggable chip paints the bar and arms the pattern
  const onDrop = (lane, bar, e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/looplab') || e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const { part, idx } = JSON.parse(raw)
      if (part === lane.name) {
        place(lane.name, bar, idx)
        setArmed({ part: lane.name, idx })
      }
    } catch { /* malformed */ }
  }

  // Release drag on any element ends the paint stroke
  useEffect(() => {
    const up = () => { paintRef.current = null }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  // Keep the live gains ref in sync for the audio scheduler.
  useEffect(() => { gainsRef.current = volumes }, [volumes])

  // Small per-lane volume fader, shared by pattern lanes and the vocal lane.
  const VolumeFader = ({ name }) => (
    <div className="flex items-center gap-1" title={`Volume: ${Math.round((volumes[name] ?? 1) * 100)}%`}>
      <span className="text-[9px] text-gray-600">🔊</span>
      <input
        type="range"
        min={0} max={1.5} step={0.05}
        value={volumes[name] ?? 1}
        onChange={e => setVolumes(v => ({ ...v, [name]: Number(e.target.value) }))}
        className="w-full h-1 accent-purple-500 cursor-pointer"
        aria-label={`${name} volume`}
      />
    </div>
  )

  // ---- playback ----
  const play = () => start('custom', { tracks, bars, bpm, gridRef, mutedRef, gainsRef, snareAsClap: genreId === 'deep-house' })
  const onPlay = () => (playing ? stop() : play())

  // Smooth rAF playhead
  useEffect(() => {
    if (!playing) { setFrac(null); return }
    let raf
    const tick = () => { const p = getPosition(); if (p != null) setFrac(p); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, getPosition])

  // Auto-scroll when following
  useEffect(() => {
    if (!follow || frac == null || !scrollRef.current) return
    const el = scrollRef.current
    const x = LABEL_W + frac * bars * BAR_W
    const view = el.scrollLeft
    const w = el.clientWidth
    if (x < view + LABEL_W + 40 || x > view + w - 60)
      el.scrollTo({ left: Math.max(0, x - w / 2), behavior: 'smooth' })
  }, [frac, bars, follow])

  const timelineWidth = bars * BAR_W
  const hasAnything   = Object.values(grid).some(l => l && Object.keys(l).length > 0) || Object.keys(vocalGrid).length > 0
  const armedLane     = armed ? lanes.find(l => l.name === armed.part) : null
  const armedPatName  = armedLane?.patterns[armed?.idx]?.name
  const armedVocalMeta = armedVocal ? savedVocalClips.find(c => c.id === armedVocal) : null

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden select-none">

      {/* ---- Header ---- */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2 mr-auto">
          <span className="text-lg">🎛️</span>
          <span className="text-base font-semibold text-white">Build Your Own</span>
          <span className="text-xs text-gray-600 ml-1">{bars} bars · {bpm} BPM</span>
        </div>

        {/* Bar-count selector */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
          <span className="text-xs text-gray-500 mr-1.5">Bars:</span>
          {BAR_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setBars(n)}
              className={`text-xs w-8 py-0.5 rounded transition-colors ${
                bars === n ? 'bg-purple-500 text-white font-bold' : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
              }`}
            >{n}</button>
          ))}
        </div>

        {/* Follow toggle */}
        <button
          onClick={() => setFollow(f => !f)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            follow ? 'border-purple-500/50 bg-purple-500/15 text-purple-200' : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200'
          }`}
          title="Toggle auto-scroll to follow playhead"
        >
          {follow ? '🔒 Following' : '🔓 Free scroll'}
        </button>

        <button
          onClick={() => { setGrid({}); setVocalGrid({}); setArmed(null); setArmedVocal(null) }}
          className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
        >Clear</button>

        <PlayButton playing={playing} onClick={onPlay} accentClass={accentClass} label="Play mine" />
      </div>

      {/* ---- Timeline ---- */}
      <div ref={scrollRef} className="overflow-x-auto looplab-scroll">
        <div className="relative" style={{ minWidth: LABEL_W + timelineWidth }}>

          {/* Bar ruler */}
          <div className="flex border-b border-white/10 bg-white/[0.04]">
            <div
              className="shrink-0 px-4 py-2 text-xs text-gray-500 border-r border-white/10 font-semibold uppercase tracking-wider"
              style={{ width: LABEL_W }}
            >
              Part · patterns
            </div>
            <div className="flex" style={{ width: timelineWidth }}>
              {Array.from({ length: bars }).map((_, b) => (
                <div
                  key={b}
                  className={`shrink-0 border-r text-center py-2 text-[11px] font-mono ${
                    b % 4 === 0 ? 'border-white/20 text-gray-300 bg-white/[0.03]' : 'border-white/5 text-gray-600'
                  }`}
                  style={{ width: BAR_W }}
                >
                  {b % 4 === 0 ? b + 1 : '·'}
                </div>
              ))}
            </div>
          </div>

          {/* Lanes */}
          {lanes.map(lane => {
            const color  = VOICE_COLOR[lane.voice] || '#a855f7'
            const placed = grid[lane.name] || {}
            const isArmedLane = armed?.part === lane.name

            return (
              <div key={lane.name} className="flex border-b border-white/5">

                {/* Label + pattern chips */}
                <div
                  className="shrink-0 flex flex-col justify-center gap-1.5 px-3 py-2 border-r border-white/10 bg-black/25"
                  style={{ width: LABEL_W }}
                >
                  <span className="text-xs text-gray-200 font-semibold truncate">{lane.icon} {lane.name}</span>
                  <VolumeFader name={lane.name} />
                  <div className="flex flex-wrap gap-1">
                    {lane.patterns.map((pat, idx) => {
                      const isArmed = isArmedLane && armed.idx === idx
                      return (
                        <button
                          key={idx}
                          draggable
                          onDragStart={e => {
                            const payload = JSON.stringify({ part: lane.name, idx })
                            e.dataTransfer.setData('application/looplab', payload)
                            e.dataTransfer.setData('text/plain', payload)
                            e.dataTransfer.effectAllowed = 'copy'
                            setArmed({ part: lane.name, idx })
                            setArmedVocal(null)
                          }}
                          onClick={() => { setArmed(isArmed ? null : { part: lane.name, idx }); setArmedVocal(null) }}
                          title={isArmed
                            ? 'Click to disarm · click/drag across bars to paint'
                            : 'Click to arm (then paint bars) · or drag me'}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-all cursor-grab active:cursor-grabbing ${
                            isArmed ? 'font-bold ring-1 ring-white/50 text-black' : 'text-gray-300 hover:brightness-150'
                          }`}
                          style={isArmed
                            ? { background: color, borderColor: color }
                            : { borderColor: color + '66', background: color + '18' }}
                        >
                          {pat.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bar cells */}
                <div className="flex" style={{ width: timelineWidth }}>
                  {Array.from({ length: bars }).map((_, b) => {
                    const idx    = placed[b]
                    const filled = idx != null
                    const pat    = filled ? lane.patterns[idx] : null
                    return (
                      <div
                        key={b}
                        onMouseDown={e => onCellMouseDown(lane, b, e)}
                        onMouseEnter={() => onCellMouseEnter(lane, b)}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                        onDrop={e => onDrop(lane, b, e)}
                        onContextMenu={e => onContextMenu(lane, b, e)}
                        title={filled ? `${pat.name} — right-click to erase` : isArmedLane ? `Click or drag to place "${armedPatName}"` : 'Arm a pattern chip first'}
                        className={`shrink-0 border-r h-14 flex items-center justify-center px-0.5 transition-colors ${
                          b % 4 === 0 ? 'border-white/10' : 'border-white/[0.04]'
                        } ${isArmedLane ? 'cursor-cell' : filled ? 'cursor-pointer' : 'cursor-default'}`}
                        style={{
                          width: BAR_W,
                          background: filled
                            ? color + '2e'
                            : isArmedLane ? color + '08' : 'transparent',
                          boxShadow: filled ? `inset 0 0 0 1px ${color}88` : 'none',
                        }}
                      >
                        {filled && (
                          <span className="text-[9px] leading-tight text-center text-white/80 line-clamp-2 pointer-events-none break-words">
                            {pat.name}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* ── Your Vocals lane ── */}
          {savedVocalClips.length > 0 && (
            <div className="flex border-b border-white/5">
              {/* Label + clip chips */}
              <div
                className="shrink-0 flex flex-col justify-center gap-1.5 px-3 py-2 border-r border-white/10 bg-black/25"
                style={{ width: LABEL_W }}
              >
                <span className="text-xs text-gray-200 font-semibold truncate">🎤 Your Vocals</span>
                <VolumeFader name={VOCAL_LANE} />
                <div className="flex flex-wrap gap-1">
                  {savedVocalClips.map(clip => {
                    const isArmed = armedVocal === clip.id
                    return (
                      <button
                        key={clip.id}
                        draggable
                        onDragStart={e => {
                          const payload = JSON.stringify({ vocalId: clip.id })
                          e.dataTransfer.setData('application/looplab-vocal', payload)
                          e.dataTransfer.effectAllowed = 'copy'
                          setArmedVocal(clip.id)
                          setArmed(null)
                        }}
                        onClick={() => { setArmedVocal(isArmed ? null : clip.id); setArmed(null) }}
                        title={isArmed ? 'Click to disarm · click/drag across bars to paint' : 'Click to arm, then paint bars'}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-all cursor-grab active:cursor-grabbing ${
                          isArmed ? 'font-bold ring-1 ring-white/50 text-black' : 'text-gray-300 hover:brightness-150'
                        }`}
                        style={isArmed
                          ? { background: '#a855f7', borderColor: '#a855f7' }
                          : { borderColor: '#a855f766', background: '#a855f718' }}
                      >
                        {clip.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Bar cells */}
              <div className="flex" style={{ width: timelineWidth }}>
                {Array.from({ length: bars }).map((_, b) => {
                  const clipId  = vocalGrid[b]
                  const filled  = clipId != null
                  const meta    = filled ? savedVocalClips.find(c => c.id === clipId) : null
                  return (
                    <div
                      key={b}
                      onMouseDown={e => {
                        if (e.button === 2) return
                        e.preventDefault()
                        if (armedVocal) {
                          paintRef.current = { laneName: VOCAL_LANE, idx: armedVocal, mode: 'place', painted: new Set([b]) }
                          setVocalGrid(g => ({ ...g, [b]: armedVocal }))
                        } else if (filled) {
                          paintRef.current = { laneName: VOCAL_LANE, idx: null, mode: 'erase', painted: new Set([b]) }
                          setVocalGrid(g => { const n = { ...g }; delete n[b]; return n })
                        }
                      }}
                      onMouseEnter={() => {
                        const p = paintRef.current
                        if (!p || p.laneName !== VOCAL_LANE || p.painted.has(b)) return
                        p.painted.add(b)
                        if (p.mode === 'place') setVocalGrid(g => ({ ...g, [b]: p.idx }))
                        else setVocalGrid(g => { const n = { ...g }; delete n[b]; return n })
                      }}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                      onDrop={e => {
                        e.preventDefault()
                        const raw = e.dataTransfer.getData('application/looplab-vocal')
                        if (!raw) return
                        try {
                          const { vocalId } = JSON.parse(raw)
                          setVocalGrid(g => ({ ...g, [b]: vocalId }))
                          setArmedVocal(vocalId)
                        } catch {}
                      }}
                      onContextMenu={e => {
                        e.preventDefault()
                        setVocalGrid(g => { const n = { ...g }; delete n[b]; return n })
                        paintRef.current = { laneName: VOCAL_LANE, idx: null, mode: 'erase', painted: new Set([b]) }
                      }}
                      title={filled ? `${meta?.name || 'Vocal'} — right-click to erase` : armedVocal ? 'Click to place vocal clip' : 'Arm a clip first'}
                      className={`shrink-0 border-r h-14 flex items-center justify-center px-0.5 transition-colors ${
                        b % 4 === 0 ? 'border-white/10' : 'border-white/[0.04]'
                      } ${armedVocal ? 'cursor-cell' : filled ? 'cursor-pointer' : 'cursor-default'}`}
                      style={{
                        width: BAR_W,
                        background: filled ? '#a855f72e' : armedVocal ? '#a855f708' : 'transparent',
                        boxShadow: filled ? 'inset 0 0 0 1px #a855f788' : 'none',
                      }}
                    >
                      {filled && (
                        <span className="text-[9px] leading-tight text-center text-white/80 line-clamp-2 pointer-events-none break-words">
                          {meta?.name || '🎤'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Playhead */}
          {frac != null && (
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: LABEL_W, width: timelineWidth }}>
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{ left: `${frac * 100}%` }}
              >
                <div className="absolute -top-0.5 -left-[3px] w-2 h-2 rotate-45 bg-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 border-t border-white/5 text-xs min-h-[2.5rem]">
        {armed ? (
          <span style={{ color: VOICE_COLOR[armedLane?.voice] || '#a855f7' }}>
            ✏️ <strong>{armedPatName}</strong> armed on {armed.part} — click or drag across bars to paint · right-click to erase · click the chip again to disarm
          </span>
        ) : armedVocal ? (
          <span style={{ color: '#a855f7' }}>
            🎤 <strong>{armedVocalMeta?.name || 'Vocal'}</strong> armed — click or drag across bars to paint · right-click to erase · click the chip again to disarm
          </span>
        ) : hasAnything ? (
          <span className="text-gray-600">Click a chip to arm it and paint bars · drag chips · right-click a bar to erase · press <strong className="text-gray-400">Play mine</strong> to hear it.</span>
        ) : (
          <span className="text-gray-700">Click a coloured pattern chip to arm it, then click or click-drag across the bars in that row to fill them.</span>
        )}
      </div>
    </div>
  )
}
