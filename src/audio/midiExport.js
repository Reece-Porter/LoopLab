// Pure-JS MIDI file generator — no external dependencies.
// Format 1 (multi-track), 480 PPQ.
// Each voice becomes its own track; drums on channel 9 (GM channel 10).

import { noteToMidi, chordToMidi } from './theory'
import { grooveFor } from './grooves'
import { grooveClip } from './arrangementClip'

const PPQ = 480            // ticks per quarter note
const STEP = PPQ / 4       // 1 sixteenth-note = 120 ticks

// ─── General MIDI drum map ────────────────────────────────────────────────────
const DRUM_NOTE = {
  kick:  36, // Bass Drum 1
  snare: 38, // Acoustic Snare
  clap:  39, // Hand Clap
  hat:   42, // Closed Hi-Hat (open → 46)
  perc:  62, // High Conga
  break: 36, // treated step-by-step below
  donk:  56, // Cowbell (closest "donk")
}
const DRUM_VOICES = new Set(['kick','snare','clap','hat','perc','break','donk'])

// Note durations in ticks
const DUR = {
  drum:    25,
  bass:   110,
  long:   220,
  chord:  110,
  pad:    200,
  default: 90,
}

// ─── VLQ encoding ─────────────────────────────────────────────────────────────
function vlq(n) {
  if (n < 128) return [n]
  const bytes = []
  bytes.unshift(n & 0x7f)
  n >>= 7
  while (n > 0) { bytes.unshift((n & 0x7f) | 0x80); n >>= 7 }
  return bytes
}

// ─── Big-endian 4-byte integer ────────────────────────────────────────────────
function be4(n) {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
}

function be2(n) {
  return [(n >>> 8) & 0xff, n & 0xff]
}

// ─── Build a track chunk from a flat event list [{tick, data[]}] ──────────────
function makeTrack(events) {
  events = [...events].sort((a, b) => a.tick - b.tick)
  const body = []
  let cursor = 0
  for (const ev of events) {
    const delta = ev.tick - cursor
    cursor = ev.tick
    body.push(...vlq(delta), ...ev.data)
  }
  // End of track
  body.push(0x00, 0xFF, 0x2F, 0x00)
  return [
    0x4D, 0x54, 0x72, 0x6B, // MTrk
    ...be4(body.length),
    ...body,
  ]
}

// ─── Tempo track ──────────────────────────────────────────────────────────────
function makeTempoTrack(bpm, timeSigNumer = 4, timeSigDenom = 2) {
  const us = Math.round(60_000_000 / bpm)
  return makeTrack([
    { tick: 0, data: [0xFF, 0x58, 0x04, timeSigNumer, timeSigDenom, 24, 8] },
    { tick: 0, data: [0xFF, 0x51, 0x03, (us >>> 16) & 0xff, (us >>> 8) & 0xff, us & 0xff] },
    { tick: 0, data: [0xFF, 0x03, 0x08, ...Array.from('LoopLab').map(c => c.charCodeAt(0))] },
  ])
}

// ─── Note on/off pair ─────────────────────────────────────────────────────────
function noteEvents(channel, midi, onTick, durTicks, velocity = 100) {
  midi = Math.max(0, Math.min(127, midi))
  return [
    { tick: onTick,            data: [0x90 | channel, midi, velocity] },
    { tick: onTick + durTicks, data: [0x80 | channel, midi, 0] },
  ]
}

// ─── Convert a clip16 array → MIDI events for one track ──────────────────────
// barOffset: starting tick for the first step of this clip loop
function clipToEvents(clip, voice, channel, swingTicks, barOffset = 0) {
  const events = []
  const isDrum = DRUM_VOICES.has(voice)
  const len = clip.length
  const bars = len / 16

  for (let bar = 0; bar < bars; bar++) {
    for (let s = 0; s < 16; s++) {
      const i = bar * 16 + s
      const evt = clip[i]
      if (!evt) continue

      // Swing: push odd steps (off-beats) later
      const swingOffset = s % 2 === 1 ? swingTicks : 0
      const tick = barOffset + bar * PPQ * 4 + s * STEP + swingOffset

      if (evt.drum) {
        let note = DRUM_NOTE[voice] ?? 38
        if (voice === 'hat' && evt.open) note = 46
        if (voice === 'break') {
          const isSnare = evt.breakSnare || (evt.breakStep != null && evt.breakStep % 8 >= 4)
          note = isSnare ? 38 : 36
        }
        const velocity = voice === 'kick' ? 110 : voice === 'snare' || voice === 'clap' ? 95 : 80
        events.push(...noteEvents(9, note, tick, DUR.drum, velocity))
        // Hat rolls: 3 fast hits within the step
        if (evt.roll) {
          for (let r = 1; r < 3; r++) {
            events.push(...noteEvents(9, note, tick + r * Math.floor(STEP / 3), DUR.drum, 70))
          }
        }
      } else if (evt.freqs && evt.freqs.length) {
        // Chord event — derive MIDI notes from frequencies via nearest semitone
        const dur = evt.pad ? DUR.pad : DUR.chord
        const midis = evt.freqs.map(f => Math.round(69 + 12 * Math.log2(f / 440)))
        midis.forEach(m => events.push(...noteEvents(channel, m, tick, dur)))
      } else if (evt.freq != null) {
        const midi = Math.round(69 + 12 * Math.log2(evt.freq / 440))
        const dur = evt.long ? DUR.long : voice === 'bass' ? DUR.bass : DUR.default
        events.push(...noteEvents(channel, midi, tick, dur))
      }
    }
  }
  return events
}

