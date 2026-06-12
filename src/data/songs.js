// Reference song arrangements for each genre.
// Each entry maps genreId → array of songs. A song has:
//   - bpm: the real track's tempo — selecting the song moves the BPM slider
//   - tracks: per-section on/off overrides + an `instrument` label naming the
//     actual sound used in that song (shown in the track list)
//   - groove: per-voice note/chord overrides recreating the song's most
//     recognisable hook in its real key. Voices not listed fall back to the
//     genre's default groove so the drums stay consistent.
//
// Voice keys must match the resolved synth voice for each track name:
//   bass, reese, donk, piano, supersaw, pluck, chord, vox, perc…
// (see voiceFor in player.js). Patterns use the same shape as grooves.js.

// Step helpers: list the steps that fire over a phrase of N bars (16 steps/bar).
// `on` = 1 bar (16 steps), `on2` = 2 bars (32), `on4` = 4 bars (64). A longer
// phrase lets a hook evolve across bars instead of repeating every bar — real
// chord progressions and the floating sequence in The Bells need this.
const steps = (len, list) => {
  const a = new Array(len).fill(0)
  list.forEach(s => { a[s] = 1 })
  return a
}
const on = (...list) => steps(16, list)
const on2 = (...list) => steps(32, list)
const on4 = (...list) => steps(64, list)

