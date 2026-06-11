import { useState, useRef, useEffect, useMemo } from 'react'
import { usePlayer } from '../audio/usePlayer'
import { voiceFor } from '../audio/player'
import { grooveFor } from '../audio/grooves'
import { noteToFreq, chordToFreqs } from '../audio/theory'
import PlayButton from './PlayButton'

const LABEL_W = 176 // px — width of the track-name column
const PX_PER_BAR = 26 // px — horizontal zoom of the timeline

// Build a 16-step "clip" of note levels (0 = rest, 0..1 = pitch/intensity)
// so each block shows the actual rhythm and rough pitch of that track.
function buildClip(voice, pat) {
  const clip = new Array(16).fill(0)
  if (!pat) return clip
  // Drum voices: fixed intensity per voice.
  const drumLevel = { kick: 1, snare: 0.82, hat: 0.4, break: 0.9 }[voice]
  let hitOrder = 0
  for (let i = 0; i < 16; i++) {
    if (!pat.steps[i]) continue
    if (drumLevel != null && !pat.notes && !pat.chords) {
      clip[i] = drumLevel
    } else {
      let freq = null
      if (pat.notes) freq = noteToFreq(pat.notes[hitOrder % pat.notes.length])
      else if (pat.chords) { const f = chordToFreqs(pat.chords[hitOrder % pat.chords.length]); freq = f[0] }
      // Map ~D1(36Hz)..C6(1047Hz) onto 0.25..1 on a log scale.
      const level = freq ? 0.25 + 0.75 * Math.min(1, Math.max(0, (Math.log2(freq) - 5.2) / 5.2)) : 0.6
      clip[i] = level
      hitOrder++
    }
  }
  return clip
}

// Piano-roll style preview drawn on a canvas: the 16-step pattern is tiled
// once per bar across the whole section, so you see every individual note
// exactly where it sounds — like clips in the FL Studio playlist.
function ClipPreview({ clip, color, bars }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const cols = Math.max(16, bars * 16)
    const H = 48
    canvas.width = cols
    canvas.height = H
    const c = canvas.getContext('2d')
    c.clearRect(0, 0, cols, H)
    c.fillStyle = color
    for (let b = 0; b < bars; b++) {
      for (let i = 0; i < 16; i++) {
        const lvl = clip[i]
        if (lvl <= 0) continue
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
  }, [clip, color, bars])
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'pixelated', opacity: 0.92 }}
    />
  )
}

export default function ArrangementView({ arrangement, accentClass, bpm, genreId }) {
  const [hidden, setHidden] = useState({})
  const { playing, toggle, start, stop, getPosition } = usePlayer('arrangement')
  const scrollRef = useRef(null)
  const seekRef = useRef(null)
  const [frac, setFrac] = useState(null) // smooth playhead 0..1
  const [startBar, setStartBar] = useState(0) // where playback begins

  const toggleTrack = name => setHidden(h => ({ ...h, [name]: !h[name] }))

  const totalBars = arrangement.sections.reduce((sum, s) => sum + s.bars, 0)
  const visibleTracks = arrangement.tracks.filter(t => !hidden[t.name])

  const groove = useMemo(() => grooveFor(genreId), [genreId])
  const timelineWidth = Math.max(584, totalBars * PX_PER_BAR)

  // Bar at the start of each section, for highlighting the live section.
  const sectionStartBars = useMemo(() => {
    let acc = 0
    return arrangement.sections.map(s => { const b = acc; acc += s.bars; return b })
  }, [arrangement.sections])

  // Precompute a clip preview per track.
  const clips = useMemo(() => {
    const map = {}
    arrangement.tracks.forEach(t => {
      const v = voiceFor(t.name)
      map[t.name] = buildClip(v, groove.voices[v])
    })
    return map
  }, [arrangement.tracks, groove])

  const play = (fromBar = startBar) =>
    start('arrangement', { genreId, arrangement, tracks: visibleTracks, startStep: fromBar * 16 })

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
  const liveSection = currentBar >= 0
    ? sectionStartBars.findLastIndex(b => b <= currentBar)
    : -1

  // Auto-scroll to keep the playhead in view.
  useEffect(() => {
    if (frac == null || !scrollRef.current) return
    const el = scrollRef.current
    const x = LABEL_W + frac * timelineWidth
    const view = el.scrollLeft
    const w = el.clientWidth
    if (x < view + LABEL_W + 40 || x > view + w - 60) {
      el.scrollTo({ left: Math.max(0, x - w / 2), behavior: 'smooth' })
    }
  }, [frac, timelineWidth])

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎼</span>
          <div>
            <span className="text-base font-semibold text-white">Arrangement</span>
            <span className="text-xs text-gray-600 ml-2">
              {totalBars} bars · plays at {groove.bpm} BPM
              {currentBar >= 0
                ? <span className="text-purple-300 ml-2">▸ bar {currentBar + 1}</span>
                : <span className="text-cyan-300/80 ml-2">start: bar {startBar + 1}</span>}
            </span>
          </div>
        </div>
        <PlayButton playing={playing} onClick={onPlay} accentClass={accentClass} label="Play arrangement" />
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
            return (
              <div key={track.name} className={`flex border-b border-white/5 group ${isHidden ? 'opacity-40' : ''}`}>
                <button
                  onClick={() => toggleTrack(track.name)}
                  className="shrink-0 flex items-center gap-2.5 px-4 py-3.5 border-r border-white/10 hover:bg-white/5 transition-colors text-left"
                  style={{ width: LABEL_W }}
                  title={isHidden ? 'Show track' : 'Hide track'}
                >
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: track.color, opacity: isHidden ? 0.3 : 1 }} />
                  <span className="text-sm text-gray-300 truncate">{track.icon} {track.name}</span>
                  <span className="ml-auto text-gray-700 group-hover:text-gray-500 text-sm shrink-0">{isHidden ? '○' : '●'}</span>
                </button>

                {/* Pattern blocks with note previews */}
                <div className="flex py-2 px-1 gap-1 items-center bg-black/20" style={{ width: timelineWidth }}>
                  {arrangement.sections.map((section, i) => {
                    const on = !!track.sections[i]
                    const active = on && !isHidden
                    const hasNotes = clip.some(v => v > 0)
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
        <span className="text-xs text-gray-600">Click a track name to mute/unmute · click the timeline to set where playback starts (cyan marker) · the bars inside each block show its rhythm &amp; pitch</span>
        <button onClick={() => setHidden({})} className="text-xs text-gray-500 hover:text-gray-300 transition-colors ml-auto">Show all</button>
      </div>
    </div>
  )
}
