// Normalises either a genre groove or a hand-picked example pattern into a
// single 16-step "clip" the arrangement player and the visual preview both
// read from. Each slot is null (rest) or an event describing what to play
// plus a `level` (0..1) used for the piano-roll preview height.

import { noteToFreq, chordToFreqs } from './theory'
import { grooveFor } from './grooves'

const DRUM_LEVEL = { kick: 1, snare: 0.82, hat: 0.4, break: 0.9 }
const isDrum = v => Object.prototype.hasOwnProperty.call(DRUM_LEVEL, v)
const isChord = v => v === 'chord'

function freqLevel(f) {
  return f ? 0.25 + 0.75 * Math.min(1, Math.max(0, (Math.log2(f) - 5.2) / 5.2)) : 0.6
}

// Genre groove pattern → clip.
export function grooveClip(voice, gp) {
  const clip = new Array(16).fill(null)
  if (!gp) return clip
  let hit = 0
  for (let i = 0; i < 16; i++) {
    if (!gp.steps[i]) continue
    if (voice === 'break') {
      clip[i] = { drum: true, breakSnare: !!(gp.snares && gp.snares.includes(i)), level: DRUM_LEVEL.break }
    } else if (isDrum(voice)) {
      clip[i] = { drum: true, open: voice === 'hat' && !!gp.open && i % 4 === 2, level: DRUM_LEVEL[voice] }
    } else if (isChord(voice)) {
      const sym = gp.chords ? gp.chords[hit % gp.chords.length] : null
      const freqs = sym ? chordToFreqs(sym) : null
      clip[i] = { freqs, keys: gp.keys, pad: gp.pad, level: freqs ? freqLevel(freqs[0]) : 0.6 }
      hit++
    } else {
      const name = gp.notes ? gp.notes[hit % gp.notes.length] : null
      const f = name ? noteToFreq(name) : null
      clip[i] = { freq: f, long: gp.long, level: freqLevel(f) }
      hit++
    }
  }
  return clip
}

// Hand-picked example pattern (from genres.json) → clip.
export function patternClip(voice, pattern) {
  const clip = new Array(16).fill(null)
  if (!pattern) return clip

  if (pattern.type === 'steps') {
    const s = pattern.steps
    for (let i = 0; i < Math.min(16, s.length); i++) {
      if (!s[i]) continue
      if (voice === 'break') clip[i] = { drum: true, breakStep: i, level: DRUM_LEVEL.break }
      else clip[i] = { drum: true, open: voice === 'hat' && s[i] === 2, level: DRUM_LEVEL[voice] || 0.8 }
    }
    return clip
  }

  if (pattern.type === 'notes') {
    const toks = pattern.value.split(/\s+/).filter(t => t !== '→')
    const eighth = toks.length <= 8 // ≤8 events → lay on the 8th-note grid
    toks.forEach((tok, k) => {
      if (tok === '–') return
      const step = eighth ? k * 2 : k
      if (step > 15) return
      const f = noteToFreq(tok)
      if (f) clip[step] = { freq: f, level: freqLevel(f) }
    })
    return clip
  }

  if (pattern.type === 'chords') {
    const chords = pattern.value.replace(/\(.*?\)/g, '').split(/\s+–\s+/).map(c => c.trim()).filter(Boolean)
    chords.forEach((c, k) => {
      const step = Math.min(15, Math.round((k * 16) / chords.length))
      const freqs = chordToFreqs(c)
      if (freqs.length) clip[step] = { freqs, keys: true, level: freqLevel(freqs[0]) }
    })
    return clip
  }

  return clip // structure / unknown → empty
}

// source: { type:'groove', genreId } | { type:'pattern', pattern }
export function buildTrackClip(voice, source) {
  if (source.type === 'pattern') return patternClip(voice, source.pattern)
  return grooveClip(voice, grooveFor(source.genreId).voices[voice])
}
