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
// and a per-voice pattern. A pattern has { steps, notes?, open? } where notes
// is a list cycled through on each hit.
export const GENRE_GROOVES = {

  // ---- Eurodance: Haddaway / Snap! / 2 Unlimited sound ----
  // 4-on-the-floor, running 8th-note bass, supersaw melody on Am-F-C-G.
  eurodance: {
    bpm: 138,
    swing: 0,
    voices: {
      kick:    { steps: on(0, 4, 8, 12) },
      snare:   { steps: on(4, 12) },
      hat:     { steps: on(2, 6, 10, 14), open: true },
      // Running 8th-note bass — Am root with walk-up
      bass:    { steps: on(0,2,4,6,8,10,12,14), notes: ['A1','A1','C2','E2','A1','A1','G1','E1'] },
      eight08: { steps: on(0,2,4,6,8,10,12,14), notes: ['A1','A1','C2','E2'] },
      // Classic Eurodance supersaw hook: A-C-E motif over Am-F-C-G
      supersaw:{ steps: on(0,2,4,6,8,10,12,14), notes: ['A4','C5','E5','C5','G4','A#4','C5','G4'] },
      pluck:   { steps: on(0,3,6,8,11,14),       notes: ['A4','E5','C5','A4','G4','E5'] },
      chord:   { steps: on(0,4,8,12), chords: ['Am','F','G','Em'] },
      vox:     { steps: on(0,8),     notes: ['A4','C5'] },
    },
  },

  // ---- Trap ----
  trap: {
    bpm: 142,
    swing: 0,
    voices: {
      kick:    { steps: on(0,6,10) },
      snare:   { steps: on(8) },
      hat:     { steps: on(0,2,3,4,6,8,10,11,12,14,15) },
      eight08: { steps: on(0,6,10), notes: ['C1','C1','D#1'], long: true },
      bass:    { steps: on(0,6,10), notes: ['C1','C1','D#1'], long: true },
      pluck:   { steps: on(0,3,6,7,10,12), notes: ['C5','D#5','G5','F5','D#5','C5'] },
      chord:   { steps: on(0,10), chords: ['Cm','G#'] },
      vox:     { steps: on(0,8,12), notes: ['Eb4','G4','Bb4'] },
    },
  },

  // ---- Deep House: Larry Heard / Kerri Chandler vibe ----
  'deep-house': {
    bpm: 124,
    swing: 0.12,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      snare:   { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      bass:    { steps: on(2,6,10,14), notes: ['F1','F1','A#1','C2'] },
      chord:   { steps: on(2,10), chords: ['Fm7','A#maj7'], keys: true },
      pluck:   { steps: on(0,6,8,14), notes: ['F4','A#4','C5','A#4'] },
      vox:     { steps: on(2,10), notes: ['A4','G4'] },
    },
  },

  // ---- Drum & Bass: Amen-style break + Reese sub ----
  'drum-and-bass': {
    bpm: 174,
    swing: 0,
    voices: {
      break:   { steps: on(0,10), snares: [4,7,12] },
      kick:    { steps: on(0,10) },
      snare:   { steps: on(4,12) },
      hat:     { steps: on(2,6,14) },
      eight08: { steps: on(0,8), notes: ['D1','D1'], long: true },
      bass:    { steps: on(0,8), notes: ['D1','D1'], long: true },
      reese:   { steps: on(0,6,8,14), notes: ['D2','D2','F2','A2'] },
      pluck:   { steps: on(0,4,8,12), notes: ['D5','F5','A5','D5'] },
      chord:   { steps: on(0), chords: ['Dm'], pad: true },
      vox:     { steps: on(0,12), notes: ['C5','Eb5'] },
    },
  },

  // ---- Lo-Fi Hip-Hop: lazy, swung boom-bap ----
  'lo-fi-hip-hop': {
    bpm: 82,
    swing: 0.22,
    voices: {
      kick:    { steps: on(0,7,8) },
      snare:   { steps: on(4,12) },
      hat:     { steps: on(0,2,4,6,8,10,12,14) },
      bass:    { steps: on(0,8), notes: ['D2','G2'] },
      chord:   { steps: on(0,8), chords: ['Dm7','Gmaj7'], keys: true },
      pluck:   { steps: on(2,6,10,14), notes: ['F4','A4','C5','D5'] },
      vox:     { steps: on(4,12), notes: ['E4','G4'] },
    },
  },

  // ---- Hard Groove: Ben Sims / Jeff Mills tribal techno in Dm ----
  // Busy percussion, driving off-beat bass, short stabbed chords.
  'hard-groove': {
    bpm: 135,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      // Tight triplet-feel perc on the offbeats
      perc:    { steps: on(3,6,7,11,13,15) },
      // Bass locks to kick + off-beat with Dm root movement
      bass:    { steps: on(0,3,6,10,14), notes: ['D2','D2','A1','D2','F2'] },
      // Short staccato supersaw stab on beat 1 and beat 3 (Dm flavour)
      supersaw:{ steps: on(0,8), notes: ['D4','F4'] },
      vox:     { steps: on(0,8), notes: ['D5','C5'] },
    },
  },

  // ---- Hard House: Lisa Lashes / Tidy Trax — Cm, driving donk ----
  // Hoover stab on every beat, donk bouncing root–5th, rolling bass.
  'hard-house': {
    bpm: 150,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      // Bass: Cm root + 5th walk
      bass:    { steps: on(0,2,6,8,10,14), notes: ['C2','C2','G2','C2','A#1','G1'] },
      // Donk bounces root → octave on 8th notes — the signature bonk
      donk:    { steps: on(2,4,6,8,10,12,14), notes: ['C3','C4','G3','C3','C4','A#3','G3'] },
      // Short hoover stab: one hit at the top of the bar
      supersaw:{ steps: on(0,8), notes: ['C4','G3'] },
      vox:     { steps: on(0,8), notes: ['C5','A#4'] },
    },
  },

  // ---- Piano House: classic uplifting Fm7 / A#maj7 stabs ----
  house: {
    bpm: 125,
    swing: 0.08,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      // Off-beat Fm groove bass
      bass:    { steps: on(2,6,10,14), notes: ['F1','A#1','C2','A#1'] },
      // Piano stabs on the offbeat (the piano-house signature)
      piano:   { steps: on(2,6,10,14), chords: ['Fm7','A#maj7','Cm7','Gm7'] },
      vox:     { steps: on(0,8), notes: ['F4','A#4'] },
    },
  },

  // ---- Speed Garage / UKG: Wookie / Double 99 — Gm, 2-step ----
  // Heavy swing, growling Reese sub, garage organ stabs.
  'speed-garage': {
    bpm: 135,
    swing: 0.30,
    voices: {
      kick:    { steps: on(0,10) },
      snare:   { steps: on(4,12) },
      // UKG shuffled hi-hat feel
      hat:     { steps: on(2,5,6,9,11,14), open: true },
      // Reese sub bass: Gm root + walk-up
      reese:   { steps: on(0,3,6,8,11,14), notes: ['G1','G1','A#1','C2','C2','D2'] },
      bass:    { steps: on(0,6,10),         notes: ['G1','A#1','C2'], long: true },
      // Minor 7th organ stabs on the off-beat
      piano:   { steps: on(2,8,11), chords: ['Gm7','Cm7','D7'] },
      vox:     { steps: on(0,8), notes: ['G4','A#4'] },
    },
  },

  // ---- Bouncy Techno: 240km/h / Adrian Mills — Am, relentless donk ----
  // Donk bounces root–octave on every 8th, simple supersaw stab every 4 beats.
  'bouncy-techno': {
    bpm: 165,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      // Donk: A root bouncing A2→A3→A2→A3 on every 8th note — the 240 sound
      donk:    { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','G2','G3','A2','A3'] },
      // Simple two-chord supersaw stab on beat 1 and beat 3
      supersaw:{ steps: on(0,8), notes: ['A4','G4'] },
      vox:     { steps: on(0,8), notes: ['A4','E5'] },
    },
  },

  // ---- Tech House: FISHER / Hot Since 82 — Cm, rolling groove ----
  // Driving bass with chromatic fills, minimal vocal stab chop.
  'tech-house': {
    bpm: 126,
    swing: 0.08,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      // Syncopated perc between the kick and hat
      perc:    { steps: on(3,7,11,15) },
      // Bass: C root with chromatic movement — the FISHER groove
      bass:    { steps: on(0,2,4,6,8,10,12,14), notes: ['C2','C2','D#2','D#2','G2','G2','C2','A#1'] },
      // One short vocal-stab chop on beat 1 only
      supersaw:{ steps: on(0,8), notes: ['C4','A#3'] },
      vox:     { steps: on(2,10), notes: ['C5','D#5'] },
    },
  },

  // ---- Techno: Adam Beyer / Charlotte de Witte — Am, hypnotic ----
  // One-note pounding bass, dark minimal stab on beat 1 only.
  techno: {
    bpm: 132,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      // Syncopated perc — slightly after the hat
      perc:    { steps: on(3,11) },
      // Pounding 8th-note bass locked to A root — minimal and driving
      bass:    { steps: on(0,2,4,6,8,10,12,14), notes: ['A1','A1','A1','G1','A1','A1','G1','E1'] },
      // Single dark stab hit on beat 1 and beat 3, Amin flavour
      supersaw:{ steps: on(0,8), notes: ['A3','E3'] },
      vox:     { steps: on(0,8), notes: ['A4','A4'] },
    },
  },

  // ---- Hard Techno: Sara Landry / 999999999 — Em, aggressive ----
  // Faster, heavier kick, distorted lead stab every 4 steps.
  'hard-techno': {
    bpm: 150,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true },
      // Short burst perc after the hat
      perc:    { steps: on(7,15) },
      // Relentless 8th-note distorted bass in Em
      bass:    { steps: on(0,2,4,6,8,10,12,14), notes: ['E2','E2','E2','B1','E2','E2','D2','B1'] },
      // Aggressive stab: E4 on every beat with a G4 throw on beat 3
      supersaw:{ steps: on(0,4,8,12), notes: ['E4','E4','G4','E4'] },
      vox:     { steps: on(0,8), notes: ['E4','B4'] },
    },
  },

  // ---- Schranz: Chris Liebing / DJ Rush — Cm, relentless industrial ----
  // Every 16th crammed with percussion, bass on every quarter beat.
  schranz: {
    bpm: 155,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12) },
      clap:    { steps: on(4,12) },
      // Dense industrial percussion on every 8th
      perc:    { steps: on(2,4,6,8,10,12,14) },
      hat:     { steps: on(0,2,4,6,8,10,12,14) },
      // Bass: Cm root hammered on every quarter note
      bass:    { steps: on(0,4,8,12), notes: ['C2','C2','C2','C2'] },
      // Single short stab — beat 1 only, Cm root
      supersaw:{ steps: on(0), notes: ['C4'] },
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