// ─── Track name meta event ────────────────────────────────────────────────────
function trackName(name) {
  const bytes = Array.from(name.slice(0, 32)).map(c => c.charCodeAt(0))
  return { tick: 0, data: [0xFF, 0x03, bytes.length, ...bytes] }
}

// ─── Assemble full MIDI file bytes ────────────────────────────────────────────
function buildMidi(tracks) {
  // tracks = [{name, events[]}]
  const numTracks = 1 + tracks.length // tempo + data tracks
  const header = [
    0x4D, 0x54, 0x68, 0x64, // MThd
    ...be4(6),               // chunk length
    ...be2(1),               // format 1
    ...be2(numTracks),
    ...be2(PPQ),
  ]
  const chunks = tracks.map(t => makeTrack([trackName(t.name), ...t.events]))
  const all = [...header, ...makeTempoTrack(tracks[0]?.bpm ?? 128), ...chunks.flat()]
  return new Uint8Array(all)
}

// ─── Download helper ──────────────────────────────────────────────────────────
function download(bytes, filename) {
  const blob = new Blob([bytes], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 1000)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Export a genre's groove pattern as a MIDI file.
 * The full 4-bar (64-step) loop is written; drums on channel 10, pitched
 * voices on sequential channels 1–8.
 */
export function exportGrooveMidi(genreId) {
  const groove = grooveFor(genreId)
  const { bpm, swing } = groove
  const swingTicks = Math.round((swing || 0) * STEP)
  const voiceNames = Object.keys(groove.voices)

  let melodicChannel = 0
  const tracks = []

  for (const voice of voiceNames) {
    const gp = groove.voices[voice]
    const clip = grooveClip(voice, gp)
    const isDrum = DRUM_VOICES.has(voice)
    const channel = isDrum ? 9 : melodicChannel++
    if (!isDrum && melodicChannel === 9) melodicChannel++ // skip drum channel

    const events = clipToEvents(clip, voice, channel, swingTicks)
    if (events.length === 0) continue
    tracks.push({ name: voice, bpm, events })
  }

  const bytes = buildMidi(tracks)
  download(bytes, `looplab-${genreId}.mid`)
}

/**
 * Export the currently compiled custom arrangement clips as MIDI.
 * clips = { trackName: clip16[] | clip16[][] }  (from gridRef.current)
 * The first 4 non-null bars are written per track.
 */
export function exportClipsMidi(clips, bpm, trackNames) {
  const swingTicks = 0
  let melodicChannel = 0
  const tracks = []

  for (const name of (trackNames || Object.keys(clips))) {
    const barClips = clips[name] // array of clip16 | null indexed by bar
    if (!barClips) continue

    const voice = inferVoice(name)
    const isDrum = DRUM_VOICES.has(voice)
    const channel = isDrum ? 9 : melodicChannel++
    if (!isDrum && melodicChannel === 9) melodicChannel++

    const events = []
    let barTick = 0
    for (let bar = 0; bar < barClips.length; bar++) {
      const clip = barClips[bar]
      if (!clip) continue
      events.push(...clipToEvents(clip, voice, channel, swingTicks, barTick))
      barTick += PPQ * 4
    }
    if (events.length === 0) continue
    tracks.push({ name, bpm, events })
  }

  if (tracks.length === 0) return
  const bytes = buildMidi(tracks)
  download(bytes, `looplab-custom.mid`)
}

// Minimal voice inference matching voiceFor() in player.js
function inferVoice(name) {
  const n = name.toLowerCase()
  if (n.includes('kick') || n.includes('drum')) return 'kick'
  if (n.includes('snare') || n.includes('rim'))  return 'snare'
  if (n.includes('clap'))  return 'clap'
  if (n.includes('hat'))   return 'hat'
  if (n.includes('break')) return 'break'
  if (n.includes('perc'))  return 'perc'
  if (n.includes('donk') || n.includes('bounce')) return 'donk'
  if (n.includes('bass') || n.includes('sub'))   return 'bass'
  return 'melody'
}
