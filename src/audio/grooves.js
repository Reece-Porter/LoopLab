// Genre-specific groove definitions so each style actually sounds like itself.
// Each genre maps a generic "voice" (from voiceFor) to a 16-step rhythm plus
// the notes it should play. The arrangement player reads this table so the
// drop of a Eurodance track grooves nothing like a Lo-Fi beat.

import { noteToFreq, chordToFreqs } from './theory'

// 16-step helper: list the steps that fire.
const on = (...steps) => {
  const a = new Array(16).fill(0)
  steps.forEach(s => { a[s] = 1 })
  return a
}

// Each genre: tempo it should actually play at, swing amount (0–0.5 of a step),
// and a per-voice pattern. A pattern has { steps, notes? , open? } where notes
// is a list cycled through on each hit.
export const GENRE_GROOVES = {
  eurodance: {
    bpm: 138,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      snare:   { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      bass:    { steps: on(0, 2, 4, 6, 8, 10, 12, 14), notes: ['A1', 'A2', 'A1', 'A2'] },
      eight08: { steps: on(0, 2, 4, 6, 8, 10, 12, 14), notes: ['A1', 'A2'] },
      supersaw:{ steps: on(0, 3, 6, 8, 11, 14), notes: ['A4', 'C5', 'E5', 'A4', 'G4', 'E5'] },
      pluck:   { steps: on(0, 3, 6, 8, 11, 14), notes: ['A4', 'C5', 'E5', 'A4', 'G4', 'E5'] },
      chord:   { steps: on(0, 4, 8, 12), chords: ['Am', 'F', 'C', 'G'] },
      vox:     { steps: on(0, 8), notes: ['A4', 'C5'] },
    },
  },

  trap: {
    bpm: 142,
    swing: 0,
    voices: {
      // Half-time feel: kick syncopated, snare lands on beat 3 only.
      kick:    { steps: on(0, 6, 10) },
      snare:   { steps: on(8) },
      hat:     { steps: on(0, 2, 3, 4, 6, 8, 10, 11, 12, 14, 15) },
      eight08: { steps: on(0, 6, 10), notes: ['C1', 'C1', 'D#1'], long: true },
      bass:    { steps: on(0, 6, 10), notes: ['C1', 'C1', 'D#1'], long: true },
      pluck:   { steps: on(0, 3, 6, 7, 10, 12), notes: ['C5', 'D#5', 'G5', 'F5', 'D#5', 'C5'] },
      chord:   { steps: on(0, 10), chords: ['Cm', 'G#'] },
      vox:     { steps: on(0, 8, 12), notes: ['Eb4', 'G4', 'Bb4'] },
    },
  },

  'deep-house': {
    bpm: 124,
    swing: 0.12,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      snare:   { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      // Off-beat bass — the heartbeat of deep house.
      bass:    { steps: on(2, 6, 10, 14), notes: ['F1', 'F1', 'A#1', 'C2'] },
      chord:   { steps: on(2, 10), chords: ['Fm7', 'A#maj7'], keys: true },
      pluck:   { steps: on(0, 6, 8, 14), notes: ['F4', 'A#4', 'C5', 'A#4'] },
      vox:     { steps: on(2, 10), notes: ['A4', 'G4'] },
    },
  },

  'drum-and-bass': {
    bpm: 174,
    swing: 0,
    voices: {
      // Amen-style breakbeat: kicks and snares scattered, ghosts between.
      break:   { steps: on(0, 10), snares: [4, 7, 12] },
      kick:    { steps: on(0, 10) },
      snare:   { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 14) },
      eight08: { steps: on(0, 8), notes: ['D1', 'D1'], long: true },
      bass:    { steps: on(0, 8), notes: ['D1', 'D1'], long: true },
      reese:   { steps: on(0, 6, 8, 14), notes: ['D2', 'D2', 'F2', 'A2'] },
      pluck:   { steps: on(0, 4, 8, 12), notes: ['D5', 'F5', 'A5', 'D5'] },
      chord:   { steps: on(0), chords: ['Dm'], pad: true },
      vox:     { steps: on(0, 12), notes: ['C5', 'Eb5'] },
    },
  },

  'lo-fi-hip-hop': {
    bpm: 82,
    swing: 0.22,
    voices: {
      // Lazy, swung boom-bap.
      kick:    { steps: on(0, 7, 8) },
      snare:   { steps: on(4, 12) },
      hat:     { steps: on(0, 2, 4, 6, 8, 10, 12, 14) },
      bass:    { steps: on(0, 8), notes: ['D2', 'G2'] },
      chord:   { steps: on(0, 8), chords: ['Dm7', 'Gmaj7'], keys: true },
      pluck:   { steps: on(2, 6, 10, 14), notes: ['F4', 'A4', 'C5', 'D5'] },
      vox:     { steps: on(4, 12), notes: ['E4', 'G4'] },
    },
  },
}

// Pick the genre groove, defaulting to eurodance-ish if unknown.
export function grooveFor(genreId) {
  return GENRE_GROOVES[genreId] || GENRE_GROOVES.eurodance
}

// Precompute frequency/chord data for a voice pattern so the scheduler is cheap.
export function resolveNote(pattern, hitIndex) {
  if (pattern.notes) {
    const name = pattern.notes[hitIndex % pattern.notes.length]
    return noteToFreq(name)
  }
  return null
}

export function resolveChord(pattern, hitIndex) {
  if (pattern.chords) {
    const sym = pattern.chords[hitIndex % pattern.chords.length]
    return chordToFreqs(sym)
  }
  return null
}
