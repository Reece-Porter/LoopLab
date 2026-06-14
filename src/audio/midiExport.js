// Pure-JS MIDI file writer — no npm dependencies.
// Exports groove patterns and custom arrangements as MIDI Format 1 files.

import { grooveFor } from './grooves'
import { grooveClip } from './arrangementClip'

// ---------------------------------------------------------------------------
// VLQ (variable-length quantity) encoding
// ---------------------------------------------------------------------------
function vlq(n) {
  if (n < 128) return [n]
  const bytes = []
  bytes.unshift(n & 0x7f)
  n >>= 7
  while (n > 0) { bytes.unshift((n & 0x7f) | 0x80); n >>= 7 }
  return bytes
}

// ---------------------------------------------------------------------------
// Note name → MIDI number
// ---------------------------------------------------------------------------
const NOTE_NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

function noteNameToMidi(name) {
  if (!name || typeof name !== 'string') return null
  const m = name.match(/^([A-G])(#|b)?(-?\d+)$/)
  if (!m) return null
  const [, letter, accidental, octStr] = m
  let semitone = NOTE_NAMES[letter]
  if (accidental === '#') semitone += 1
  else if (accidental === 'b') semitone -= 1
  const octave = parseInt(octStr, 10)
  return (octave + 1) * 12 + semitone
}

// Frequency → approximate MIDI note number using A4=440 Hz
function freqToMidi(freq) {
  if (!freq || freq <= 0) return null
  const midi = Math.round(69 + 12 * Math.log2(freq / 440))
  return midi >= 0 && midi <= 127 ? midi : null
}

// ---------------------------------------------------------------------------
// GM Drum map
// ---------------------------------------------------------------------------
const DRUM_MAP = {
  kick: 36,
  snare: 38,
  clap: 39,
  hat: 42,    // closed hat; open = 46
  perc: 62,
  conga: 62,
  break: 38,  // break snare by default
}

function drumNote(event, voice) {
  if (voice === 'hat') {
    return event.open ? 46 : 42
  }
  if (voice === 'break') {
    return event.breakSnare ? 38 : 36
  }
  return DRUM_MAP[voice] || 38
}

// ---------------------------------------------------------------------------
// Voice classification helpers
// ---------------------------------------------------------------------------
const DRUM_VOICES = new Set(['kick', 'snare', 'clap', 'hat', 'perc', 'conga', 'break'])

function isDrumVoice(voice) {
  return DRUM_VOICES.has(voice)
}

// Map a track name to a generic voice string (for custom arrangement)
function voiceFromName(trackName) {
  const n = trackName.toLowerCase()
  if (/kick/.test(n))       return 'kick'
  if (/snare/.test(n))      return 'snare'
  if (/clap/.test(n))       return 'clap'
  if (/hat/.test(n))        return 'hat'
  if (/perc|conga/.test(n)) return 'perc'
  if (/break/.test(n))      return 'break'
  if (/bass|acid|sub/.test(n)) return 'bass'
  if (/chord|pad|piano|keys|synth/.test(n)) return 'chord'
  return 'melody'
}

// ---------------------------------------------------------------------------
// Note duration by voice / event type
// ---------------------------------------------------------------------------
const TICKS_PER_STEP = 120  // 480 PPQ / 4  (16th-note resolution)

function noteDuration(event, voice) {
  if (isDrumVoice(voice)) return 30
  if (event.acid || event.sub) return 100
  if (event.freqs) return 110  // chord / pad
  if (event.long) return 200
  return 80
}

// ---------------------------------------------------------------------------
// Clip → raw MIDI events
// ---------------------------------------------------------------------------
function clipToEvents(clip, voice, channel, swing, tickOffset = 0) {
  const events = []

  for (let step = 0; step < clip.length; step++) {
    const evt = clip[step]
    if (!evt) continue

    // Swing: delay odd-numbered 16th-note steps
    const swingShift = (step % 2 === 1) ? Math.round(swing * TICKS_PER_STEP) : 0
    const tick = tickOffset + step * TICKS_PER_STEP + swingShift
    const dur = noteDuration(evt, voice)
    const vel = 100

    if (isDrumVoice(voice)) {
      const note = drumNote(evt, voice)
      events.push({ tick, data: [0x90 | channel, note, vel] })
      events.push({ tick: tick + dur, data: [0x90 | channel, note, 0] })

      // Hat rolls — 3 fast retrigs
      if (evt.roll) {
        const rollInterval = Math.floor(TICKS_PER_STEP / 4)
        for (let r = 1; r <= 2; r++) {
          const rt = tick + r * rollInterval
          events.push({ tick: rt, data: [0x90 | channel, note, vel] })
          events.push({ tick: rt + 15, data: [0x90 | channel, note, 0] })
        }
      }
    } else if (evt.freqs && evt.freqs.length) {
      // Chord: all notes simultaneously
      for (const freq of evt.freqs) {
        const note = freqToMidi(freq)
        if (note == null) continue
        events.push({ tick, data: [0x90 | channel, note, vel] })
        events.push({ tick: tick + dur, data: [0x90 | channel, note, 0] })
      }
    } else if (evt.freq) {
      const note = freqToMidi(evt.freq)
      if (note != null) {
        events.push({ tick, data: [0x90 | channel, note, vel] })
        events.push({ tick: tick + dur, data: [0x90 | channel, note, 0] })
      }
    }
    // vocalBuffer events are audio-only, skip in MIDI
  }

  return events
}

// ---------------------------------------------------------------------------
// Build MTrk chunk from event list
// ---------------------------------------------------------------------------
function buildTrack(events) {
  events.sort((a, b) => a.tick - b.tick)

  const bytes = []
  let lastTick = 0

  for (const ev of events) {
    const delta = Math.max(0, ev.tick - lastTick)
    lastTick = ev.tick
    bytes.push(...vlq(delta), ...ev.data)
  }

  // End-of-track meta event
  bytes.push(0x00, 0xFF, 0x2F, 0x00)

  const len = bytes.length
  return [
    0x4D, 0x54, 0x72, 0x6B,  // "MTrk"
    (len >> 24) & 0xFF,
    (len >> 16) & 0xFF,
    (len >> 8)  & 0xFF,
    len & 0xFF,
    ...bytes,
  ]
}

// ---------------------------------------------------------------------------
// Build tempo track (MTrk 0)
// ---------------------------------------------------------------------------
function buildTempoTrack(bpm) {
  const microsPerBeat = Math.round(60_000_000 / bpm)
  const trackData = [
    0x00, 0xFF, 0x51, 0x03,
    (microsPerBeat >> 16) & 0xFF,
    (microsPerBeat >> 8)  & 0xFF,
    microsPerBeat & 0xFF,
    0x00, 0xFF, 0x2F, 0x00,  // end-of-track
  ]
  const len = trackData.length
  return [
    0x4D, 0x54, 0x72, 0x6B,
    (len >> 24) & 0xFF,
    (len >> 16) & 0xFF,
    (len >> 8)  & 0xFF,
    len & 0xFF,
    ...trackData,
  ]
}

// ---------------------------------------------------------------------------
// Build MThd header
// ---------------------------------------------------------------------------
function buildHeader(numTracks) {
  return [
    0x4D, 0x54, 0x68, 0x64,  // "MThd"
    0x00, 0x00, 0x00, 0x06,  // length = 6
    0x00, 0x01,              // format 1
    (numTracks >> 8) & 0xFF,
    numTracks & 0xFF,
    0x01, 0xE0,              // 480 PPQ
  ]
}

// ---------------------------------------------------------------------------
// Trigger browser file download
// ---------------------------------------------------------------------------
function downloadMidi(midiBytes, filename) {
  const blob = new Blob([new Uint8Array(midiBytes)], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(url); a.remove() }, 1000)
}

// ---------------------------------------------------------------------------
// Assemble complete MIDI file
// ---------------------------------------------------------------------------
function assembleMidi(bpm, tracks) {
  const numTracks = 1 + tracks.length
  const header = buildHeader(numTracks)
  const tempoTrack = buildTempoTrack(bpm)
  const trackChunks = tracks.flatMap(t => buildTrack(t.events))
  return [...header, ...tempoTrack, ...trackChunks]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Export a single genre groove as a MIDI file.
 * Calls grooveFor(genreId), builds clips for each voice, downloads .mid
 */
export function exportGrooveMidi(genreId) {
  const gp = grooveFor(genreId)
  const { bpm, swing = 0, voices } = gp

  const tracks = []
  let pitchedCh = 0

  // Process all voices; drums on ch 9, pitched sequential from 0
  Object.entries(voices).forEach(([voice, voiceGp]) => {
    if (!voiceGp) return
    const clip = grooveClip(voice, voiceGp)
    if (!clip || !clip.some(e => e)) return  // empty clip — skip

    const isDrum = isDrumVoice(voice)
    const channel = isDrum ? 9 : pitchedCh

    const events = clipToEvents(clip, voice, channel, swing)
    if (events.length > 0) {
      tracks.push({ name: voice, events })
      if (!isDrum) {
        pitchedCh++
        if (pitchedCh === 9) pitchedCh++  // skip drum channel
      }
    }
  })

  const midiBytes = assembleMidi(bpm, tracks)
  downloadMidi(midiBytes, `${genreId}-groove.mid`)
}

/**
 * Export the custom arrangement's current clips as a MIDI file.
 * clips    = { trackName: barClip[] }  (gridRef.current)
 * bpm      = beats per minute
 * trackNames = ordered array of track names
 */
export function exportClipsMidi(clips, bpm, trackNames) {
  const swing = 0
  const tracks = []
  let pitchedCh = 0

  const names = trackNames || Object.keys(clips)

  names.forEach(trackName => {
    const barClips = clips[trackName]
    if (!barClips || !Array.isArray(barClips)) return

    const voice = voiceFromName(trackName)
    const isDrum = isDrumVoice(voice)
    const channel = isDrum ? 9 : pitchedCh

    const events = []
    barClips.forEach((clip16, barIdx) => {
      if (!clip16 || !Array.isArray(clip16)) return
      const tickOffset = barIdx * 16 * TICKS_PER_STEP
      events.push(...clipToEvents(clip16, voice, channel, swing, tickOffset))
    })

    if (events.length > 0) {
      tracks.push({ name: trackName, events })
      if (!isDrum) {
        pitchedCh++
        if (pitchedCh === 9) pitchedCh++
      }
    }
  })

  const midiBytes = assembleMidi(bpm, tracks)
  downloadMidi(midiBytes, 'custom-arrangement.mid')
}
