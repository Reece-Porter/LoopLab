import { useState, useRef, useEffect, useMemo } from 'react'
import { usePlayer } from '../audio/usePlayer'
import { voiceFor } from '../audio/player'
import { buildTrackClip } from '../audio/arrangementClip'
import PlayButton from './PlayButton'

const LABEL_W = 176 // px — width of the track-name column
const PX_PER_BAR = 26 // px — horizontal zoom of the timeline

// Normalise a track name for matching arrangement tracks to part definitions.
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '')

// Piano-roll style preview drawn on a canvas: the 16-step clip is tiled once
// per bar across the whole section, so you see every individual note exactly
// where it sounds — like clips in the FL Studio playlist. Each slot is an
// event with a `level` (0..1 height) or null (rest).
function ClipPreview({ clip, color, bars }) {
  const ref = useRef(null)
  useEffect(() => {
    try {
      const canvas = ref.current
      if (!canvas) return
      const cols = Math.max(16, bars * 16)
      const H = 48
      canvas.width = cols
      canvas.height = H
      const c = canvas.getContext('2d')
      if (!c) return
      c.clearRect(0, 0, cols, H)
      c.fillStyle = color
      for (let b = 0; b < bars; b++) {
        for (let i = 0; i < 16; i++) {
          const evt = clip[i]
          if (!evt) continue
          const lvl = evt.level || 0.6
          const x = b * 16 + i
          const h = Math.max(3, lvl * (H - 4))
          c.fillRect(x + 0.12, H - h - 2, 0.76, h)
        }
        // faint bar divider
        if (b > 0) {
          c.fillStyle = 'rgba(255,255,255,0.10)'
          c.fillRect(b * 16, 0, 0.4, H)
          c.fillStyle = color
        }
      }
    } catch { /* canvas unavailable — preview is decorative, skip silently */ }
  }, [clip, color, bars])
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'pixelated', opacity: 0.92 }}
    />
  )
}

