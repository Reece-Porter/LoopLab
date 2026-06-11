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

  // ---- Hard Groove: tribal, percussive 4/4 techno (Ben Sims / Jeff Mills) ----
  'hard-groove': {
    bpm: 135,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      clap:    { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      perc:    { steps: on(3, 7, 9, 11, 13, 15) },
      bass:    { steps: on(2, 6, 10, 14), notes: ['A1', 'A1', 'A1', 'C2'] },
      supersaw:{ steps: on(0, 8), notes: ['A3', 'C4'] },
      vox:     { steps: on(0, 8), notes: ['A4', 'G4'] },
    },
  },

  // ---- Hard House: pounding UK hard house with donk + hoover stabs ----
  'hard-house': {
    bpm: 150,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      clap:    { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      bass:    { steps: on(2, 6, 10, 14), notes: ['C2', 'C2', 'C2', 'D#2'] },
      donk:    { steps: on(2, 6, 10, 14), notes: ['C3', 'C3', 'C3', 'D#3'] },
      supersaw:{ steps: on(0, 8), notes: ['C4', 'G3'] },
      vox:     { steps: on(0, 8), notes: ['C5', 'G4'] },
    },
  },

  // ---- Standard / Piano House: classic uplifting house with stabbed piano ----
  house: {
    bpm: 125,
    swing: 0.08,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      clap:    { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      bass:    { steps: on(2, 6, 10, 14), notes: ['F1', 'A#1', 'C2', 'A#1'] },
      piano:   { steps: on(2, 6, 7, 10, 14), chords: ['Fm7', 'A#maj7', 'Cm7', 'Gm7', 'A#maj7'] },
      vox:     { steps: on(0, 8), notes: ['F4', 'A#4'] },
    },
  },

  // ---- Speed Garage / UKG: shuffled 2-step with organ/reese sub ----
  'speed-garage': {
    bpm: 135,
    swing: 0.3,
    voices: {
      kick:    { steps: on(0, 10) },
      snare:   { steps: on(4, 12) },
      hat:     { steps: on(2, 5, 6, 9, 11, 14), open: true },
      reese:   { steps: on(0, 3, 6, 8, 11, 14), notes: ['G1', 'G1', 'A#1', 'C2', 'C2', 'D2'] },
      bass:    { steps: on(0, 6, 10), notes: ['G1', 'A#1', 'C2'], long: true },
      piano:   { steps: on(2, 8, 11), chords: ['Gm7', 'Cm7', 'D7'] },
      vox:     { steps: on(0, 8), notes: ['G4', 'A#4'] },
    },
  },

  // ---- Bouncy Techno (240km/h / Adrian Mills): rave stabs + bouncy donk ----
  'bouncy-techno': {
    bpm: 165,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      clap:    { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      donk:    { steps: on(2, 3, 6, 7, 10, 11, 14, 15), notes: ['A2', 'A3', 'A2', 'A3', 'C3', 'C4', 'G2', 'G3'] },
      supersaw:{ steps: on(0, 8), notes: ['A4', 'C5'] },
      vox:     { steps: on(0, 8), notes: ['A4', 'E5'] },
    },
  },

  // ---- Tech House: rolling, minimal, percussion-led ----
  'tech-house': {
    bpm: 126,
    swing: 0.1,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      clap:    { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      perc:    { steps: on(3, 7, 11, 15) },
      bass:    { steps: on(2, 5, 6, 10, 13, 14), notes: ['C2', 'C2', 'D#2', 'G2', 'G2', 'C2'] },
      supersaw:{ steps: on(0, 8), notes: ['C4', 'G3'] },
      vox:     { steps: on(2, 10), notes: ['C5', 'G4'] },
    },
  },

  // ---- Techno: driving, hypnotic, dark stab ----
  techno: {
    bpm: 132,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      perc:    { steps: on(3, 7, 11, 15) },
      bass:    { steps: on(2, 6, 10, 14), notes: ['A1', 'A1', 'A1', 'A1'] },
      supersaw:{ steps: on(0, 3, 8, 11), notes: ['A3', 'A3', 'C4', 'C4'] },
      vox:     { steps: on(0, 8), notes: ['A4', 'A4'] },
    },
  },

  // ---- Hard Techno: faster, distorted kick + rave hoover ----
  'hard-techno': {
    bpm: 150,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      clap:    { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      perc:    { steps: on(7, 15) },
      bass:    { steps: on(2, 6, 10, 14), notes: ['E2', 'E2', 'E2', 'E2'] },
      supersaw:{ steps: on(0, 4, 8, 12), notes: ['E4', 'E4', 'G4', 'E4'] },
      vox:     { steps: on(0, 8), notes: ['E4', 'E4'] },
    },
  },

  // ---- Schranz: relentless distorted industrial loop techno ----
  schranz: {
    bpm: 155,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      clap:    { steps: on(4, 12) },
      perc:    { steps: on(2, 3, 6, 7, 10, 11, 14, 15) },
      hat:     { steps: on(0, 2, 4, 6, 8, 10, 12, 14) },
      bass:    { steps: on(0, 4, 8, 12), notes: ['C2', 'C2', 'C2', 'C2'] },
      supersaw:{ steps: on(0, 8), notes: ['C4', 'D#4'] },
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
