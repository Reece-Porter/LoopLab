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
const on8 = (...list) => steps(128, list)

export const GENRE_GROOVES = {

  // ---- Eurodance: built from the tutorial video — G minor, 138 BPM ----
  // Progression Gm–F–Eb–D (i–VII–VI–V) with a descending root line. The lead is
  // the video's signature descending "staircase": four 16th-notes per scale
  // degree cascading down the G-minor scale, then a higher answer phrase. Held
  // pad chords underneath; rolling octave bass. Parts develop over a full
  // multi-bar cycle instead of looping a single bar.
  eurodance: {
    bpm: 138,
    swing: 0,
    voices: {
      // Four-on-the-floor — the constant pumping foundation (loops every bar).
      kick:    { steps: on(0,4,8,12), tone: '909' },
      // Backbeat clap on 2 & 4 for 3 bars, then a 4th-bar roll into the loop.
      snare:   { steps: on4(4,12, 20,28, 36,44, 52, 56,58,60,62), tone: '909' },
      clap:    { steps: on(4,12) },
      // Driving off-beat open hats with a 16th-note flutter at the turnaround.
      hat:     { steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58, 60,61,62,63),
                 open: true, tone: '909' },
      // Rolling octave-bounce bass on the chord roots G–F–Eb–D: bars 1–4
      // straight, bars 5–8 add passing notes and a turnaround so it keeps moving.
      bass:    { steps: on8(0,2,4,6,8,10,12,14, 16,18,20,22,24,26,28,30,
                           32,34,36,38,40,42,44,46, 48,50,52,54,56,58,60,62,
                           64,66,68,70,72,74,76,78, 80,82,84,86,88,90,92,94,
                           96,98,100,102,104,106,108,110, 112,114,116,118,120,122,124,126),
                 notes: ['G1','G2','G1','G2','G1','G2','G1','G2',
                         'F1','F2','F1','F2','F1','F2','F1','F2',
                         'D#1','D#2','D#1','D#2','D#1','D#2','D#1','D#2',
                         'D1','D2','D1','D2','D1','D2','D1','D2',
                         'G1','G2','G1','G2','G1','G2','A1','A#1',
                         'F1','F2','F1','F2','F1','F2','G1','A1',
                         'D#1','D#2','D#1','D#2','D#1','D#2','F1','G1',
                         'D1','D2','D1','D2','D1','A1','C2','D2'] },
      // Supersaw lead — the video's descending staircase. Each scale degree is
      // hammered as four 16th-notes, cascading D5→D4 over bars 1–2, then a
      // higher answer G5→G4 over bars 3–4 (variation rather than a flat loop).
      supersaw:{ steps: on4(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,
                           16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,
                           32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,
                           48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63),
                 notes: ['D5','D5','D5','D5','C5','C5','C5','C5','A#4','A#4','A#4','A#4','A4','A4','A4','A4',
                         'G4','G4','G4','G4','F4','F4','F4','F4','D#4','D#4','D#4','D#4','D4','D4','D4','D4',
                         'G5','G5','G5','G5','F5','F5','F5','F5','D#5','D#5','D#5','D#5','D5','D5','D5','D5',
                         'C5','C5','C5','C5','A#4','A#4','A#4','A#4','A4','A4','A4','A4','G4','G4','G4','G4'] },
      // Held pad chords — sustained Gm–F–Eb–D, one per bar, as in the video.
      chord:   { steps: on4(0,16,32,48), chords: ['Gm','F','D#','D'], pad: true, gain: 0.4 },
      // Vocal-hook topline (soft keys) — sparse phrases in Gm answering the lead.
      vox:     { steps: on8(24,28, 48,52,56, 88,92, 112,116,120,124),
                 notes: ['A#4','C5', 'D5','C5','A#4', 'G5','F5', 'D5','C5','A4','G4'] },
      // One slow riser swell per 4 bars, used in the build sections.
      riser:   { steps: on4(0) },
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

  // ---- Deep House: Julien Earle "DTS" template — Fm, 124 BPM, warm + soulful ----
  // Built from the tutorial video. Rhodes-driven deep house: minimal swung kick,
  // soft offbeat hats + ride, warm pizzicato/sub bass and syncopated Rhodes e-piano
  // chord stabs (the signature) with a pentatonic pluck lick. 4-bar (64-step) cycle.
  // Progression Fm7–D#maj7–A#maj7–Cm7 (i–VII–IV–v).
  'deep-house': {
    bpm: 124, swing: 0.12,
    voices: {
      kick: { steps: on(0,4,8,12), tone: '909' },
      // Clap/rim on 2&4 with ghost into bar 4
      snare: { steps: on4(4,12, 20,28, 36,44, 52,56,60), tone: '909' },
      hat: { steps: on(2,6,10,14), open: true, tone: '909' },
      // Warm offbeat pizzicato sub bass walking Fm through the chord changes
      bass: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
        notes: [
          'F1','F1','G#1','C2',
          'D#1','D#1','G1','A#1',
          'A#1','A#1','C2','D2',
          'C2','C2','D#2','C2',
        ],
        sub: true,
      },
      // Rhodes e-piano off-beat chord stabs — syncopated, one chord per bar
      chord: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
        chords: [
          'Fm7','Fm7','Fm7','Fm7',
          'D#maj7','D#maj7','D#maj7','D#maj7',
          'A#maj7','A#maj7','A#maj7','A#maj7',
          'Cm7','Cm7','Cm7','Cm7',
        ],
        rhodes: true,
      },
      // Pluck lick — pentatonic phrase in Fm developing over 4 bars
      pluck: {
        steps: on4(0,5,10, 16,21,26, 32,37,42, 48,53,58),
        notes: [
          'F4','G#4','C5',
          'D#4','G4','A#4',
          'A#4','C5','D5',
          'C5','G4','F4',
        ],
      },
      // Soft keys melodic phrase in Fm, developing over 4 bars
      vox: {
        steps: on4(2,10, 18,26, 34,42, 50,58),
        notes: ['F4','G#4', 'D#4','G4', 'A#4','D5', 'C5','F4'],
      },
    },
  },

  // ---- Drum & Bass: Julien Earle jungle template — Dm, 174 BPM ----
  // Built from the tutorial video. Classic jungle/DnB: chopped Amen/Think breakbeat,
  // 808 kick/snare, clean sine sub holding long notes that shift, growling Reese
  // mid-bass and a liquid lead. 4-bar (64-step) cycle that chops and develops.
  // Dm progression Dm–F–B♭–A (i–III–VI–V).
  'drum-and-bass': {
    bpm: 174, swing: 0,
    voices: {
      // Chopped Amen across 4 bars with a rolling turnaround fill in bar 4
      break: {
        steps: on4(
          0,4,7,10,12,
          16,20,23,26,28,
          32,36,39,42,44,
          48,52,55,58,60,62,63,
        ),
        snares: [4,7,12, 20,23,28, 36,39,44, 52,55,60,62],
        tone: 'dnb',
      },
      kick:  { steps: on4(0,10, 16,26, 32,42, 48,58), tone: 'dnb' },
      snare: { steps: on4(4,12, 20,28, 36,44, 52,60), tone: 'dnb' },
      hat:   { steps: on(2,6,11,14), tone: '909' },
      // Clean sine sub holding long low notes shifting Dm–F–B♭–A
      eight08: { steps: on4(0, 16, 32, 48), notes: ['D1','F1','A#1','A1'], long: true },
      bass:    { steps: on4(0, 16, 32, 48), notes: ['D1','F1','A#1','A1'], long: true, sub: true },
      // Growling Reese mid-bass — syncopated against the sub, developing
      reese: {
        steps: on4(0,6,11, 16,22,27, 32,38,43, 48,54,59,62),
        notes: [
          'D2','D2','F2',
          'F2','A2','F2',
          'A#1','A#1','D2',
          'A1','A1','C2','D2',
        ],
      },
      // Liquid DnB lead — ascending phrase developing over the 4-bar cycle
      pluck: {
        steps: on4(0,6,12, 18,24,30, 34,40,46, 52,58),
        notes: [
          'D5','F5','A5',
          'C6','A5','F5',
          'A#5','D6','F6',
          'A5','D5',
        ],
      },
      // Lush pad following the progression, one chord per bar
      chord: { steps: on4(0,16,32,48), chords: ['Dm7','Fmaj7','A#maj7','A7'], pad: true },
      // Soft keys melody in Dm, developing over 4 bars
      vox: {
        steps: on4(0,8, 16,24, 32,40, 48,56),
        notes: ['D5','F5', 'A4','C5', 'A#4','D5', 'A4','D5'],
      },
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

  // ---- Hard Groove: built from the Julien Earle tutorial — Dm, 140 BPM ----
  // Percussion-led tribal techno. The engine room is a rolling 16th-note perc
  // gallop that dodges the kick, dense off-beat open hats, and a rolling
  // Operator bass — all developing over a 4-bar cycle with fills instead of a
  // single repeating bar. Dark off-beat groove stabs and chopped vocal stabs
  // sit on top. Heavy shuffle swing gives it the hardgroove bounce.
  'hard-groove': {
    bpm: 140,
    swing: 0.16,
    voices: {
      // Relentless 4-on-the-floor — the foundation (loops every bar).
      kick:    { steps: on(0,4,8,12), tone: '909' },
      // Backbeat clap with a ghost-roll turnaround in bar 4.
      clap:    { steps: on4(4,12, 20,28, 36,44, 52,60, 62) },
      // Dense driving hats — off-beat opens with a 16th flutter into the loop.
      hat:     { steps: on4(0,2,4,6,8,10,12,14, 16,18,20,22,24,26,28,30,
                           32,34,36,38,40,42,44,46, 48,50,52,54,56,58,60, 61,62,63),
                 open: true, tone: '909' },
      // Rolling tribal conga/tom gallop that fills the 16th gaps around the
      // kick and busies up with a tom fill over the 4-bar cycle.
      perc:    { steps: on4(2,3,6,7,10,11,14,15,
                           18,19,22,23,26,27,29,30,31,
                           34,35,38,39,42,43,46,47,
                           50,51,54,55,58,59,61,62,63),
                 tone: 'conga' },
      // Rolling Operator bass in Dm — off-beat 16th gallop, mostly the root
      // with passing notes and a walk-up turnaround in bar 4.
      bass:    { steps: on4(2,3,6,7,10,11,14,15,
                           18,19,22,23,26,27,30,31,
                           34,35,38,39,42,43,46,47,
                           50,51,54,55,58,59,62,63),
                 notes: ['D2','D2','D2','D2','D2','D2','A1','D2',
                         'D2','D2','F2','D2','D2','D2','A1','C2',
                         'D2','D2','D2','D2','D2','D2','A1','D2',
                         'D2','D2','F2','D2','G2','F2','E2','D2'] },
      // Dark off-beat synth chord stabs — let the percussion breathe.
      supersaw:{ steps: on4(2,10, 18,26, 34,42, 50,58),
                 chords: ['Dm','Dm','Am','Dm','Dm','Dm','Gm','Am'] },
      // Sustained analog pad underneath — one chord per bar, sitting well back.
      chord:   { steps: on4(0,16,32,48), chords: ['Dm','Dm','Gm','Am'], pad: true, gain: 0.3 },
      // Chopped vocal-stab hook (soft keys) — rhythmic off-beat hits in Dm.
      vox:     { steps: on4(6,14, 22,30, 38,46, 54,62),
                 notes: ['A4','D5','A4','F5','A4','D5','A4','D5'] },
    },
  },

  // ---- Hard House: Tidy Trax / Lisa Lashes / Julien Earle — Cm, 142 BPM ----
  // Built from the tutorial video. Authentic UK hard house: punchy 909 4-on-floor,
  // wall-to-wall 16th hats (open on every "and-of-2"), offbeat octave bass tracking
  // chord changes, pitched donk blips on every "and", one screaming hoover per bar,
  // chopped vocal hook. Full 4-bar (64-step) developing cycle.
  // Chord progression Cm–Ab–Eb–Bb (i–VI–III–VII).
  'hard-house': {
    bpm: 142, swing: 0.04,
    voices: {
      kick: { steps: on(0,4,8,12), tone: '909' },
      // Clap on 2&4 throughout; bar 4 adds ghost fills for the drop
      clap: {
        steps: on4(4,12, 20,28, 36,44, 52,56,60),
        tone: '909',
      },
      // Constant 16th-note hats — open on every "and-of-2" (step 2,6,10,14)
      hat: { steps: on(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15), open: true, tone: '909' },
      // Offbeat octave-bounce bass tracking Cm–Ab–Eb–Bb over 4 bars
      bass: {
        steps: on4(
          0,2,4,6,8,10,12,14,
          16,18,20,22,24,26,28,30,
          32,34,36,38,40,42,44,46,
          48,50,52,54,56,58,60,62
        ),
        notes: [
          'C1','C2','C1','C2','C1','C2','C1','C2',
          'Ab1','Ab2','Ab1','Ab2','Ab1','Ab2','Ab1','Ab2',
          'Eb2','Eb1','Eb2','Eb1','Eb2','Eb1','Eb2','Eb1',
          'Bb1','Bb2','Bb1','Bb2','Bb1','C2','C2','C2',
        ],
      },
      // Donk: short pitched blips on every "and" (offbeat 8ths), root of each chord
      donk: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
        notes: [
          'C3','C4','C3','C4',
          'Ab3','Ab4','Ab3','Ab4',
          'Eb3','Eb4','Eb3','Eb4',
          'Bb3','Bb4','C3','C4',
        ],
      },
      // Hoover stab: one screaming chord-tone stab per bar on the "1"
      supersaw: {
        steps: on4(0, 16, 32, 48),
        notes: ['C4','Ab3','Eb4','Bb3'],
        hoover: true,
      },
      // Vocal chop: two off-beat chops per bar, tracking chord tones
      vox: {
        steps: on4(6,14, 22,30, 38,46, 54,62),
        notes: ['C5','Eb5', 'C5','Ab4', 'Eb5','G4', 'Bb4','C5'],
      },
      // Sustained pad tracking Cm–Ab–Eb–Bb under the hoover — adds harmonic body.
      chord: { steps: on4(0,16,32,48), chords: ['Cm','Ab','Eb','Bb'], pad: true, gain: 0.3 },
    },
  },

  // ---- Piano House: Kink-style organic rolling house — Fm, 124 BPM ----
  // Built from the Julien Earle "Piano House Like Kink" tutorial video.
  // 4-bar (64-step) evolving cycle: swung garage kick, sparse 8th hats, rolling
  // syncopated funk bass, classic off-beat minor-7th piano stabs, soulful melody.
  // Progression Fm7–Bbm7–Eb7–Abmaj7 (i–iv–VII–VI) — the minor-jazz house cycle.
  house: {
    bpm: 124, swing: 0.12,
    voices: {
      kick: { steps: on(0,4,8,12), tone: 'garage' },
      clap: { steps: on4(4,12, 20,28, 36,44, 52,60), tone: 'garage' },
      // Swung 8th-note hats — open on every "and-of-2" (i%4===2)
      hat: { steps: on2(0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30), open: true, tone: 'garage' },
      // Rolling syncopated funk bass tracking Fm7–Bbm7–Eb7–Abmaj7
      bass: {
        steps: on4(
          0,3,6,10,14,
          16,19,22,26,30,
          32,35,38,42,46,
          48,51,54,58,62
        ),
        notes: [
          'F1','F2','F1','C2','Eb2',
          'Bb1','Bb2','Bb1','F2','Ab1',
          'Eb2','Eb1','Bb1','G1','Eb2',
          'Ab1','Ab2','Ab1','Eb2','F1',
        ],
      },
      // THE piano stabs: off-beat 7th-chord hits on every "and", one chord per bar
      piano: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
        chords: [
          'Fm7','Fm7','Fm7','Fm7',
          'Bbm7','Bbm7','Bbm7','Bbm7',
          'Eb7','Eb7','Eb7','Eb7',
          'Abmaj7','Abmaj7','Abmaj7','Abmaj7',
        ],
      },
      // Soulful F-minor melodic hook evolving over 4 bars
      vox: {
        steps: on4(0,4,8,14, 16,22,28,30, 32,38,42,46, 48,54,58,62),
        notes: [
          'F4','Ab4','C5','Bb4',
          'F4','Eb5','C5','Ab4',
          'F4','G4','Ab4','C5',
          'Eb5','C5','Ab4','F4',
        ],
      },
      // Warm sustained pad under the piano stabs, tracking Fm7–Bbm7–Eb7–Abmaj7.
      chord: { steps: on4(0,16,32,48), chords: ['Fm','Bbm','Eb','Ab'], pad: true, gain: 0.28 },
    },
  },

  // ---- Speed Garage: Julien Earle 2005 tutorial — Gm, 138 BPM, heavy swing ----
  // Built from the tutorial video. Authentic UK speed garage: 4-on-the-floor 909
  // kick, syncopated shuffle hats, rolling warping Reese bass, one sub thump per bar,
  // M1 organ stabs one chord per bar, pitched vocal chops. 4-bar (64-step) cycle.
  // Chord progression Gm–Cm–Eb–D7 (i–iv–VI–V7).
  'speed-garage': {
    bpm: 138, swing: 0.25,
    voices: {
      kick: { steps: on(0,4,8,12), tone: '909' },
      // Garage snare on 2&4, ghost fills build into bar 4
      snare: {
        steps: on4(4,12, 20,28, 36,44, 52,56,60),
        tone: 'garage',
      },
      // Classic speed garage shuffle hat — syncopated 16th-note pattern
      hat: {
        steps: on2(2,5,7,10,13,15, 18,21,23,26,29,31),
        open: true, tone: '909',
      },
      perc: { steps: on2(3,11,27,31), tone: 'conga' },
      // Rolling Reese bass tracking Gm–Cm–Eb–D7 over 4 bars
      // Notes from video piano roll: C2, F1, Eb1 bass movement in G minor
      reese: {
        steps: on4(
          0,3,6,10,14,
          16,19,22,26,30,
          32,35,38,42,46,
          48,51,54,58,62
        ),
        notes: [
          'G1','G2','G1','D2','F1',
          'C2','C2','Bb1','G1','Eb2',
          'Eb2','Eb1','Bb1','G1','D2',
          'D2','C2','Bb1','A1','G1',
        ],
      },
      // Deep sub thump on the "1" of each bar — root of each chord
      bass: {
        steps: on4(0, 16, 32, 48),
        notes: ['G1','C1','Eb1','D1'],
        long: true, sub: true,
      },
      // M1 organ stabs: off-beat every "and", one chord per bar
      piano: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
        chords: [
          'Gm7','Gm7','Gm7','Gm7',
          'Cm7','Cm7','Cm7','Cm7',
          'Ebmaj7','Ebmaj7','Ebmaj7','Ebmaj7',
          'D7','D7','D7','D7',
        ],
        organ: true,
      },
      // Pitched vocal chops in G minor — 3 syncopated hits per bar
      vox: {
        steps: on4(6,10,14, 22,26,30, 38,42,46, 54,58,62),
        notes: [
          'G5','D5','Bb4',
          'G5','D5','Bb4',
          'Eb5','Bb4','G4',
          'D5','G5','D5',
        ],
      },
      // Sustained pad under the organ stabs, tracking Gm–Cm–Eb–D7.
      chord: { steps: on4(0,16,32,48), chords: ['Gm','Cm','Eb','D'], pad: true, gain: 0.28 },
    },
  },

  // ---- Hard Bounce: Julien Earle "World Bounce" / donk — Am, 150 BPM ----
  // Built from the tutorial video. UK hard bounce / donk: hard distorted 4-on-floor
  // kick + sub, busy offbeat hats, the signature bouncing donk walking up/down the
  // A-minor scale, euphoric supersaw rave-stab riff, melodic hook. 4-bar (64-step).
  // Chord progression Am–G–F–G (i–VII–VI–VII).
  'bouncy-techno': {
    bpm: 160, swing: 0,
    voices: {
      kick: { steps: on(0,4,8,12), tone: 'hard' },
      clap: { steps: on4(4,12, 20,28, 36,44, 52,56,60), tone: '909' },
      hat: { steps: on(2,6,10,14), open: true, tone: '909' },
      // Sub bass: root thump on beat 1 of each bar to anchor the low end
      bass: {
        steps: on4(0, 16, 32, 48),
        notes: ['A1','G1','F1','G1'],
        sub: true,
      },
      // THE donk — relentless 8th-note bounce, octave-jumping and walking the
      // A-minor scale through the chord changes over 4 bars
      donk: {
        steps: on4(
          0,2,4,6,8,10,12,14,
          16,18,20,22,24,26,28,30,
          32,34,36,38,40,42,44,46,
          48,50,52,54,56,58,60,62
        ),
        notes: [
          'A2','A3','A2','A3','E3','E2','A2','A3',
          'G2','G3','G2','G3','D3','D2','G2','G3',
          'F2','F3','F2','F3','C3','C2','F2','F3',
          'G2','G3','G2','G3','D3','D2','G2','A3',
        ],
      },
      // Euphoric rave stabs — thick detuned supersaw chords, one per half-bar
      supersaw: {
        steps: on4(0,8, 16,24, 32,40, 48,56),
        chords: ['Am','Am', 'G','G', 'F','F', 'G','G'],
        rave: true,
      },
      // Chopped vocal hook — syncopated stabs following the Am–G–F–G chords, up-
      // and-down contour per bar with a G5 lift in bar 4. `chop` slices the real
      // vocal sample into tight gated stabs in the fixed arrangement; `pluck`
      // keeps it crisp on the synth (custom builder).
      vox: {
        steps: on4(
          0,3,6,10,13,
          16,19,22,26,29,
          32,35,38,42,45,
          48,51,54,58,61
        ),
        notes: [
          'A4','C5','E5','C5','A4',
          'G4','B4','D5','B4','G4',
          'F4','A4','C5','A4','F4',
          'G4','B4','D5','G5','B4',
        ],
        chop: true, pluck: true,
      },
      // Sustained rave pad under the donk/stab, tracking Am–G–F–G.
      chord: { steps: on4(0,16,32,48), chords: ['Am','G','F','G'], pad: true, gain: 0.28 },
    },
  },

  // ---- Tech House: FISHER-style percussion-driven roller — Cm, 126 BPM ----
  // Built from the tutorial video. Busy, swung tech house: 909 4-on-floor, offbeat
  // open hats, a relentless conga/perc gallop, rolling offbeat sub bass that walks,
  // syncopated vocal-chop stabs and an "ah-ah" vocal hook. 4-bar (64-step) cycle.
  // One-chord Cm groove with a Bb (bVII) lift in bar 4.
  'tech-house': {
    bpm: 126, swing: 0.1,
    voices: {
      kick: { steps: on(0,4,8,12), tone: '909' },
      // Clap on 2&4, ghost roll into bar 4
      clap: { steps: on4(4,12, 20,28, 36,44, 52,56,60), tone: '909' },
      hat: { steps: on(2,6,10,14), open: true, tone: '909' },
      // Relentless conga/perc gallop — the busy tech-house percussion bed
      perc: {
        steps: on4(
          3,7,11,13,15,
          19,23,27,29,31,
          35,39,43,45,47,
          51,55,57,59,61,63
        ),
        tone: 'conga',
      },
      // Rolling offbeat sub bass — Cm roller with a chromatic walk and bar-4 Bb lift
      bass: {
        steps: on4(
          2,6,10,14,
          18,22,26,29,31,
          34,38,42,46,
          50,54,58,61,63
        ),
        notes: [
          'C2','C2','C2','D#2',
          'C2','C2','G1','A#1','B1',
          'C2','C2','C2','G1',
          'A#1','A#1','D2','A#1','C2',
        ],
        sub: true,
      },
      // Syncopated vocal-chop stabs — rhodes electric piano for a warm, punchy chop
      supersaw: {
        steps: on4(2,6, 18,22, 34,38, 50,54,60),
        chords: [
          'Cm7','Cm7',
          'Cm7','D#maj7',
          'Cm7','G7',
          'A#maj7','Cm7','Cm7',
        ],
        rhodes: true,
      },
      // "Ah-ah" vocal hook in Cm — plucked mallet/marimba feel
      vox: {
        steps: on4(2,10, 18,26, 34,42, 50,58),
        notes: ['C5','D#5', 'G4','A#4', 'C5','G5', 'A#4','C5'],
        pluck: true,
      },
      // Sustained pad — Cm roller with the bar-4 A# (bVII) lift, sitting back.
      chord: { steps: on4(0,16,32,48), chords: ['Cm','Cm','Cm','A#'], pad: true, gain: 0.28 },
    },
  },

  // ---- Techno: 909-driven hypnotic roller — Am, 140 BPM ----
  // Built from the tutorial video. Rumbling 909 kick, relentless offbeat hats with
  // a 16th flutter, rolling 909 perc, and the hypnotic offbeat BASSHOOK riff that
  // is the spine of the track — a developing sub-bass figure. Minimal dark stabs,
  // the Jeff Mills "Bells" line and sparse keys. 4-bar (64-step) cycle.
  techno: {
    bpm: 140, swing: 0,
    voices: {
      kick: { steps: on(0,4,8,12), tone: 'rumble' },
      // Offbeat opens with a 16th flutter building into bar 4
      hat: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,53,54,57,58,61,62),
        open: true, tone: '909',
      },
      // Rolling 909 perc gallop developing over 4 bars
      perc: {
        steps: on4(3,11, 19,23,27, 35,43, 51,55,59,61,63),
        tone: '909',
      },
      // THE hypnotic basshook — offbeat sub riff in Am that walks and develops
      bass: {
        steps: on4(
          2,6,10,14,
          18,22,26,30,
          34,38,42,46,
          50,54,58,62,
        ),
        notes: [
          'A1','A1','A1','G1',
          'A1','A1','C2','A1',
          'A1','A1','A1','G1',
          'F1','F1','G1','A1',
        ],
        sub: true,
      },
      // Dark atmospheric pad — minimal, held chords evolving Am–Gm–Am–F over 4 bars.
      // gain trimmed to 70% so the stabs sit back under the kick/bass groove.
      supersaw: { steps: on4(2, 18, 34, 50), chords: ['Am','Gm','Am','F'], pad: true, gain: 0.7 },
      // Jeff Mills "The Bells" — 4 notes then 3 bars silence, 4-bar loop
      bell:    { steps: on(0,2,4,6,8,10,12,14), notes: ['A3','C4','E4','D4'], bell: true },
      // Sparse melodic keys in Am, developing over 4 bars
      vox: {
        steps: on4(0,12, 16,28, 32,44, 48,60),
        notes: ['A4','C5', 'G4','A4', 'C5','E5', 'G4','A4'],
      },
    },
  },

  // ---- Hard Techno: Julien Earle "Shots" — Em, 150 BPM, distorted assault ----
  // Built from the tutorial video. Distorted hard 4-on-floor kick, 909 claps/hats/
  // ride, a relentless distorted offbeat bass riff, and screaming rave-loop hoover
  // stabs that develop. 4-bar (64-step) cycle. Em with a G/D lift.
  'hard-techno': {
    bpm: 150, swing: 0,
    voices: {
      kick: { steps: on(0,4,8,12), tone: 'hard' },
      // Clap on 2&4 with a ghost roll into bar 4
      clap: { steps: on4(4,12, 20,28, 36,44, 52,56,60), tone: '909' },
      // Offbeat opens with a 16th flutter building into bar 4
      hat: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,53,54,57,58,61,62),
        open: true, tone: '909',
      },
      // Rolling 909 ride/shaker gallop developing over 4 bars
      perc: { steps: on4(7,15, 23,27,31, 39,47, 51,55,59,63), tone: '909' },
      // Relentless distorted offbeat acid bass riff in Em, walking and developing
      bass: {
        steps: on4(
          2,6,10,14,
          18,22,26,30,
          34,38,42,46,
          50,54,58,62,
        ),
        notes: [
          'E2','E2','E2','B1',
          'E2','E2','G2','E2',
          'E2','E2','E2','D2',
          'C2','C2','D2','E2',
        ],
        acid: true, accents: [2,10, 18,26, 34,42, 50,58],
      },
      // Screaming rave-loop hoover stabs — syncopated, developing Em–G–D–Em
      supersaw: {
        steps: on4(0,12, 16,28, 32,44, 48,60),
        notes: ['E4','G4', 'G4','B4', 'D4','A4', 'E4','B4'],
        hoover: true,
      },
      // Sparse melodic keys phrase in Em, developing over 4 bars
      vox: {
        steps: on4(2, 18, 34, 50,58),
        notes: ['E5', 'B4', 'D5', 'G4','E5'],
      },
      // Sustained dark pad under the hoover, tracking Em–G–D–Em.
      chord: { steps: on4(0,16,32,48), chords: ['Em','G','D','Em'], pad: true, gain: 0.28 },
    },
  },

  // ---- Schranz: Julien Earle masterclass — relentless industrial loop, Cm ----
  // Built from the tutorial video. The hardest, most loop-driven techno: distorted
  // "hardbassdrum" 4-on-floor, hammering distorted bass, relentless industrial perc
  // gallop with skittle rolls, 16th open hats, and brutal rave-loop stabs. 4-bar
  // (64-step) cycle that grinds forward. Cm with an A#/Gm shift.
  schranz: {
    bpm: 155, swing: 0,
    voices: {
      kick: { steps: on(0,4,8,12), tone: 'hard' },
      // Clap on 2&4 with ghost roll into bar 4
      clap: { steps: on4(4,12, 20,28, 36,44, 52,56,60), tone: '909' },
      // Relentless industrial conga/metal gallop with skittle rolls, developing
      perc: {
        steps: on4(
          1,2,5,6,9,10,13,14,
          17,18,21,22,25,26,29,30,
          33,34,37,38,41,42,45,46,
          49,50,53,54,57,58,61,62,
        ),
        tone: 'conga',
        rolls: [13,14, 29,30, 45,46, 57,58,61,62], // fast skittle retrigs
      },
      // 16th open hats — the "OPENS" wall, with skittle bursts into bar 4
      hat: {
        steps: on4(0,2,4,6,8,10,12,14, 16,18,20,22,24,26,28,30,
                   32,34,36,38,40,42,44,46, 48,50,52,54,56,58,60,62),
        tone: '909',
        rolls: [60,62],
      },
      // Hammering distorted acid bass, walking Cm and developing over 4 bars
      bass: {
        steps: on4(0,4,8,12, 16,20,24,28, 32,36,40,44, 48,52,56,60),
        notes: [
          'C2','C2','C2','C2',
          'C2','C2','A#1','C2',
          'C2','C2','C2','G1',
          'A#1','A#1','D2','C2',
        ],
        acid: true, accents: [0,8, 16,24, 32,40, 48,56],
      },
      // Brutal rave-loop chord stabs — detuned supersaw aggression developing Cm–A#–Gm–Cm
      supersaw: {
        steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
        chords: [
          'Cm','Cm','Cm','Cm',
          'A#','A#','A#','A#',
          'Gm','Gm','Gm','Gm',
          'Cm','Cm','A#','Gm',
        ],
        rave: true,
      },
      // Sustained industrial pad grinding Cm–A#–Gm–Cm under the stabs.
      chord: { steps: on4(0,16,32,48), chords: ['Cm','A#','Gm','Cm'], pad: true, gain: 0.26 },
      // Sparse pitched vocal-stab hook in Cm, two hits per bar.
      vox: {
        steps: on4(0,12, 16,28, 32,44, 48,60),
        notes: ['C5','D#5', 'G4','A#4', 'C5','G5', 'A#4','C5'],
      },
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