export default function ArrangementView({ arrangement, accentClass, bpm, genreId, parts = [] }) {
  const [hidden, setHidden] = useState({})
  const [selection, setSelection] = useState({}) // trackName -> 'groove' | patternIndex
  const { playing, start, stop, getPosition } = usePlayer('arrangement')
  const scrollRef = useRef(null)
  const seekRef = useRef(null)
  const clipsRef = useRef({})  // live: trackName -> clip16
  const mutedRef = useRef({})  // live: trackName -> true
  const [frac, setFrac] = useState(null) // smooth playhead 0..1
  const [startBar, setStartBar] = useState(0) // where playback begins
  const [follow, setFollow] = useState(true) // auto-scroll to track the playhead

  const toggleTrack = name => setHidden(h => ({ ...h, [name]: !h[name] }))

  const totalBars = arrangement.sections.reduce((sum, s) => sum + s.bars, 0)

  const timelineWidth = Math.max(584, totalBars * PX_PER_BAR)

  // Static lineup the player walks (name + voice + per-section on/off).
  const lineup = useMemo(
    () => arrangement.tracks.map(t => ({ name: t.name, voice: voiceFor(t.name), sections: t.sections })),
    [arrangement.tracks],
  )

  // For each track, the matching part (for its selectable example patterns).
  const partFor = useMemo(() => {
    const map = {}
    arrangement.tracks.forEach(t => {
      const p = parts.find(p => norm(p.name) === norm(t.name))
      map[t.name] = p && p.patterns ? p.patterns.filter(pt => pt.type !== 'structure') : []
    })
    return map
  }, [arrangement.tracks, parts])

  // Bar at the start of each section, for highlighting the live section.
  const sectionStartBars = useMemo(() => {
    let acc = 0
    return arrangement.sections.map(s => { const b = acc; acc += s.bars; return b })
  }, [arrangement.sections])

  // Build a clip per track from its current selection ('groove' or a pattern).
  const clips = useMemo(() => {
    const map = {}
    arrangement.tracks.forEach(t => {
      const v = voiceFor(t.name)
      const sel = selection[t.name]
      const options = partFor[t.name]
      const source = (sel != null && sel !== 'groove' && options[sel])
        ? { type: 'pattern', pattern: options[sel] }
        : { type: 'groove', genreId }
      map[t.name] = buildTrackClip(v, source)
    })
    return map
  }, [arrangement.tracks, selection, partFor, genreId])

  // Keep the live refs the audio scheduler reads in sync with React state.
  useEffect(() => { clipsRef.current = clips }, [clips])
  useEffect(() => {
    const m = {}
    Object.keys(hidden).forEach(k => { if (hidden[k]) m[k] = true })
    mutedRef.current = m
  }, [hidden])

  const play = (fromBar = startBar) =>
    start('arrangement', { genreId, arrangement, tracks: lineup, startStep: fromBar * 16, clipsRef, mutedRef, bpm })

  const onPlay = () => (playing ? stop() : play())

  // Seek: click anywhere on the timeline to set / jump to a start point.
  const onSeek = e => {
    const rect = seekRef.current.getBoundingClientRect()
    const f = Math.min(0.999, Math.max(0, (e.clientX - rect.left) / rect.width))
    const bar = Math.floor(f * totalBars)
    setStartBar(bar)
    if (playing) play(bar)
  }

  // Drive a smooth, audio-clock-accurate playhead via requestAnimationFrame.
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

  const currentBar = frac != null ? Math.floor(frac * totalBars) : -1
  let liveSection = -1
  if (currentBar >= 0) {
    for (let i = 0; i < sectionStartBars.length; i++) {
      if (sectionStartBars[i] <= currentBar) liveSection = i
    }
  }

  // Auto-scroll to keep the playhead in view (only when "follow" is on).
  useEffect(() => {
    if (!follow || frac == null || !scrollRef.current) return
    const el = scrollRef.current
    const x = LABEL_W + frac * timelineWidth
    const view = el.scrollLeft
    const w = el.clientWidth
    if (x < view + LABEL_W + 40 || x > view + w - 60) {
      el.scrollTo({ left: Math.max(0, x - w / 2), behavior: 'smooth' })
    }
  }, [frac, timelineWidth, follow])

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎼</span>
          <div>
            <span className="text-base font-semibold text-white">Arrangement</span>
            <span className="text-xs text-gray-600 ml-2">
              {totalBars} bars · plays at {bpm} BPM
              {currentBar >= 0
                ? <span className="text-purple-300 ml-2">▸ bar {currentBar + 1}</span>
                : <span className="text-cyan-300/80 ml-2">start: bar {startBar + 1}</span>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFollow(f => !f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              follow
                ? 'border-purple-500/50 bg-purple-500/15 text-purple-200'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200'
            }`}
            title="When on, the view scrolls to follow the playhead. Turn off to scroll/edit freely while it plays."
          >
            {follow ? '🔒 Following' : '🔓 Free scroll'}
          </button>
          <PlayButton playing={playing} onClick={onPlay} accentClass={accentClass} label="Play arrangement" />
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto looplab-scroll">
        <div className="relative" style={{ minWidth: LABEL_W + timelineWidth }}>

          {/* Section ruler */}
          <div className="flex border-b border-white/10 bg-white/5">
            <div
              className="shrink-0 px-4 py-2.5 text-xs text-gray-500 border-r border-white/10 font-semibold uppercase tracking-wider"
              style={{ width: LABEL_W }}
            >
              Track
            </div>
            <div className="flex" style={{ width: timelineWidth }}>
              {arrangement.sections.map((section, i) => {
                const live = i === liveSection
                return (
                  <div
                    key={i}
                    className={`border-r border-white/10 px-2 py-2.5 text-center overflow-hidden transition-colors ${live ? 'bg-white/10' : ''}`}
                    style={{ flex: section.bars }}
                  >
                    <div className={`text-xs font-semibold truncate ${live ? 'text-white' : 'text-gray-300'}`}>{section.name}</div>
                    <div className="text-[10px] text-gray-600">{section.bars} bars</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tracks */}
          {arrangement.tracks.map(track => {
            const isHidden = hidden[track.name]
            const clip = clips[track.name]
            const options = partFor[track.name] || []
            const sel = selection[track.name] ?? 'groove'
            return (
              <div key={track.name} className={`flex border-b border-white/5 group ${isHidden ? 'opacity-40' : ''}`}>
                <div
                  className="shrink-0 flex flex-col justify-center gap-1.5 px-3 py-2 border-r border-white/10"
                  style={{ width: LABEL_W }}
                >
                  <button
                    onClick={() => toggleTrack(track.name)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
                    title={isHidden ? 'Click to un-mute (start playing live)' : 'Click to mute (stop playing live)'}
                  >
                    <span
                      className="w-4 h-4 rounded-[3px] shrink-0 flex items-center justify-center text-[9px] text-black font-bold"
                      style={{ backgroundColor: isHidden ? 'transparent' : track.color, border: `1.5px solid ${track.color}` }}
                    >
                      {isHidden ? '' : '✓'}
                    </span>
                    <span className={`text-sm truncate ${isHidden ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                      {track.icon} {track.name}
                    </span>
                  </button>
                  {options.length > 0 && (
                    <select
                      value={sel}
                      onChange={e => {
                        const v = e.target.value === 'groove' ? 'groove' : Number(e.target.value)
                        setSelection(s => ({ ...s, [track.name]: v }))
                      }}
                      className="w-full bg-gray-900 border border-white/10 rounded px-1.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                      title="Choose which example pattern this track plays"
                    >
                      <option value="groove">Default groove</option>
                      {options.map((p, i) => (
                        <option key={i} value={i}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Pattern blocks with note previews */}
                <div className="flex py-2 px-1 gap-1 items-center bg-black/20" style={{ width: timelineWidth }}>
                  {arrangement.sections.map((section, i) => {
                    const on = !!track.sections[i]
                    const active = on && !isHidden
                    const hasNotes = clip.some(e => e)
                    return (
                      <div
                        key={i}
                        className="relative rounded h-12 border overflow-hidden"
                        style={{
                          flex: section.bars,
                          backgroundColor: active ? track.color + '22' : 'transparent',
                          borderColor: on ? track.color + '55' : 'rgba(255,255,255,0.04)',
                          opacity: on ? 1 : 0.25,
                        }}
                      >
                        {active && hasNotes && (
                          <ClipPreview clip={clip} color={track.color} bars={section.bars} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Bar counter */}
          <div className="flex border-t border-white/5 bg-black/20">
            <div className="shrink-0 border-r border-white/10 px-4 py-1.5 text-[10px] text-gray-700 uppercase tracking-wider" style={{ width: LABEL_W }}>Bar</div>
            <div className="flex" style={{ width: timelineWidth }}>
              {arrangement.sections.map((section, i) => {
                const barsBefore = arrangement.sections.slice(0, i).reduce((s, x) => s + x.bars, 0)
                return (
                  <div key={i} className="border-r border-white/5 px-2 py-1.5" style={{ flex: section.bars }}>
                    <span className="text-xs text-gray-600 font-mono">{barsBefore + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Click-to-seek layer (sits over the timeline, not the labels) */}
          <div
            ref={seekRef}
            onClick={onSeek}
            className="absolute top-0 bottom-0 cursor-pointer"
            style={{ left: LABEL_W, width: timelineWidth }}
            title="Click to set where playback starts"
          />

          {/* Start marker + playhead overlay (non-interactive) */}
          <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: LABEL_W, width: timelineWidth }}>
            {/* Start point marker */}
            <div
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-cyan-400/70"
              style={{ left: `${(startBar / totalBars) * 100}%` }}
            >
              <div className="absolute -top-0.5 -left-[5px] w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
            </div>
            {/* Playhead */}
            {frac != null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{ left: `${frac * 100}%` }}
              >
                <div className="absolute -top-0.5 -left-[3px] w-2 h-2 rotate-45 bg-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-white/5 flex gap-4 flex-wrap items-center">
        <span className="text-xs text-gray-600">Tick a track to mute/un-mute it live while playing · pick an example pattern per track from its dropdown · click the timeline to set where playback starts (cyan marker)</span>
        <button onClick={() => setHidden({})} className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto">Show all</button>
      </div>
    </div>
  )
}
