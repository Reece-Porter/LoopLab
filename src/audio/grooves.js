// Genre-specific groove definitions so each style actually sounds like itself.
// Each genre maps a generic "voice" (from voiceFor) to a rhythm plus the notes
// it should play, AND the genre-correct instrument variant:
//   tone:   drum machine character ('909' | '808' | 'rumble' | 'hard' | 'lofi' | 'dnb' | 'trap' | 'garage' | 'conga')
//   acid:   TB-303 squelch bass        sub:    clean sine sub bass
//   organ:  M1/Hammond garage organ    rhodes: electric piano chords
//   rolls:  steps that fire fast hat retrigs (trap)
//   pad:    slow-attack detuned-saw pad (held chords)
// Patterns can be 16 steps (1 bar), 32 (2 bars) or 64 (4 bars) — the player
// loops each clip by its own length, phase-locked to the song grid.

import { noteToFreq, chordToFreqs } from './theory'

const steps = (len, list) => {
  const a = new Array(len).fill(0)
  list.forEach(s => { a[s] = 1 })
  return a
}
const on  = (...list) => steps(16, list)
const on2 = (...list) => steps(32, list)
const on4 = (...list) => steps(64, list)

export const GENRE_GROOVES = {

  // ---- Eurodance: Haddaway / 2 Unlimited / Culture Beat — Am, 138 BPM ----
  eurodance: {
    bpm: 138,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      snare:   { steps: on(4,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      // Root-octave bounce bassline following Am–F–C–G over 2 bars
      bass:    { steps: on2(0,2,4,6,8,10,12,14, 16,18,20,22,24,26,28,30),
                 notes: ['A1','A2','A1','A2','F1','F2','F1','F2','C2','C3','C2','C3','G1','G2','G1','G2'] },
      // Supersaw lead — arpeggiated Am hook, call and answer over 2 bars
      supersaw:{ steps: on2(0,3,6,8,11,14, 16,19,22,24,27,30),
                 notes: ['A4','C5','E5','C5','A4','G4', 'F4','A4','C5','E5','D5','C5'] },
      // Pumping supersaw chord stab every beat — the Eurodance signature
      chord:   { steps: on2(0,4,8,12,16,20,24,28), chords: ['Am','Am','F','F','C','C','G','G'], rave: true, gain: 0.35 },
      // Melodic keys line doubling the hook (replaces goofy vocal synth)
      vox:     { steps: on2(0,4,8,12, 16,20,24,28), notes: ['E5','C5','A4','G4','E5','D5','C5','A4'] },
      riser:   { steps: on(0), notes: ['A4'] },
    },
  },

  // ---- Trap: Metro Boomin / Southside — Cm, half-time ----
  trap: {
    bpm: 142,
    swing: 0,
    voices: {
      kick:    { steps: on2(0,7,10, 16,19,26), tone: '808' },
      snare:   { steps: on(8), tone: 'trap' },
      clap:    { steps: on(8) },
      hat:     { steps: on(0,2,4,6,7,8,10,12,14,15), rolls: [7,15], tone: 'trap' },
      eight08: { steps: on2(0,7,10, 16,19,26), notes: ['C1','C1','D#1','C1','G#0','A#0'], long: true },
      bass:    { steps: on2(0,7,10, 16,19,26), notes: ['C1','C1','D#1','C1','G#0','A#0'], long: true },
      // Dark minor-pentatonic pluck melody — sparse like a real trap melody loop
      pluck:   { steps: on2(0,3,6,10, 16,20,26,29), notes: ['C5','D#5','G4','A#4','C5','G4','D#5','C5'] },
      chord:   { steps: on2(0,16), chords: ['Cm','Gm'], pad: true },
      // Melodic keys line in Cm (replaces goofy vocal synth)
      vox:     { steps: on2(2,10,18,26), notes: ['D#4','G4','A#4','G4'] },
    },
  },

  // ---- Deep House: Larry Heard / Kerri Chandler — Fm, warm and soulful ----
  'deep-house': {
    bpm: 124,
    swing: 0.12,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      snare:   { steps: on(4,12), tone: '909' },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      // Warm off-beat sub bass walking the Fm scale
      bass:    { steps: on(2,6,10,14), notes: ['F1','F1','G#1','C2'], sub: true },
      // Rhodes electric-piano off-beat chords — the deep house signature
      chord:   { steps: on2(2,10,18,26), chords: ['Fm7','Fm7','A#maj7','D#maj7'], rhodes: true },
      // Pluck lick — short pentatonic phrase in Fm over 2 bars
      pluck:   { steps: on2(0,5,10, 16,22,28), notes: ['F4','G#4','C5','A#4','G4','F4'] },
      // Soft keys melodic phrase in Fm (replaces goofy vocal synth)
      vox:     { steps: on2(2,10,18,26), notes: ['F4','G#4','C5','A#4'] },
    },
  },

  // ---- Drum & Bass: Amen break + sine sub + Reese — Dm, 174 BPM ----
  'drum-and-bass': {
    bpm: 174,
    swing: 0,
    voices: {
      break:   { steps: on2(0,4,7,10,12, 16,20,23,26,28), snares: [4,7,12,20,23,28], tone: 'dnb' },
      kick:    { steps: on2(0,10,16,26), tone: 'dnb' },
      snare:   { steps: on2(4,12,20,28), tone: 'dnb' },
      hat:     { steps: on(2,6,11,14), tone: '909' },
      // Clean sub holding long low notes
      eight08: { steps: on2(0,12,16), notes: ['D1','D1','F1'], long: true },
      bass:    { steps: on2(0,12,16), notes: ['D1','D1','F1'], long: true, sub: true },
      // Growling Reese mid-bass — syncopated against the sub
      reese:   { steps: on2(0,6,11,16,22,27), notes: ['D2','D2','F2','D2','A1','C2'] },
      // Liquid DnB lead — ascending Dm7 phrase over 2 bars
      pluck:   { steps: on2(0,6,12,18, 24,28), notes: ['D5','F5','A5','C5','G5','F5'] },
      chord:   { steps: on2(0,16), chords: ['Dm7','Gm7'], pad: true },
      // Soft keys melody in Dm (replaces goofy vocal synth)
      vox:     { steps: on2(0,8,16,24), notes: ['D5','F5','A4','C5'] },
    },
  },

  // ---- Lo-Fi Hip-Hop: dusty boom-bap, jazzy Rhodes, lazy swing — Dm ----
  'lo-fi-hip-hop': {
    bpm: 82,
    swing: 0.22,
    voices: {
      kick:    { steps: on(0,7,10), tone: 'lofi' },
      snare:   { steps: on(4,12), tone: 'lofi' },
      hat:     { steps: on(0,2,4,6,8,10,12,14), tone: 'lofi' },
      // Round sub bass walking a jazzy line
      bass:    { steps: on2(0,8,16,22,28), notes: ['D2','A1','G1','A1','C2'], sub: true },
      // Jazzy Rhodes 7th chords over 2 bars
      chord:   { steps: on2(0,10,16,26), chords: ['Dm7','Gmaj7','A#maj7','Am7'], rhodes: true },
      // Soft pluck melody — 2-bar pentatonic phrase, sparse and breathing
      pluck:   { steps: on2(2,8,14, 20,26), notes: ['F4','A4','D5','C5','A4'] },
      // Warm melodic keys phrase (replaces goofy vocal synth)
      vox:     { steps: on2(0,8,18,26), notes: ['F4','A4','D5','C5'] },
    },
  },

  // ---- Hard Groove: Ben Sims / tribal techno — Dm, percussion-led ----
  'hard-groove': {
    bpm: 135,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      // Rolling conga tribal engine
      perc:    { steps: on(2,3,5,7,10,11,13,15), tone: 'conga' },
      // Syncopated bass locked to congas
      bass:    { steps: on(0,3,6,10,14), notes: ['D2','D2','A1','D2','F2'] },
      // Dark synth chord stabs — off-beat, letting the percussion breathe
      supersaw:{ steps: on2(2,10,18,26), chords: ['Dm','Dm','Am','Dm'] },
      // Sparse keys phrase in Dm (replaces goofy vocal synth)
      vox:     { steps: on2(1,9,17,25), notes: ['D5','A4','F5','D5'] },
    },
  },

  // ---- Hard House: Tidy Trax / Lisa Lashes — Cm, hoover + donk ----
  'hard-house': {
    bpm: 150,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      // Driving off-beat octave bass
      bass:    { steps: on(2,6,10,14), notes: ['C2','C2','G1','A#1'] },
      // Donk on every off-8th
      donk:    { steps: on(2,4,6,8,10,12,14), notes: ['C3','C4','G3','C3','C4','A#3','G3'] },
      // HOOVER stab — the hard house rave noise, syncopated so it punches
      supersaw:{ steps: on2(0,12,16,28), notes: ['C4','D#4','C4','G4'], hoover: true },
      // Melodic keys line in Cm (replaces goofy vocal synth)
      vox:     { steps: on2(0,8,16,24), notes: ['C5','G4','A#4','C5'] },
    },
  },

  // ---- Piano House: classic uplifting stabs over a warm groove — Fm ----
  house: {
    bpm: 125,
    swing: 0.08,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      // Bouncing off-beat bass — the house pump
      bass:    { steps: on(2,6,10,14), notes: ['F1','F1','A#1','C2'] },
      // THE piano stabs: syncopated off-beat 7th chords cycling over 2 bars
      piano:   { steps: on2(2,6,10,14, 18,22,26,30),
                 chords: ['Fm7','Fm7','A#maj7','A#maj7','D#maj7','D#maj7','Cm7','Cm7'] },
      // Melodic keys response in Fm (replaces goofy vocal synth)
      vox:     { steps: on2(0,6,12,20, 26), notes: ['F4','A4','C5','G4','F4'] },
    },
  },

  // ---- Speed Garage: Double 99 / 187 Lockdown — Gm, 4×4 + sub bends ----
  'speed-garage': {
    bpm: 138,
    swing: 0.25,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      snare:   { steps: on(4,12), tone: 'garage' },
      hat:     { steps: on(2,5,7,10,13,15), open: true, tone: '909' },
      perc:    { steps: on(3,11), tone: 'conga' },
      // Warping Reese sub — octave drops, the RIP groove
      reese:   { steps: on2(0,3,8,11, 16,19,24,30), notes: ['G1','G2','G1','A#1','G1','G2','F1','G1'] },
      bass:    { steps: on2(0,8,16,24), notes: ['G1','G1','F1','G1'], long: true, sub: true },
      // M1 organ stabs — the garage signature sound
      piano:   { steps: on2(2,10, 18,27), chords: ['Gm7','Gm7','Cm7','D7'], organ: true },
      // Melodic keys line in Gm (replaces goofy vocal synth)
      vox:     { steps: on2(0,6,16,22), notes: ['G4','A#4','D5','C5'] },
    },
  },

  // ---- Bouncy Techno: 240km/h / Adrian Mills — Am, relentless donk ----
  'bouncy-techno': {
    bpm: 165,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      donk:    { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','G2','G3','A2','A3'] },
      // Rave chord stabs every half-bar — punchy and full, not single-note thin
      supersaw:{ steps: on2(0,8,16,24), chords: ['Am','G','Am','C'] },
      // Melodic keys over the stabs in Am (replaces goofy vocal synth)
      vox:     { steps: on2(0,4,8,12,16,20,24,28), notes: ['A4','E5','C5','A4','G4','E5','C5','A4'] },
    },
  },

  // ---- Tech House: FISHER / Hot Since 82 — Cm, rolling low groove ----
  'tech-house': {
    bpm: 126,
    swing: 0.08,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      perc:    { steps: on(3,7,11,15), tone: 'conga' },
      // Rolling sub bass — off-beat Cm with chromatic walk at phrase end
      bass:    { steps: on2(2,6,10,14, 18,22,26,29,31),
                 notes: ['C2','C2','C2','D#2','C2','C2','G1','A#1','B1'], sub: true },
      // Vocal-chop style chord stabs on the off-beat — the tech house hook
      supersaw:{ steps: on2(2,6,18,22), chords: ['Cm7','Cm7','A#maj7','Cm7'] },
      // Melodic keys phrase in Cm (replaces goofy vocal synth)
      vox:     { steps: on2(2,10,18,26), notes: ['C5','D#5','G4','A#4'] },
    },
  },

  // ---- Techno: Adam Beyer / Charlotte de Witte — Am, rumble + hypnosis ----
  techno: {
    bpm: 132,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: 'rumble' },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      perc:    { steps: on(3,11), tone: '909' },
      // Off-beat sub locked to the rumble kick
      bass:    { steps: on(2,6,10,14), notes: ['A1','A1','A1','G1'], sub: true },
      // Dark chord stab — minimal, every half-bar, hypnotic
      supersaw:{ steps: on2(2,18), chords: ['Am','Gm'] },
      // Jeff Mills "The Bells" — 4 notes then 3 bars silence, 4-bar loop
      bell:    { steps: on(0,2,4,6), notes: ['A3','C4','E4','D4'], bell: true },
      // Sparse melodic keys in Am (replaces goofy vocal synth)
      vox:     { steps: on2(0,12,16,28), notes: ['A4','C5','G4','A4'] },
    },
  },

  // ---- Hard Techno: Sara Landry / 999999999 — Em, distorted assault ----
  'hard-techno': {
    bpm: 150,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: 'hard' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      perc:    { steps: on(7,15), tone: '909' },
      // Relentless off-beat acid bass — squelching TB-303
      bass:    { steps: on(2,6,10,14), notes: ['E2','E2','E2','B1'], acid: true, accents: [2,10] },
      // Hoover screech — syncopated hard techno rave noise
      supersaw:{ steps: on2(0,12,16,28), notes: ['E4','G4','E4','B4'], hoover: true },
      // Sparse melodic keys phrase in Em (replaces goofy vocal synth)
      vox:     { steps: on2(2,18), notes: ['E5','B4'] },
    },
  },

  // ---- Schranz: DJ Rush / Chris Liebing — relentless industrial loop, Cm ----
  schranz: {
    bpm: 155,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: 'hard' },
      clap:    { steps: on(4,12) },
      perc:    { steps: on(1,2,5,6,9,10,13,14), tone: 'conga' },
      hat:     { steps: on(0,2,4,6,8,10,12,14), tone: '909' },
      // Hammering quarter-note distorted acid bass
      bass:    { steps: on(0,4,8,12), notes: ['C2','C2','C2','C2'], acid: true, accents: [0,8] },
      // Brutal chord stabs every off-beat — no softness, straight sawtooth aggression
      supersaw:{ steps: on(2,6,10,14), chords: ['Cm','Cm','A#','Gm'] },
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