export const GENRE_SONGS = {

  eurodance: [
    {
      title: 'What Is Love',
      artist: 'Haddaway',
      year: 1993,
      bpm: 124,
      key: 'G minor',
      tracks: [
        { name: 'Kick',       instrument: '909-style club kick',            sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Bass',       instrument: 'Octave synth bass (G)',          sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Snare/Clap', instrument: 'Gated 90s clap',                 sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Hi-Hats',    instrument: 'Off-beat open hats',             sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Lead Synth', instrument: 'Brass-stab synth (THE hook)',    sections: [1,0,1,1,0,1,0,1,1] },
        { name: 'Pad/Chord',  instrument: 'String pad Gm–Bb–Dm–F',         sections: [1,1,1,1,1,1,1,1,1] },
        { name: 'Vocal Hook', instrument: '"What is love" vocal',           sections: [0,1,0,1,1,1,1,1,0] },
        { name: 'FX/Riser',   instrument: 'White-noise sweep',              sections: [0,0,1,0,0,1,0,0,0] },
      ],
      // Real key: G minor. BPM: 124. Progression Gm–Bb–Dm–F (i–III–v–VII), one
      // chord per bar over a 4-bar phrase. The iconic synth-brass stab rides on
      // top; the pad carries the progression so it actually moves like the song.
      groove: {
        bass:  { steps: on(0,2,4,6,8,10,12,14), notes: ['G1','G2','G1','G2','F1','F2','D#1','D#2'] },
        pluck: { steps: on2(0,2,4,7,10,12,15, 16,18,20,23,26,28,31),
                 notes: ['D5','D5','C5','A#4','A4','A#4','D5','D5','D5','C5','A#4','A4','A#4','D5'] },
        chord: { steps: on4(0, 16, 32, 48), chords: ['Gm','A#','Dm','F'], pad: true },
        vox:   { steps: on2(0,3,6,10,13, 16,19,22,26,29), notes: ['D5','D5','C5','A#4','D5','D5','D5','C5','A#4','F5'] },
      },
    },
    {
      title: 'Rhythm Is a Dancer',
      artist: 'Snap!',
      year: 1992,
      bpm: 124,
      key: 'A minor',
      tracks: [
        { name: 'Kick',       instrument: 'Punchy 909 kick',                sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Bass',       instrument: 'Rolling synth bass (A→F→G)',     sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Snare/Clap', instrument: 'Layered snare+clap',             sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Hi-Hats',    instrument: '16th shaker hats',               sections: [1,1,1,1,1,1,0,1,0] },
        { name: 'Lead Synth', instrument: 'Bright bell-pluck (Am arp)',     sections: [1,1,0,1,1,1,0,1,1] },
        { name: 'Pad/Chord',  instrument: 'String pad F–G–Am',              sections: [1,1,1,1,1,1,1,1,1] },
        { name: 'Vocal Hook', instrument: '"Rhythm is a dancer" vocal',     sections: [0,0,0,1,0,1,1,1,0] },
        { name: 'FX/Riser',   instrument: 'Reverse-crash riser',            sections: [0,0,1,0,0,1,0,0,0] },
      ],
      // Real key: A minor. BPM: 124. Chords F–G–Am.
      // Bassline A–F–G–A (anticipation quavers). Lead arp: A4–C5–E5–C5.
      groove: {
        bass:  { steps: on(0,3,6,8,11,14), notes: ['A1','F1','G1','A1','F1','G1'] },
        pluck: { steps: on(0,2,4,6,8,10,12,14), notes: ['A4','C5','E5','C5','A4','C5','E5','C5'] },
        chord: { steps: on(0,6,10), chords: ['F','G','Am'], pad: true },
        vox:   { steps: on(0,4,8,12), notes: ['A4','C5','E5','C5'] },
      },
    },
  ],

  'deep-house': [
    {
      title: 'Latch',
      artist: 'Disclosure',
      year: 2012,
      bpm: 125,
      key: 'F minor',
      tracks: [
        { name: 'Kick',      instrument: 'Soft deep kick',                  sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',      instrument: 'Round sub bass (F)',              sections: [0,1,1,0,1,1,1] },
        { name: 'Chords',    instrument: 'Syncopated chord stab (the bounce)', sections: [0,1,1,1,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Crisp garage-y hats',             sections: [0,1,1,0,1,1,1] },
        { name: 'Vocal',     instrument: 'Sam Smith falsetto vocal',        sections: [0,0,1,1,0,1,0] },
        { name: 'FX/Atmos',  instrument: 'Vinyl-air atmosphere',            sections: [1,1,0,1,1,0,1] },
      ],
      // Real key: F minor. BPM: 125. Chords: Bbm7–Fm7–Ebm7–Dbmaj7.
      // The jerky syncopated chord-stab bounce is the hook.
      groove: {
        bass:  { steps: on(0,3,7,10,14), notes: ['F1','F1','A#1','F1','C2'] },
        chord: { steps: on(0,3,7,10,13), chords: ['A#m','Fm','D#m','C#'], keys: true },
        vox:   { steps: on(0,4,8,12), notes: ['F4','A#4','C5','D#5'] },
      },
    },
    {
      title: 'Need U (100%)',
      artist: 'Duke Dumont',
      year: 2013,
      bpm: 123,
      key: 'F minor',
      tracks: [
        { name: 'Kick',      instrument: 'Warm thudding kick',              sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',      instrument: 'Wobbly garage bass (F)',          sections: [0,1,1,0,1,1,0] },
        { name: 'Chords',    instrument: 'Organ stab chords Fm–Gm',        sections: [0,1,1,1,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Swung open hats',                 sections: [0,1,1,0,1,1,1] },
        { name: 'Vocal',     instrument: '"Need u" pitched diva vocal chop', sections: [0,1,1,1,1,1,0] },
        { name: 'FX/Atmos',  instrument: 'Tape-flutter atmosphere',         sections: [1,1,0,1,1,0,1] },
      ],
      // Real key: F minor. BPM: 123. Chords Fm–Gm.
      // The pitched vocal chop riff and sparse organ stabs are the hook.
      groove: {
        bass:  { steps: on(0,3,6,10,14), notes: ['F1','F1','G1','F1','G1'] },
        chord: { steps: on(2,6,10,14), chords: ['Fm','Gm','Fm','Gm'], keys: true },
        vox:   { steps: on(0,2,5,8,10,13), notes: ['F4','F4','G4','F4','F4','G4'] },
      },
    },
  ],

  'hard-groove': [
    {
      title: "Snapshot '99",
      artist: 'Ben Sims',
      year: 1999,
      bpm: 137,
      key: 'D minor / tribal',
      tracks: [
        { name: 'Kick',        instrument: 'Tight rumble kick',             sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        instrument: 'Dry funk clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     instrument: 'Driving 16th hats',             sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',  instrument: 'Looped tribal congas',          sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',        instrument: 'Off-beat tribal bass (D)',      sections: [0,1,1,0,1,1,0] },
        { name: 'Groove Stab', instrument: 'Filtered disco-loop stab',      sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',       instrument: '(none in this track)',          sections: [0,0,0,0,0,0,0] },
      ],
      groove: {
        perc:     { steps: on(3,6,7,10,11,14,15) },
        bass:     { steps: on(0,3,6,10,14), notes: ['D2','D2','A1','D2','C2'] },
        supersaw: { steps: on(2,6,10,14), notes: ['D4','D4','F4','D4'] },
      },
    },
    {
      title: 'Hardgroove For Life',
      artist: 'Mark Broom (Ben Sims Remix)',
      year: 2001,
      bpm: 136,
      key: 'A minor / tribal',
      tracks: [
        { name: 'Kick',        instrument: 'Punchy tuned kick (A)',         sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        instrument: 'Layered tribal clap',           sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     instrument: 'Rolling off-beat hats',         sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',  instrument: 'Shaker + bongo loop',           sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',        instrument: 'Pumping groove bass (A)',       sections: [0,1,1,0,1,1,0] },
        { name: 'Groove Stab', instrument: 'Chopped funk-loop stab',        sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',       instrument: 'Pitched "uh" vocal chop',       sections: [0,0,1,0,0,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,3,6,8,11,14), notes: ['A1','A1','C2','A1','A1','G1'] },
        supersaw: { steps: on(0,2,8,10), notes: ['A3','C4','A3','G3'] },
        vox:      { steps: on(0,8), notes: ['A4','D5'] },
      },
    },
  ],

  'hard-house': [
    {
      title: 'The Dawn',
      artist: 'Tony De Vit',
      year: 1996,
      bpm: 140,
      key: 'B minor',
      tracks: [
        { name: 'Kick',        instrument: 'Pounding tidy kick',            sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        instrument: 'Hard offset clap',              sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     instrument: 'Relentless open hats',          sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',        instrument: 'Off-beat B bass stabs',         sections: [0,1,1,0,1,1,0] },
        { name: 'Donk',        instrument: 'Bouncing octave donk (B)',      sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover Stab', instrument: 'THE Dawn rising riff (Bm)',     sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',       instrument: '"The dawn..." spoken vocal',    sections: [0,0,1,0,0,1,0] },
      ],
      // Real key: B minor. BPM: 140. The famous hoover riff is a 2-bar phrase:
      // bar 1 climbs the Bm arpeggio B3→D4→F#4→A4→B4, bar 2 cascades back down
      // — that long rise-and-fall is what makes it recognisable, so it needs
      // two bars to play out rather than looping every bar.
      groove: {
        bass:     { steps: on(2,6,10,14), notes: ['B1','B1','D2','F#1'] },
        donk:     { steps: on(2,4,6,8,10,12,14), notes: ['B2','B3','D3','B2','B3','F#3','D3'] },
        supersaw: { steps: on2(0,2,4,6,8,10,12,14, 16,18,20,22,24,26,28,30),
                    notes: ['B3','D4','F#4','A4','B4','A4','F#4','D4','B4','A4','F#4','D4','B3','D4','F#4','A4'],
                    hoover: true },
        vox:      { steps: on2(0, 16), notes: ['B4','F#4'] },
      },
    },
    {
      title: 'Burning Up',
      artist: 'Tony De Vit',
      year: 1995,
      bpm: 148,
      key: 'C minor',
      tracks: [
        { name: 'Kick',        instrument: 'Driving hard kick',             sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        instrument: 'Tight rave clap',               sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     instrument: 'Hissing 8th hats',              sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',        instrument: 'Rolling C bassline',            sections: [0,1,1,0,1,1,0] },
        { name: 'Donk',        instrument: 'Bouncy donk bass',              sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover Stab', instrument: 'Screaming rave hoover (Cm)',    sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',       instrument: '"Burning up" diva loop',        sections: [0,1,1,1,0,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,2,6,8,10,14), notes: ['C2','C2','G1','C2','A#1','C2'] },
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['C3','C4','C3','C4','G2','G3','A#2','A#3'] },
        supersaw: { steps: on(0,4,8,12), notes: ['C4','D#4','G4','D#4'], hoover: true },
        vox:      { steps: on(0,4,8,12), notes: ['C5','D#5','G4','A#4'] },
      },
    },
  ],

  house: [
    {
      title: 'Move Your Body',
      artist: 'Marshall Jefferson',
      year: 1986,
      bpm: 122,
      key: 'E minor',
      tracks: [
        { name: 'Kick',   instrument: 'Classic 909 thump',                  sections: [0,1,1,1,1,1,0] },
        { name: 'Clap',   instrument: 'Roomy 80s clap',                     sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',instrument: 'Open disco hats',                    sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',   instrument: 'Walking piano left-hand bass (Em)',  sections: [0,1,1,0,1,1,0] },
        { name: 'Piano',  instrument: 'THE rolling house piano Em–Am–C–Bm', sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',  instrument: '"Move your body" chant',             sections: [0,0,1,1,0,1,0] },
      ],
      // Real key: E minor. BPM: 122. Prophet-2000 piano chords Em–Am–C–Bm —
      // ONE chord per bar over a 4-bar phrase (the progression is the hook, and
      // it must breathe across 4 bars, not flash by every bar). Rolling offbeat
      // stabs within each bar; bass walks the root of each chord.
      groove: {
        bass:  { steps: on4(0,8, 16,24, 32,40, 48,56),
                 notes: ['E2','E2','A1','A1','C2','C2','B1','B1'] },
        piano: { steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
                 chords: ['Em','Em','Em','Em','Am','Am','Am','Am','C','C','C','C','Bm','Bm','Bm','Bm'] },
        vox:   { steps: on4(0, 16, 32, 48), notes: ['E5','A4','C5','B4'] },
      },
    },
    {
      title: 'Ride on Time',
      artist: 'Black Box',
      year: 1989,
      bpm: 119,
      key: 'A minor',
      tracks: [
        { name: 'Kick',   instrument: 'Italo-house kick',                   sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',   instrument: 'Big gated clap',                     sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',instrument: 'Bright 8th hats',                    sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',   instrument: 'Octave italo bass (A)',              sections: [0,1,1,0,1,1,0] },
        { name: 'Piano',  instrument: 'Stabbed italo piano (Am–G–F–E)',    sections: [0,0,1,1,1,1,0] },
        { name: 'Vocal',  instrument: 'Loleatta Holloway "Love Sensation"', sections: [0,1,1,1,1,1,0] },
      ],
      // Real key: A minor. BPM: 119. Sampled from Holloway's "Love Sensation".
      // Piano stabs Am–G–F–E (i–VII–VI–V) — ONE chord per bar over a 4-bar
      // phrase; octave italo bass pumps the root of each chord underneath.
      groove: {
        bass:  { steps: on4(0,2,4,6,8,10,12,14, 16,18,20,22,24,26,28,30, 32,34,36,38,40,42,44,46, 48,50,52,54,56,58,60,62),
                 notes: ['A1','A2','A1','A2','A1','A2','A1','A2','G1','G2','G1','G2','G1','G2','G1','G2','F1','F2','F1','F2','F1','F2','F1','F2','E1','E2','E1','E2','E1','E2','E1','E2'] },
        piano: { steps: on4(2,6,10,14, 18,22,26,30, 34,38,42,46, 50,54,58,62),
                 chords: ['Am','Am','Am','Am','G','G','G','G','F','F','F','F','E','E','E','E'] },
        vox:   { steps: on4(0,6, 16,22, 32,38, 48,54), notes: ['E5','C5','D5','B4','C5','A4','B4','G#4'] },
      },
    },
  ],

  'speed-garage': [
    {
      title: 'RipGroove',
      artist: 'Double 99',
      year: 1997,
      bpm: 127,
      key: 'C minor',
      tracks: [
        { name: 'Kick',      instrument: 'Punchy garage kick',              sections: [1,1,1,1,1,1,1] },
        { name: 'Snare',     instrument: 'Cracking 2-step snare',           sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Shuffled skippy hats',            sections: [1,1,1,1,1,1,1] },
        { name: 'Reese Bass',instrument: 'THE warping Reese (Cm)',          sections: [0,1,1,1,1,1,0] },
        { name: 'Sub Bass',  instrument: 'Sliding sub layer',               sections: [0,0,1,1,1,1,0] },
        { name: 'Organ',     instrument: 'Ragga organ stab',                sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',     instrument: '"Ripgroove!" MC shout',           sections: [0,0,1,0,0,1,0] },
      ],
      // Real key: C minor. BPM: 127. Bassline interpolates Mozart K491 (Cm Piano Concerto).
      // The famous Reese walks: C–Eb–G–Ab–G–F–Eb–D (Mozart's theme).
      groove: {
        reese: { steps: on(0,2,4,6,8,10,12,14), notes: ['C1','D#1','G1','G#1','G1','F1','D#1','D1'] },
        bass:  { steps: on(0,6,10), notes: ['C1','G1','A#1'], long: true },
        piano: { steps: on(2,5,10,13), chords: ['Cm','Cm','Fm','Gm'] },
        vox:   { steps: on(0,10), notes: ['G4','D5'] },
      },
    },
    {
      title: 'Sweet Like Chocolate',
      artist: 'Shanks & Bigfoot',
      year: 1999,
      bpm: 131,
      key: 'D minor',
      tracks: [
        { name: 'Kick',      instrument: 'Soft 2-step kick',                sections: [1,1,1,1,1,1,1] },
        { name: 'Snare',     instrument: 'Skippy UKG snare',                sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Swung garage hats',               sections: [1,1,1,1,1,1,1] },
        { name: 'Reese Bass',instrument: 'Warm bouncing sub (D)',           sections: [0,1,1,0,1,1,0] },
        { name: 'Sub Bass',  instrument: 'Round low-end layer',             sections: [0,0,1,0,1,1,0] },
        { name: 'Organ',     instrument: 'Sweet music-box keys (Dm)',       sections: [1,0,1,1,0,1,1] },
        { name: 'Vocal',     instrument: '"Sweet like chocolate boy" hook', sections: [0,0,1,1,0,1,0] },
      ],
      // Real key: D minor. BPM: 131. The nursery-style vocal hook in Dm.
      // "Sweet like chocolate" melody: D5–F5–A4 (Dm triad, descending).
      groove: {
        reese: { steps: on(0,3,6,10,14), notes: ['D1','D1','F1','A1','C2'] },
        piano: { steps: on(0,4,8,12), chords: ['Dm','C','A#','A'] },
        vox:   { steps: on(0,2,4,7,10,12), notes: ['D5','F5','A4','F4','D5','A4'] },
      },
    },
  ],

  'bouncy-techno': [
    {
      title: 'Now Is the Time',
      artist: 'Scott Brown',
      year: 1996,
      bpm: 170,
      key: 'A minor',
      tracks: [
        { name: 'Kick',      instrument: 'Hard bouncy kick',                sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',      instrument: 'Rave clap',                       sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Off-beat open hats',              sections: [1,1,1,1,1,1,1] },
        { name: 'Donk',      instrument: 'Relentless octave donk (A)',      sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab', instrument: 'Euphoric piano-rave stab (Am)',   sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',     instrument: '"Now is the time!" MC shout',     sections: [0,0,1,0,0,1,0] },
      ],
      // Am, 170 BPM bouncy techno. Piano stab on 1–6–4–5 (Am–F–C–E).
      groove: {
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','A2','A3','G2','A3'] },
        supersaw: { steps: on(0,4,8,12), notes: ['A4','F4','C5','E5'] },
        vox:      { steps: on(0,8), notes: ['A4','E5'] },
      },
    },
    {
      title: 'Obsession',
      artist: 'Ultra-Sonic',
      year: 1994,
      bpm: 158,
      key: 'A minor',
      tracks: [
        { name: 'Kick',      instrument: 'Pounding rave kick',              sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',      instrument: 'Snappy 909 clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Driving 8th hats',                sections: [1,1,1,1,1,1,1] },
        { name: 'Donk',      instrument: 'Bouncing bass stab (A)',          sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab', instrument: 'THE Obsession hoover riff (Am)',  sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',     instrument: '"Obsession" whispered vocal',     sections: [0,1,1,1,1,1,0] },
      ],
      // Am, 158 BPM. Hoover riff climbs A–C–E–A octave (rave-anthem shape).
      groove: {
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','C3','C4','E3','E4'] },
        supersaw: { steps: on(0,3,6,9,12), notes: ['A4','C5','E5','C5','A4'], hoover: true },
        vox:      { steps: on(0,8), notes: ['A4','E5'] },
      },
    },
  ],

  'tech-house': [
    {
      title: 'Losing It',
      artist: 'FISHER',
      year: 2018,
      bpm: 125,
      key: 'D major',
      tracks: [
        { name: 'Kick',       instrument: 'Fat rolling kick',               sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',       instrument: 'Dry tight clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',    instrument: 'Crisp off-beat hats',            sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', instrument: 'Clicky shaker groove',           sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',       instrument: 'Punchy D bass stab',             sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal Stab', instrument: 'THE violin-stab hook (D major)', sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',      instrument: '"I\'m losing it" vocal chop',    sections: [0,0,1,1,0,1,0] },
      ],
      // Real key: D major. BPM: 125. The hook is the famous violin stab.
      // Notes: D5–A4–F#4 (D major triad) pounding on the grid.
      groove: {
        bass:     { steps: on(0,2,3,6,8,10,11,14), notes: ['D1','D1','A1','D1','D1','D1','A1','D1'] },
        supersaw: { steps: on(0,2,4,6,8,10,12,14), notes: ['D5','A4','F#4','D5','A4','F#4','D5','A4'] },
        vox:      { steps: on(0,3,6,10,13), notes: ['D5','D5','A4','D5','F#4'] },
      },
    },
    {
      title: 'La La Land',
      artist: 'Green Velvet',
      year: 2001,
      bpm: 128,
      key: 'A minor',
      tracks: [
        { name: 'Kick',       instrument: 'Chicago pumping kick',           sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',       instrument: 'Sharp 909 clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',    instrument: 'Metallic 8th hats',              sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', instrument: 'Acid perc blips',                sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',       instrument: 'Driving A acid bass (Am)',       sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal Stab', instrument: 'Squelchy acid stab (Am→E)',      sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',      instrument: '"La la land" spoken chant',      sections: [0,1,1,1,1,1,0] },
      ],
      // Real key: A minor. BPM: 128. Acid-bass riff in Am: A–G–F–E.
      // "Something for your mind" monotone vocal hook over Am groove.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A1','G1','F1','E1','A1','G1','F1','E1'] },
        supersaw: { steps: on(0,4,8,12), notes: ['A3','G3','F3','E3'] },
        vox:      { steps: on(0,2,4,6,8,10,12), notes: ['A4','A4','A4','G4','A4','A4','G4'] },
      },
    },
  ],

  techno: [
    {
      title: 'The Bells',
      artist: 'Jeff Mills',
      year: 1996,
      bpm: 136,
      key: 'A minor',
      tracks: [
        { name: 'Kick',       instrument: 'Hammering TR-909 kick (4/4)',      sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',    instrument: '909 open hats, offbeat 8ths',      sections: [0,1,1,1,1,1,1] },
        { name: 'Percussion', instrument: '909 claps through delay',          sections: [0,0,1,0,1,1,1] },
        { name: 'Sub Bass',   instrument: 'Pounding A1 sub pulse',            sections: [0,1,1,0,1,1,0] },
        { name: 'Bell Riff',  instrument: 'System 100m ring-mod bell (THE riff)', sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',      instrument: '(none — pure machine)',            sections: [0,0,0,0,0,0,0] },
      ],
      // Confirmed 136 BPM, A minor. Ring-modulated sine bell (Roland System 100m
      // style — see synth.js bell()). The 5-note cell A–G#–A–F–A comes from the
      // Attack Magazine Synth Secrets analysis; G# is correct (harmonic minor
      // leading tone → A gives the riff its tension and release).
      // The riff runs over a 2-bar phrase (32 steps). A 9-hit cycle placed so it
      // doesn't divide evenly into the 4/4 grid is what makes it "float" — the
      // downbeats keep drifting forward each time round, exactly as in the record.
      // Bell sustain is set long (~10 × stepDur) so notes bleed into each other.
      groove: {
        bass: { steps: on(0,4,8,12), notes: ['A1'] },
        supersaw: {
          steps: on2(0,4,7,11,14,18,21,25,28),
          notes: ['A4','G#4','A4','F4','A4','G#4','A4','F4','A4'],
          bell: true,
        },
      },
    },
    {
      title: 'Spastik',
      artist: 'Plastikman',
      year: 1993,
      bpm: 126,
      key: 'Percussive / atonal',
      tracks: [
        { name: 'Kick',       instrument: 'Dry minimal kick (Roland 909)',  sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',    instrument: 'Hissing 16th hats',              sections: [0,1,1,0,1,1,1] },
        { name: 'Percussion', instrument: 'THE rolling snare-drum loop',    sections: [1,1,1,1,1,1,1] },
        { name: 'Sub Bass',   instrument: 'Barely-there sub pulse',         sections: [0,1,1,0,1,1,0] },
        { name: 'Hypno Stab', instrument: '(none — drums only)',            sections: [0,0,0,0,0,0,0] },
        { name: 'Vocal',      instrument: '(none — drums only)',            sections: [0,0,0,0,0,0,0] },
      ],
      // 126 BPM. Almost entirely percussion — the accelerating snare roll is the track.
      // Minimalist sub pulse barely audible under the drum workout.
      groove: {
        perc: { steps: on(0,1,3,4,6,7,8,9,11,12,14,15) },
        bass: { steps: on(0,8), notes: ['A#1','A#1'] },
      },
    },
  ],

  'hard-techno': [
    {
      title: 'Power to the Raver',
      artist: '999999999',
      year: 2019,
      bpm: 155,
      key: 'E minor',
      tracks: [
        { name: 'Kick',           instrument: 'Distorted pounding kick',    sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           instrument: 'Industrial clap',            sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',        instrument: 'Sizzling open hats',         sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',     instrument: 'Metallic perc hits',         sections: [1,1,1,0,1,1,1] },
        { name: 'Distorted Bass', instrument: 'Overdriven E rumble bass',   sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover',         instrument: 'Acid-rave lead riff (Em)',   sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',          instrument: '"Power to the raver" chant', sections: [0,0,1,1,0,1,0] },
      ],
      // Em, 155 BPM. Rapid acid riff: E–G–B–D (Em7 arpeggio) over distorted kick.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['E2','E2','E2','B1','E2','E2','D2','B1'] },
        supersaw: { steps: on(0,2,4,6,8,10,12,14), notes: ['E4','G4','B4','D5','E4','G4','B4','D5'], hoover: true },
        vox:      { steps: on(0,2,4,8,10,12), notes: ['E5','E5','B4','E5','D5','B4'] },
      },
    },
    {
      title: 'Purple Widow',
      artist: 'Nico Moreno',
      year: 2021,
      bpm: 150,
      key: 'E minor',
      tracks: [
        { name: 'Kick',           instrument: 'Crushed rumble kick',        sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           instrument: 'Slamming clap',              sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',        instrument: 'Aggressive off-hats',        sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',     instrument: 'Industrial perc loop',       sections: [1,1,1,0,1,1,1] },
        { name: 'Distorted Bass', instrument: 'Sub-rumble drone (E)',       sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover',         instrument: 'Dark screech stab (Em)',     sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',          instrument: 'Pitched-down dark vocal',    sections: [0,0,1,1,0,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,4,8,12), notes: ['E2','E2','E2','E2'] },
        supersaw: { steps: on(0,3,8,11), notes: ['E4','G4','E4','B3'], hoover: true },
        vox:      { steps: on(0,8), notes: ['E4','B3'] },
      },
    },
  ],

  schranz: [
    {
      title: 'Blitz',
      artist: 'Chris Liebing',
      year: 2000,
      bpm: 150,
      key: 'C minor / industrial',
      tracks: [
        { name: 'Kick',           instrument: 'Hammering schranz kick',     sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           instrument: 'Compressed industrial clap', sections: [0,1,1,0,1,1,0] },
        { name: 'Percussion',     instrument: 'Grinding loop percussion',   sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',        instrument: 'Relentless 8th hats',        sections: [1,1,1,1,1,1,1] },
        { name: 'Distorted Bass', instrument: 'Hammered C bass loop',       sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab',      instrument: 'Crushing every-beat stab',   sections: [0,1,1,0,1,1,0] },
      ],
      groove: {
        perc:     { steps: on(0,2,3,4,6,7,8,10,11,12,14,15) },
        bass:     { steps: on(0,4,8,12), notes: ['C2','C2','C2','C2'] },
        supersaw: { steps: on(0,4,8,12), notes: ['C4','C4','C4','C4'] },
      },
    },
    {
      title: 'I See You, I Am You',
      artist: 'DJ Rush',
      year: 2003,
      bpm: 150,
      key: 'C minor / industrial',
      tracks: [
        { name: 'Kick',           instrument: 'Chicago-hard kick',          sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           instrument: 'Cracking clap',              sections: [0,1,1,0,1,1,0] },
        { name: 'Percussion',     instrument: 'Funky-industrial perc',      sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',        instrument: 'Pumping off-hats',           sections: [1,1,1,1,1,1,1] },
        { name: 'Distorted Bass', instrument: 'Driving C stomp bass',       sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab',      instrument: 'DJ Rush vocal-stab loop',    sections: [0,0,1,0,0,1,0] },
      ],
      groove: {
        perc:     { steps: on(0,2,4,6,8,10,12,14) },
        bass:     { steps: on(0,4,8,12), notes: ['C2','C2','C2','C2'] },
        supersaw: { steps: on(0,8), notes: ['C4','D#4'] },
      },
    },
  ],
}
