// Genre-specific groove definitions so each style actually sounds like itself.
// Each genre maps a generic "voice" (from voiceFor) to a rhythm plus the notes
// it should play, AND the genre-correct instrument variant:
//   tone:   drum machine character ('909' | '808' | 'rumble' | 'hard' | 'lofi' | 'dnb' | 'trap' | 'garage' | 'conga')
//   acid:   TB-303 squelch bass        sub:    clean sine sub bass
//   organ:  M1/Hammond garage organ    rhodes: electric piano chords
//   rolls:  steps that fire fast hat retrigs (trap)
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

  // ---- Eurodance: Haddaway / 2 Unlimited / Culture Beat ----
  // 909 four-to-the-floor, THE octave-jumping 8th-note bass, supersaw lead
  // hook riding an Am–F–C–G progression, big synth-string pad underneath.
  eurodance: {
    bpm: 138,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      snare:   { steps: on(4,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      // THE signature: root–octave bouncing 8th bass, following the progression
      bass:    { steps: on2(0,2,4,6,8,10,12,14, 16,18,20,22,24,26,28,30),
                 notes: ['A1','A2','A1','A2','F1','F2','F1','F2','C2','C3','C2','C3','G1','G2','G1','G2'] },
      eight08: { steps: on(0,2,4,6,8,10,12,14), notes: ['A1','A2','A1','A2'] },
      // Anthemic supersaw hook over 2 bars — call and answer phrase
      supersaw:{ steps: on2(0,3,6,8,11,14, 16,19,22,24,27,30),
                 notes: ['A4','C5','E5','C5','A4','G4', 'F4','A4','C5','E5','D5','C5'] },
      pluck:   { steps: on(0,3,6,8,11,14), notes: ['A4','E5','C5','A4','G4','E5'] },
      // Synth-string pad: one chord per bar over the full 4-bar progression.
      // gain trims it well under the lead — it's a bed, not a hook.
      chord:   { steps: on4(0,16,32,48), chords: ['Am','F','C','G'], pad: true, gain: 0.45 },
      vox:     { steps: on2(0,6,16,22), notes: ['A4','C5','E5','D5'] },
      riser:   { steps: on(0), notes: ['A4'] },
    },
  },

  // ---- Trap: Metro Boomin / Southside style — Cm, half-time ----
  // Booming 808 glide bass, snare on beat 3, ticky hats with rolls,
  // dark sparse minor-key bell melody.
  trap: {
    bpm: 142,
    swing: 0,
    voices: {
      kick:    { steps: on2(0,7,10, 16,19,26), tone: '808' },
      snare:   { steps: on(8), tone: 'trap' },
      clap:    { steps: on(8) },
      // Ticky 8th hats with 16th fills and rolls into the snare and bar-end
      hat:     { steps: on(0,2,4,6,7,8,10,12,14,15), rolls: [7,15], tone: 'trap' },
      // 808 glide bass following the kick — long booming notes
      eight08: { steps: on2(0,7,10, 16,19,26), notes: ['C1','C1','D#1','C1','G#0','A#0'], long: true },
      bass:    { steps: on2(0,7,10, 16,19,26), notes: ['C1','C1','D#1','C1','G#0','A#0'], long: true },
      // Dark sparse bell-ish melody over 2 bars — space is the point
      pluck:   { steps: on2(0,6,12, 16,22,25), notes: ['C5','D#5','G4','G#4','G4','D#5'] },
      chord:   { steps: on2(0,16), chords: ['Cm','G#'], pad: true },
      vox:     { steps: on2(4,12,20), notes: ['D#4','G4','C5'] },
    },
  },

  // ---- Deep House: Larry Heard / Kerri Chandler — warm, soulful ----
  // Soft swung groove, off-beat bass, Rhodes m9 chords, gentle.
  'deep-house': {
    bpm: 124,
    swing: 0.12,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      snare:   { steps: on(4,12), tone: '909' },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      // Warm off-beat sub bass walking the minor scale
      bass:    { steps: on(2,6,10,14), notes: ['F1','F1','G#1','C2'], sub: true },
      // Rhodes electric-piano chords — the deep house signature
      chord:   { steps: on2(2,10,18,26), chords: ['Fm7','Fm7','A#maj7','D#maj7'], rhodes: true },
      pluck:   { steps: on2(0,6,14, 22,28), notes: ['F4','G#4','C5','A#4','G4'] },
      vox:     { steps: on2(2,18), notes: ['G#4','G4'] },
    },
  },

  // ---- Drum & Bass: Amen-style 2-bar break + sine sub + Reese ----
  'drum-and-bass': {
    bpm: 174,
    swing: 0,
    voices: {
      // Proper 2-bar chopped break — kicks and snares displaced bar to bar
      break:   { steps: on2(0,4,7,10,12, 16,20,23,26,28), snares: [4,7,12,20,23,28], tone: 'dnb' },
      kick:    { steps: on2(0,10,16,26), tone: 'dnb' },
      snare:   { steps: on2(4,12,20,28), tone: 'dnb' },
      hat:     { steps: on(2,6,11,14), tone: '909' },
      // Clean sine sub holding the low end — long notes, minimal movement
      eight08: { steps: on2(0,12,16), notes: ['D1','D1','F1'], long: true },
      bass:    { steps: on2(0,12,16), notes: ['D1','D1','F1'], long: true, sub: true },
      // Growling Reese mid-bass, syncopated against the sub
      reese:   { steps: on2(0,6,11,16,22,27), notes: ['D2','D2','F2','D2','A1','C2'] },
      pluck:   { steps: on2(0,8,16,24), notes: ['D5','F5','A5','G5'] },
      chord:   { steps: on2(0), chords: ['Dm7'], pad: true },
      vox:     { steps: on2(0,20), notes: ['C5','D5'] },
    },
  },

  // ---- Lo-Fi Hip-Hop: dusty boom-bap, jazzy Rhodes, lazy swing ----
  'lo-fi-hip-hop': {
    bpm: 82,
    swing: 0.22,
    voices: {
      kick:    { steps: on(0,7,10), tone: 'lofi' },
      snare:   { steps: on(4,12), tone: 'lofi' },
      hat:     { steps: on(0,2,4,6,8,10,12,14), tone: 'lofi' },
      // Round sine sub walking a jazzy line
      bass:    { steps: on2(0,8,16,22,28), notes: ['D2','A1','G1','A#1','C2'], sub: true },
      // Jazzy Rhodes 7th chords drifting over 2 bars
      chord:   { steps: on2(0,16,24), chords: ['Dm7','Gmaj7','A#maj7'], rhodes: true },
      pluck:   { steps: on2(6,12, 20,27), notes: ['F4','A4','E5','D5'] },
      vox:     { steps: on2(4,20), notes: ['E4','G4'] },
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
      // Rolling conga pattern — the tribal engine of the groove
      perc:    { steps: on(2,3,5,7,10,11,13,15), tone: 'conga' },
      // Driving syncopated bass locking with the congas
      bass:    { steps: on(0,3,6,10,14), notes: ['D2','D2','A1','D2','F2'] },
      // Short dark stab, sparse — percussion leads, synths follow
      supersaw:{ steps: on2(0,8,16,26), notes: ['D4','F4','D4','A3'] },
      vox:     { steps: on2(0,16), notes: ['D5','C5'] },
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
      // Donk bouncing on every off-8th — the signature bonk
      donk:    { steps: on(2,4,6,8,10,12,14), notes: ['C3','C4','G3','C3','C4','A#3','G3'] },
      // Proper HOOVER stab — the hard house rave noise, on the downbeats
      supersaw:{ steps: on2(0,8,16,24), notes: ['C4','C4','D#4','C4'], hoover: true },
      vox:     { steps: on2(0,16), notes: ['C5','A#4'] },
    },
  },

  // ---- Piano House: classic uplifting stabs over an organ-bass groove ----
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
      vox:     { steps: on2(0,12,16), notes: ['F4','G#4','A#4'] },
    },
  },

  // ---- Speed Garage: Double 99 / 187 Lockdown — Gm, 4×4 + sub bends ----
  // Four-to-the-floor (NOT 2-step), skippy swung hats, warping Reese sub,
  // M1 organ stabs, chopped vocal.
  'speed-garage': {
    bpm: 138,
    swing: 0.25,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      snare:   { steps: on(4,12), tone: 'garage' },
      // Skippy shuffled garage hats
      hat:     { steps: on(2,5,7,10,13,15), open: true, tone: '909' },
      perc:    { steps: on(3,11), tone: 'conga' },
      // Warping Reese sub — octave drops and bends, the RIP groove
      reese:   { steps: on2(0,3,8,11, 16,19,24,30), notes: ['G1','G2','G1','A#1','G1','G2','F1','G1'] },
      bass:    { steps: on2(0,8,16,24), notes: ['G1','G1','F1','G1'], long: true, sub: true },
      // M1 organ stabs — the garage signature sound
      piano:   { steps: on2(2,10, 18,27), chords: ['Gm7','Gm7','Cm7','D7'], organ: true },
      vox:     { steps: on2(0,6,16,22), notes: ['G4','A#4','D5','C5'] },
    },
  },

  // ---- Bouncy Techno: 240km/h-style relentless donk bounce ----
  'bouncy-techno': {
    bpm: 165,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: '909' },
      clap:    { steps: on(4,12) },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      donk:    { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','G2','G3','A2','A3'] },
      supersaw:{ steps: on2(0,8,16,24), notes: ['A4','G4','A4','C5'] },
      vox:     { steps: on2(0,16), notes: ['A4','E5'] },
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
      // Clicky minimal perc filling the pocket
      perc:    { steps: on(3,7,11,15), tone: 'conga' },
      // THE rolling tech-house bassline: round subby off-beats with a
      // chromatic walk at the phrase end
      bass:    { steps: on2(2,6,10,14, 18,22,26,29,31),
                 notes: ['C2','C2','C2','D#2','C2','C2','G1','A#1','B1'], sub: true },
      // Minimal chopped vocal-stab hook — one hit per 2 bars
      supersaw:{ steps: on2(0,16), notes: ['C4','A#3'] },
      vox:     { steps: on2(2,10,18), notes: ['C5','D#5','C5'] },
    },
  },

  // ---- Techno: Adam Beyer / Charlotte de Witte — Am, rumble + hypnosis ----
  techno: {
    bpm: 132,
    swing: 0,
    voices: {
      // Rumble kick: punch + saturated low tail filling the gaps
      kick:    { steps: on(0,4,8,12), tone: 'rumble' },
      hat:     { steps: on(2,6,10,14), open: true, tone: '909' },
      perc:    { steps: on(3,11), tone: '909' },
      // Hypnotic off-beat sub locked to the rumble
      bass:    { steps: on(2,6,10,14), notes: ['A1','A1','A1','G1'], sub: true },
      // Dark minimal stab on a 2-bar cycle — hypnotic repetition
      supersaw:{ steps: on2(0,8,16,26), notes: ['A3','E3','A3','G3'] },
      vox:     { steps: on2(0,16), notes: ['A4','A4'] },
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
      // Relentless driving off-beat bass — acid-tinged squelch
      bass:    { steps: on(2,6,10,14), notes: ['E2','E2','E2','B1'], acid: true, accents: [2,10] },
      // Aggressive hoover screech on the phrase downbeats
      supersaw:{ steps: on2(0,12,16,28), notes: ['E4','E4','G4','E4'], hoover: true },
      vox:     { steps: on2(0,16), notes: ['E4','B4'] },
    },
  },

  // ---- Schranz: DJ Rush / Chris Liebing — relentless industrial loop ----
  schranz: {
    bpm: 155,
    swing: 0,
    voices: {
      kick:    { steps: on(0,4,8,12), tone: 'hard' },
      clap:    { steps: on(4,12) },
      // Dense industrial percussion loop — every 8th, rolling
      perc:    { steps: on(1,2,5,6,9,10,13,14), tone: 'conga' },
      hat:     { steps: on(0,2,4,6,8,10,12,14), tone: '909' },
      // Hammering quarter-note distorted bass
      bass:    { steps: on(0,4,8,12), notes: ['C2','C2','C2','C2'], acid: true, accents: [0,8] },
      supersaw:{ steps: on2(0,16), notes: ['C4','D#4'] },
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
