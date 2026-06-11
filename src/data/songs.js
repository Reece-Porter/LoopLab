// Reference song arrangements for each genre.
// Each entry maps genreId → array of songs. A song has:
//   - tracks: per-section on/off overrides (how the track is structured)
//   - groove: per-voice note/chord overrides that recreate the song's most
//     recognisable hook (bassline, lead riff, chord stabs, vocal). Voices not
//     listed fall back to the genre's default groove, so drums stay consistent.
//
// Voice keys must match the resolved synth voice for each track name:
//   bass, reese, donk, piano, supersaw, pluck, chord, vox, perc, kick…
// (see voiceFor in player.js). Patterns use the same shape as grooves.js:
//   { steps:[16], notes:[...] }  |  { steps:[16], chords:[...], pad/keys }

// 16-step helper: list the steps that fire.
const on = (...steps) => {
  const a = new Array(16).fill(0)
  steps.forEach(s => { a[s] = 1 })
  return a
}

export const GENRE_SONGS = {

  eurodance: [
    {
      title: 'What Is Love',
      artist: 'Haddaway',
      year: 1993,
      // 9 sections: Intro, Verse 1, Pre-Ch, Chorus 1, Verse 2, Chorus 2, Bridge, Chorus 3, Outro
      tracks: [
        { name: 'Kick',       sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Bass',       sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Snare/Clap', sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Hi-Hats',    sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Lead Synth', sections: [0,0,0,1,0,1,0,1,0] },
        { name: 'Pad/Chord',  sections: [1,1,1,1,1,1,1,1,1] },
        { name: 'Vocal Hook', sections: [0,1,0,1,1,1,1,1,0] },
        { name: 'FX/Riser',   sections: [0,0,1,0,0,1,0,0,0] },
      ],
      // Iconic stabby Dm riff + "what is love" vocal answer.
      groove: {
        bass:  { steps: on(0,2,4,6,8,10,12,14), notes: ['D2','D2','D2','D2','C2','C2','A1','A1'] },
        pluck: { steps: on(0,3,6,8,11,14),      notes: ['A4','A4','D5','A4','F4','A4'] },
        chord: { steps: on(0,8), chords: ['Dm','C'], pad: true },
        vox:   { steps: on(0,8), notes: ['D5','A4'] },
      },
    },
    {
      title: 'Rhythm Is a Dancer',
      artist: 'Snap!',
      year: 1992,
      tracks: [
        { name: 'Kick',       sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Bass',       sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Snare/Clap', sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Hi-Hats',    sections: [1,1,1,1,1,1,0,1,0] },
        { name: 'Lead Synth', sections: [0,1,0,1,1,1,0,1,0] },
        { name: 'Pad/Chord',  sections: [1,1,1,1,1,1,1,1,1] },
        { name: 'Vocal Hook', sections: [0,0,0,1,0,1,1,1,0] },
        { name: 'FX/Riser',   sections: [0,0,1,0,0,1,0,0,0] },
      ],
      // The descending Am synth-lead hook.
      groove: {
        bass:  { steps: on(0,2,4,6,8,10,12,14), notes: ['A1','A1','A1','A1','G1','G1','F1','F1'] },
        pluck: { steps: on(0,2,4,6,8,10,12,14), notes: ['E5','E5','D5','C5','B4','C5','A4','E4'] },
        chord: { steps: on(0,8), chords: ['Am','F'], pad: true },
        vox:   { steps: on(0,8), notes: ['A4','C5'] },
      },
    },
  ],

  'deep-house': [
    {
      title: 'Latch',
      artist: 'Disclosure',
      year: 2012,
      // 7 sections: Intro(32), Build(16), Drop 1(32), Breakdown(16), Build 2(8), Drop 2(32), Outro(32)
      tracks: [
        { name: 'Kick',      sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',      sections: [0,1,1,0,1,1,1] },
        { name: 'Chords',    sections: [0,1,1,1,1,1,0] },
        { name: 'Hi-Hats',   sections: [0,1,1,0,1,1,1] },
        { name: 'Vocal',     sections: [0,0,1,1,0,1,0] },
        { name: 'FX/Atmos',  sections: [1,1,0,1,1,0,1] },
      ],
      // Bouncing off-beat chord stabs + soulful vocal leap.
      groove: {
        bass:  { steps: on(2,6,10,14), notes: ['F1','F1','A#1','C2'] },
        chord: { steps: on(0,2,6,8,10,14), chords: ['Fm7','Fm7','A#maj7','D#maj7','Fm7','A#maj7'], keys: true },
        vox:   { steps: on(0,4,8,12), notes: ['F4','G#4','C5','A#4'] },
      },
    },
    {
      title: 'Need U (100%)',
      artist: 'Duke Dumont',
      year: 2013,
      tracks: [
        { name: 'Kick',      sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',      sections: [0,1,1,0,1,1,0] },
        { name: 'Chords',    sections: [0,1,1,1,1,1,0] },
        { name: 'Hi-Hats',   sections: [0,1,1,0,1,1,1] },
        { name: 'Vocal',     sections: [0,1,1,1,1,1,0] },
        { name: 'FX/Atmos',  sections: [1,1,0,1,1,0,1] },
      ],
      groove: {
        bass:  { steps: on(2,6,10,14), notes: ['F1','A#1','C2','C2'] },
        chord: { steps: on(0,4,8,12), chords: ['Fm7','D#maj7','A#maj7','Cm7'], keys: true },
        vox:   { steps: on(0,8), notes: ['C5','A#4'] },
      },
    },
  ],

  'hard-groove': [
    {
      title: "Snapshot '99",
      artist: 'Ben Sims',
      year: 1999,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',        sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',  sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',        sections: [0,1,1,0,1,1,0] },
        { name: 'Groove Stab', sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',       sections: [0,0,0,0,0,0,0] },
      ],
      // Stabbed Dm groove riff over a locked off-beat bass.
      groove: {
        bass:     { steps: on(0,3,6,10,14), notes: ['D2','D2','A1','D2','C2'] },
        supersaw: { steps: on(0,4,8,12), notes: ['D4','D4','F4','D4'] },
      },
    },
    {
      title: 'Hardgroove For Life',
      artist: 'Mark Broom (Ben Sims Remix)',
      year: 2001,
      tracks: [
        { name: 'Kick',        sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',  sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',        sections: [0,1,1,0,1,1,0] },
        { name: 'Groove Stab', sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',       sections: [0,0,1,0,0,1,0] },
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
      year: 1997,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',        sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',        sections: [0,1,1,0,1,1,0] },
        { name: 'Donk',        sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover Stab', sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',       sections: [0,0,1,0,0,1,0] },
      ],
      // Anthemic rising hoover stab + bouncing donk in Cm.
      groove: {
        bass:     { steps: on(0,2,6,8,10,14), notes: ['C2','C2','G2','C2','A#1','G1'] },
        donk:     { steps: on(2,4,6,8,10,12,14), notes: ['C3','C4','G3','C3','C4','A#3','G3'] },
        supersaw: { steps: on(0,4,8,12), notes: ['C4','C4','D#4','G4'] },
        vox:      { steps: on(0,8), notes: ['C5','G4'] },
      },
    },
    {
      title: 'Burning Up',
      artist: 'Tony De Vit',
      year: 1995,
      tracks: [
        { name: 'Kick',        sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',        sections: [0,1,1,0,1,1,0] },
        { name: 'Donk',        sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover Stab', sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',       sections: [0,1,1,1,0,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,2,6,8,10,14), notes: ['C2','C2','G1','C2','A#1','C2'] },
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['C3','C4','C3','C4','G2','G3','A#2','A#3'] },
        supersaw: { steps: on(0,2,4,8,10,12), notes: ['G3','C4','G3','D#4','C4','G3'] },
        vox:      { steps: on(0,8), notes: ['C5','A#4'] },
      },
    },
  ],

  house: [
    {
      title: 'Move Your Body',
      artist: 'Marshall Jefferson',
      year: 1986,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',   sections: [0,1,1,1,1,1,0] },
        { name: 'Clap',   sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',   sections: [0,1,1,0,1,1,0] },
        { name: 'Piano',  sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',  sections: [0,0,1,1,0,1,0] },
      ],
      // The rolling piano-house chord riff — "the house anthem".
      groove: {
        bass:  { steps: on(2,6,10,14), notes: ['F1','A#1','C2','A#1'] },
        piano: { steps: on(0,2,4,6,8,10,12,14), chords: ['Fm7','Fm7','A#maj7','A#maj7','Cm7','Cm7','Fm7','Fm7'] },
        vox:   { steps: on(0,8), notes: ['F4','A#4'] },
      },
    },
    {
      title: 'Ride on Time',
      artist: 'Black Box',
      year: 1989,
      tracks: [
        { name: 'Kick',   sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',   sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',   sections: [0,1,1,0,1,1,0] },
        { name: 'Piano',  sections: [0,0,1,1,1,1,0] },
        { name: 'Vocal',  sections: [0,1,1,1,1,1,0] },
      ],
      groove: {
        bass:  { steps: on(0,3,6,10,14), notes: ['F1','F1','A#1','C2','A#1'] },
        piano: { steps: on(0,4,8,12), chords: ['Fm7','A#maj7','Gm7','Cm7'] },
        vox:   { steps: on(0,4,8,12), notes: ['F4','G#4','C5','A#4'] },
      },
    },
  ],

  'speed-garage': [
    {
      title: 'RipGroove',
      artist: 'Double 99',
      year: 1997,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',      sections: [1,1,1,1,1,1,1] },
        { name: 'Snare',     sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   sections: [1,1,1,1,1,1,1] },
        { name: 'Reese Bass',sections: [0,1,1,0,1,1,0] },
        { name: 'Sub Bass',  sections: [0,0,1,1,1,1,0] },
        { name: 'Organ',     sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',     sections: [0,0,0,0,0,0,0] },
      ],
      // The growling, walking Reese sub IS the hook.
      groove: {
        reese: { steps: on(0,3,6,8,11,14), notes: ['G1','G1','A#1','C2','C2','D2'] },
        bass:  { steps: on(0,6,10), notes: ['G1','A#1','C2'], long: true },
        piano: { steps: on(2,8,11), chords: ['Gm7','Cm7','D7'] },
      },
    },
    {
      title: 'Sweet Like Chocolate',
      artist: 'Shanks & Bigfoot',
      year: 1999,
      tracks: [
        { name: 'Kick',      sections: [1,1,1,1,1,1,1] },
        { name: 'Snare',     sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   sections: [1,1,1,1,1,1,1] },
        { name: 'Reese Bass',sections: [0,1,1,0,1,1,0] },
        { name: 'Sub Bass',  sections: [0,0,1,0,1,1,0] },
        { name: 'Organ',     sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',     sections: [0,0,1,1,0,1,0] },
      ],
      groove: {
        reese: { steps: on(0,6,10), notes: ['G1','A#1','C2'] },
        piano: { steps: on(0,4,8,12), chords: ['Gm7','D#maj7','A#maj7','Cm7'] },
        vox:   { steps: on(0,4,8,12), notes: ['G4','A#4','D5','A#4'] },
      },
    },
  ],

  'bouncy-techno': [
    {
      title: 'Now Is the Time',
      artist: 'Scott Brown',
      year: 2002,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',      sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',      sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   sections: [1,1,1,1,1,1,1] },
        { name: 'Donk',      sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab', sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',     sections: [0,0,1,0,0,1,0] },
      ],
      // Relentless bouncing donk + euphoric rave stab in Am.
      groove: {
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','G2','G3','A2','A3'] },
        supersaw: { steps: on(0,4,8,12), notes: ['A4','A4','C5','E5'] },
        vox:      { steps: on(0,8), notes: ['A4','E5'] },
      },
    },
    {
      title: 'Obsession',
      artist: 'Ultra-Sonic',
      year: 1998,
      tracks: [
        { name: 'Kick',      sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',      sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   sections: [1,1,1,1,1,1,1] },
        { name: 'Donk',      sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab', sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',     sections: [0,1,1,1,1,1,0] },
      ],
      groove: {
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','C3','C4','E3','E4'] },
        supersaw: { steps: on(0,2,8,10), notes: ['E5','C5','A4','E5'] },
        vox:      { steps: on(0,8), notes: ['A4','E5'] },
      },
    },
  ],

  'tech-house': [
    {
      title: 'Losing It',
      artist: 'FISHER',
      year: 2018,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',       sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',       sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',    sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',       sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal Stab', sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',      sections: [0,0,1,1,0,1,0] },
      ],
      // Rolling Cm acid-ish riff + the "losing it" vocal stab.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['C2','C2','C2','D#2','C2','C2','A#1','G1'] },
        supersaw: { steps: on(0,2,4,6,8,10,12,14), notes: ['C4','C4','C4','D#4','C4','C4','A#3','G3'] },
        vox:      { steps: on(0,8), notes: ['C5','D#5'] },
      },
    },
    {
      title: 'La La Land',
      artist: 'Green Velvet',
      year: 2002,
      tracks: [
        { name: 'Kick',       sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',       sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',    sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',       sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal Stab', sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',      sections: [0,1,1,1,1,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,4,8,12), notes: ['C2','C2','C2','C2'] },
        supersaw: { steps: on(0,2,8,10), notes: ['C4','D#4','C4','G3'] },
        vox:      { steps: on(0,2,4,8,10,12), notes: ['C5','C5','D#5','C5','C5','G4'] },
      },
    },
  ],

  techno: [
    {
      title: 'The Bells',
      artist: 'Jeff Mills',
      year: 1992,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',       sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',    sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', sections: [1,1,1,0,1,1,1] },
        { name: 'Sub Bass',   sections: [0,1,1,0,1,1,0] },
        { name: 'Hypno Stab', sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',      sections: [0,0,0,0,0,0,0] },
      ],
      // The hypnotic repeating "Bells" synth motif.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A1','A1','A1','A1','A1','A1','A1','A1'] },
        supersaw: { steps: on(0,2,4,6,8,10,12,14), notes: ['A4','E5','A4','C5','A4','E5','A4','B4'] },
      },
    },
    {
      title: 'Spastik',
      artist: 'Plastikman',
      year: 1993,
      tracks: [
        { name: 'Kick',       sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',    sections: [0,1,1,0,1,1,1] },
        { name: 'Percussion', sections: [0,1,1,0,1,1,1] },
        { name: 'Sub Bass',   sections: [0,1,1,0,1,1,0] },
        { name: 'Hypno Stab', sections: [0,0,0,0,0,0,0] },
        { name: 'Vocal',      sections: [0,0,0,0,0,0,0] },
      ],
      // Pure rhythmic workout — rolling shaker/perc, no melody.
      groove: {
        perc: { steps: on(0,2,3,4,6,7,8,10,11,12,14,15) },
        bass: { steps: on(0,4,8,12), notes: ['A1','A1','A1','A1'] },
      },
    },
  ],

  'hard-techno': [
    {
      title: 'Power to the Raver',
      artist: '999999999',
      year: 2020,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',           sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',        sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',     sections: [1,1,1,0,1,1,1] },
        { name: 'Distorted Bass', sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover',         sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',          sections: [0,0,1,0,0,1,0] },
      ],
      // Screaming Em hoover + chanted vocal hook.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['E2','E2','E2','B1','E2','E2','D2','B1'] },
        supersaw: { steps: on(0,4,8,12), notes: ['E4','E4','G4','E4'] },
        vox:      { steps: on(0,4,8,12), notes: ['E5','E5','B4','E5'] },
      },
    },
    {
      title: 'Purple Widow',
      artist: 'Nico Moreno',
      year: 2021,
      tracks: [
        { name: 'Kick',           sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',        sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',     sections: [1,1,1,0,1,1,1] },
        { name: 'Distorted Bass', sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover',         sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',          sections: [0,0,1,1,0,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,4,8,12), notes: ['E2','E2','E2','E2'] },
        supersaw: { steps: on(0,2,8,10), notes: ['E4','G4','E4','B3'] },
        vox:      { steps: on(0,8), notes: ['E5','B4'] },
      },
    },
  ],

  schranz: [
    {
      title: 'Blitz',
      artist: 'Chris Liebing',
      year: 2001,
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',           sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           sections: [0,1,1,0,1,1,0] },
        { name: 'Percussion',     sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',        sections: [1,1,1,1,1,1,1] },
        { name: 'Distorted Bass', sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab',      sections: [0,1,1,0,1,1,0] },
      ],
      // Hammered Cm loop, crushing every-beat stab and dense perc.
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
      tracks: [
        { name: 'Kick',           sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           sections: [0,1,1,0,1,1,0] },
        { name: 'Percussion',     sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',        sections: [1,1,1,1,1,1,1] },
        { name: 'Distorted Bass', sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab',      sections: [0,0,1,0,0,1,0] },
      ],
      groove: {
        perc:     { steps: on(0,2,4,6,8,10,12,14) },
        bass:     { steps: on(0,4,8,12), notes: ['C2','C2','C2','C2'] },
        supersaw: { steps: on(0,8), notes: ['C4','D#4'] },
      },
    },
  ],
}
