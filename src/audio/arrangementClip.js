// Normalises either a genre groove or a hand-picked example pattern into a
// single 16-step "clip" the arrangement player and the visual preview both
// read from. Each slot is null (rest) or an event describing what to play
// plus a `level` (0..1) used for the piano-roll preview height.

import { noteToFreq, chordToFreqs } from './theory'
import { grooveFor } from './grooves'

const DRUM_LEVEL = { kick: 1, snare: 0.82, clap: 0.72, perc: 0.5, hat: 0.4, break: 0.9 }
const isDrum = v => Object.prototype.hasOwnProperty.call(DRUM_LEVEL, v)

function freqLevel(f) {
  return f ? 0.25 + 0.75 * Math.min(1, Math.max(0, (Math.log2(f) - 5.2) / 5.2)) : 0.6
}

// Pick ONE vowel for a whole vocal phrase. Cycling vowels per note sounds
// goofy (like babbling syllables); real vocal hooks/pads hold "ooohs"/"aaahs".
function vowelFor(name = '') {
  const n = name.toLowerCase()
  if (/ooh|\boo\b|hum|breath|whisper|warm|cosy|atmos|late|background|pad/.test(n)) return 'oo'
  if (/aah|\bah\b/.test(n)) return 'ah'
  return 'ah'
}

// Post-process a finished clip so any vocal notes sustain right up to the next
// note (covering the bar), all on one held vowel. Mutates + returns clip.
function shapeVocal(clip, vowel = 'ah') {
  const steps = []
  for (let i = 0; i < 16; i++) if (clip[i] && clip[i].freq != null) steps.push(i)
  steps.forEach((s, k) => {
    // hold until the next sung note (wrapping to the first note of next bar)
    const next = k + 1 < steps.length ? steps[k + 1] : steps[0] + 16
    const span = Math.min(8, Math.max(2, next - s)) // cap so holds don't pile up
    clip[s] = { ...clip[s], vowel, sustain: span }
  })
  return clip
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
    } else if (gp.chords) {
      const sym = gp.chords[hit % gp.chords.length]
      const freqs = sym ? chordToFreqs(sym, gp.pad ? 4 : 3) : null
      clip[i] = { freqs, keys: !!gp.keys, pad: !!gp.pad, level: freqs ? freqLevel(freqs[0]) : 0.6 }
      hit++
    } else {
      const name = gp.notes ? gp.notes[hit % gp.notes.length] : null
      const f = name ? noteToFreq(name) : null
      clip[i] = { freq: f, long: gp.long, bell: !!gp.bell, hoover: !!gp.hoover, level: freqLevel(f) }
      hit++
    }
  }
  if (voice === 'vox') return shapeVocal(clip, 'oo') // default groove = soft "oohs"
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
    if (voice === 'vox') return shapeVocal(clip, vowelFor(pattern.name))
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

// source: { type:'groove', genreId, override? } | { type:'pattern', pattern }
// `override` is a per-voice groove map (a reference song's hook) that takes
// precedence over the genre default for any voice it defines.
export function buildTrackClip(voice, source) {
  if (source.type === 'pattern') return patternClip(voice, source.pattern)
  const base = grooveFor(source.genreId).voices[voice]
  const gp = (source.override && source.override[voice]) || base
  return grooveClip(voice, gp)
}
