import { useState, useRef, useEffect, useMemo } from 'react'
import { usePlayer } from '../audio/usePlayer'
import { voiceFor } from '../audio/player'
import { patternClip } from '../audio/arrangementClip'
import PlayButton from './PlayButton'

const BARS = 8
const LABEL_W = 220
const BAR_W = 64

// A colour per voice role so each lane is visually distinct.
const VOICE_COLOR = {
  kick: '#f97316', snare: '#ef4444', clap: '#ef4444', perc: '#84cc16',
  hat: '#eab308', bass: '#a855f7', reese: '#8b5cf6', donk: '#d946ef',
  piano: '#3b82f6', chord: '#3b82f6', supersaw: '#06b6d4', pluck: '#06b6d4',
  eight08: '#a855f7', vox: '#ec4899', break: '#f97316',
}

// Build the list of lanes (one per part that has playable example patterns).
function useLanes(parts) {
  return useMemo(() => {
    return parts
      .map(p => ({
        name: p.name,
        icon: p.icon,
        voice: voiceFor(p.name),
        patterns: (p.patterns || []).filter(pt => pt.type !== 'structure'),
      }))
      .filter(l => l.patterns.length > 0)
  }, [parts])
}

export default function CustomArrangement({ parts, genreId, accentClass, bpm }) {
  const lanes = useLanes(parts)
  // grid[partName] = { [barIndex]: patternIndex }
  const [grid, setGrid] = useState({})
  const [armed, setArmed] = useState(null) // { part, idx } for click-to-place
  const [frac, setFrac] = useState(null)

  const { playing, start, stop, getPosition } = usePlayer(`custom-${genreId}`)
  const gridRef = useRef({})

  const tracks = useMemo(() => lanes.map(l => ({ name: l.name, voice: l.voice })), [lanes])

  // Compile the editable grid into live per-bar clips the player reads.
  useEffect(() => {
    const compiled = {}
    lanes.forEach(lane => {
      const placed = grid[lane.name] || {}
      const barClips = new Array(BARS).fill(null)
      Object.keys(placed).forEach(barStr => {
        const bar = Number(barStr)
        const idx = placed[barStr]
        const pat = lane.patterns[idx]
        if (pat && bar < BARS) barClips[bar] = patternClip(lane.voice, pat)
      })
      compiled[lane.name] = barClips
    })
    gridRef.current = compiled
  }, [grid, lanes])

  const timelineWidth = BARS * BAR_W

  const place = (partName, bar, idx) => {
    setGrid(g => ({ ...g, [partName]: { ...(g[partName] || {}), [bar]: idx } }))
  }
  const clearCell = (partName, bar) => {
    setGrid(g => {
      const lane = { ...(g[partName] || {}) }
      delete lane[bar]
      return { ...g, [partName]: lane }
    })
  }

  const onCellClick = (lane, bar) => {
    const placed = grid[lane.name] || {}
    if (armed && armed.part === lane.name) {
      place(lane.name, bar, armed.idx)
    } else if (placed[bar] != null) {
      clearCell(lane.name, bar)
    }
  }

  const onDrop = (lane, bar, e) => {
    e.preventDefault()
    const raw = e.dataTransfer.getData('application/looplab') || e.dataTransfer.getData('text/plain')
    if (!raw) return
    try {
      const { part, idx } = JSON.parse(raw)
      if (part === lane.name) place(lane.name, bar, idx)
    } catch { /* malformed drag payload — ignore */ }
  }

  const play = () => start('custom', {
    tracks, bars: BARS, bpm, gridRef,
    snareAsClap: genreId === 'deep-house',
  })
  const onPlay = () => (playing ? stop() : play())

  // Smooth playhead.
  useEffect(() => {
    if (!playing) { setFrac(null); return }
    let raf
    const tick = () => {
      const p = getPosition()
      if (p != null) setFrac(p)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, getPosition])

  const hasAnything = Object.values(grid).some(lane => lane && Object.keys(lane).length > 0)

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎛️</span>
          <div>
            <span className="text-base font-semibold text-white">Build Your Own</span>
            <span className="text-xs text-gray-600 ml-2">
              Drag a pattern (or click it, then click a bar) into the grid · {BARS} bars · {bpm} BPM
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setGrid({}); setArmed(null) }}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Clear
          </button>
          <PlayButton playing={playing} onClick={onPlay} accentClass={accentClass} label="Play mine" />
        </div>
      </div>

      <div className="overflow-x-auto looplab-scroll">
        <div className="relative" style={{ minWidth: LABEL_W + timelineWidth }}>
          {/* Bar ruler */}
          <div className="flex border-b border-white/10 bg-white/5">
            <div className="shrink-0 px-4 py-2 text-xs text-gray-500 border-r border-white/10 font-semibold uppercase tracking-wider" style={{ width: LABEL_W }}>
              Part · patterns
            </div>
            <div className="flex" style={{ width: timelineWidth }}>
              {Array.from({ length: BARS }).map((_, b) => (
                <div key={b} className="border-r border-white/10 text-center py-2 text-[11px] text-gray-500 font-mono" style={{ width: BAR_W }}>
                  Bar {b + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Lanes */}
          {lanes.map(lane => {
            const color = VOICE_COLOR[lane.voice] || '#a855f7'
            const placed = grid[lane.name] || {}
            return (
              <div key={lane.name} className="flex border-b border-white/5">
                {/* Label + draggable pattern chips */}
                <div className="shrink-0 px-3 py-2 border-r border-white/10 flex flex-col gap-1.5" style={{ width: LABEL_W }}>
                  <span className="text-sm text-gray-200 truncate">{lane.icon} {lane.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {lane.patterns.map((pat, idx) => {
                      const isArmed = armed && armed.part === lane.name && armed.idx === idx
                      return (
                        <button
                          key={idx}
                          draggable
                          onDragStart={e => {
                            const payload = JSON.stringify({ part: lane.name, idx })
                            e.dataTransfer.setData('application/looplab', payload)
                            e.dataTransfer.setData('text/plain', payload)
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                          onClick={() => setArmed(isArmed ? null : { part: lane.name, idx })}
                          title="Drag me into a bar, or click me then click a bar"
                          className={`text-[10px] px-1.5 py-0.5 rounded border cursor-grab active:cursor-grabbing transition-colors ${
                            isArmed ? 'text-black font-semibold' : 'text-gray-300 hover:bg-white/10'
                          }`}
                          style={isArmed
                            ? { backgroundColor: color, borderColor: color }
                            : { borderColor: color + '66', backgroundColor: color + '14' }}
                        >
                          {pat.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Bar cells */}
                <div className="flex" style={{ width: timelineWidth }}>
                  {Array.from({ length: BARS }).map((_, b) => {
                    const idx = placed[b]
                    const filled = idx != null
                    const pat = filled ? lane.patterns[idx] : null
                    return (
                      <div
                        key={b}
                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
                        onDrop={e => onDrop(lane, b, e)}
                        onClick={() => onCellClick(lane, b)}
                        title={filled ? `${pat.name} — click to remove` : 'Drop or click to place a pattern'}
                        className="border-r border-white/5 h-14 flex items-center justify-center px-1 cursor-pointer transition-colors hover:bg-white/[0.04]"
                        style={{
                          width: BAR_W,
                          backgroundColor: filled ? color + '2e' : 'transparent',
                          boxShadow: filled ? `inset 0 0 0 1px ${color}88` : 'none',
                        }}
                      >
                        {filled && (
                          <span className="text-[9px] leading-tight text-center text-white/85 break-words line-clamp-3">
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

          {/* Playhead over the bar cells */}
          {frac != null && (
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: LABEL_W, width: timelineWidth }}>
              <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ left: `${frac * 100}%` }}>
                <div className="absolute -top-0.5 -left-[3px] w-2 h-2 rotate-45 bg-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-white/5 text-xs text-gray-600">
        {armed
          ? <span className="text-purple-300">Armed: “{armed.idx != null ? (lanes.find(l => l.name === armed.part)?.patterns[armed.idx]?.name) : ''}” — click bars in the {armed.part} row to place it, or click the chip again to disarm.</span>
          : hasAnything
            ? 'Press “Play mine” to hear your arrangement · click a filled bar to remove it.'
            : 'Drag the coloured pattern chips into the bars to start building your own beat.'}
      </div>
    </div>
  )
}
