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
      bpm: 124,
      key: 'D minor',
      // 9 sections: Intro, Verse 1, Pre-Ch, Chorus 1, Verse 2, Chorus 2, Bridge, Chorus 3, Outro
      tracks: [
        { name: 'Kick',       instrument: '909-style club kick',            sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Bass',       instrument: 'Octave synth bass (D)',          sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Snare/Clap', instrument: 'Gated 90s clap',                 sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Hi-Hats',    instrument: 'Off-beat open hats',             sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Lead Synth', instrument: 'Synth-brass stab (THE hook)',    sections: [1,0,1,1,0,1,0,1,1] },
        { name: 'Pad/Chord',  instrument: 'String pad (Dm–C–A#)',           sections: [1,1,1,1,1,1,1,1,1] },
        { name: 'Vocal Hook', instrument: '"What is love" vocal',           sections: [0,1,0,1,1,1,1,1,0] },
        { name: 'FX/Riser',   instrument: 'White-noise sweep',              sections: [0,0,1,0,0,1,0,0,0] },
      ],
      // The instantly-recognisable minor-key brass-stab riff:
      // D-D-D-C-A answered by A-C-D. Bass pumps D octaves.
      groove: {
        bass:  { steps: on(0,2,4,6,8,10,12,14), notes: ['D2','D3','D2','D3','D2','D3','C2','C3'] },
        pluck: { steps: on(0,2,4,7,10,12,14),   notes: ['D5','D5','D5','C5','A4','C5','D5'] },
        chord: { steps: on(0,8), chords: ['Dm','A#'], pad: true },
        vox:   { steps: on(0,6,8,12), notes: ['D5','C5','A4','C5'] },
      },
    },
    {
      title: 'Rhythm Is a Dancer',
      artist: 'Snap!',
      year: 1992,
      bpm: 124,
      key: 'G minor',
      tracks: [
        { name: 'Kick',       instrument: 'Punchy 909 kick',                sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Bass',       instrument: 'Rolling synth bass (G)',         sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Snare/Clap', instrument: 'Layered snare+clap',             sections: [0,1,1,1,1,1,0,1,0] },
        { name: 'Hi-Hats',    instrument: '16th shaker hats',               sections: [1,1,1,1,1,1,0,1,0] },
        { name: 'Lead Synth', instrument: 'Bell-pluck lead (the riff)',     sections: [1,1,0,1,1,1,0,1,1] },
        { name: 'Pad/Chord',  instrument: 'Dark string pad (Gm–D#–F)',      sections: [1,1,1,1,1,1,1,1,1] },
        { name: 'Vocal Hook', instrument: '"Rhythm is a dancer" vocal',     sections: [0,0,0,1,0,1,1,1,0] },
        { name: 'FX/Riser',   instrument: 'Reverse-crash riser',            sections: [0,0,1,0,0,1,0,0,0] },
      ],
      // The descending bell-synth motif: D-D-C-A#-A-A#-G held over Gm.
      groove: {
        bass:  { steps: on(0,2,4,6,8,10,12,14), notes: ['G1','G2','G1','G2','F1','F2','D#1','D#2'] },
        pluck: { steps: on(0,2,4,6,8,10,13),    notes: ['D5','D5','C5','A#4','A4','A#4','G4'] },
        chord: { steps: on(0,8), chords: ['Gm','D#'], pad: true },
        vox:   { steps: on(0,4,8,12), notes: ['G4','A#4','D5','A#4'] },
      },
    },
  ],

  'deep-house': [
    {
      title: 'Latch',
      artist: 'Disclosure',
      year: 2012,
      bpm: 122,
      key: 'F minor',
      // 7 sections: Intro(32), Build(16), Drop 1(32), Breakdown(16), Build 2(8), Drop 2(32), Outro(32)
      tracks: [
        { name: 'Kick',      instrument: 'Soft deep kick',                  sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',      instrument: 'Round sub bass (F)',              sections: [0,1,1,0,1,1,1] },
        { name: 'Chords',    instrument: 'Syncopated stab synth (the bounce)', sections: [0,1,1,1,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Crisp garage-y hats',             sections: [0,1,1,0,1,1,1] },
        { name: 'Vocal',     instrument: 'Sam Smith-style falsetto',        sections: [0,0,1,1,0,1,0] },
        { name: 'FX/Atmos',  instrument: 'Vinyl-air atmosphere',            sections: [1,1,0,1,1,0,1] },
      ],
      // The jerky syncopated chord-stab bounce + falsetto leap.
      groove: {
        bass:  { steps: on(0,3,6,10,14), notes: ['F1','F1','G#1','A#1','C2'] },
        chord: { steps: on(0,3,6,10,13), chords: ['Fm7','Fm7','G#maj7','A#m7','Fm7'], keys: true },
        vox:   { steps: on(0,4,8,12), notes: ['F4','G#4','C5','D#5'] },
      },
    },
    {
      title: 'Need U (100%)',
      artist: 'Duke Dumont',
      year: 2013,
      bpm: 124,
      key: 'F minor',
      tracks: [
        { name: 'Kick',      instrument: 'Warm thudding kick',              sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',      instrument: 'Wobbly garage bass',              sections: [0,1,1,0,1,1,0] },
        { name: 'Chords',    instrument: 'Organ stab chords',               sections: [0,1,1,1,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Swung open hats',                 sections: [0,1,1,0,1,1,1] },
        { name: 'Vocal',     instrument: 'Pitched diva vocal chops',        sections: [0,1,1,1,1,1,0] },
        { name: 'FX/Atmos',  instrument: 'Tape-flutter atmosphere',         sections: [1,1,0,1,1,0,1] },
      ],
      // The pitched "need u" vocal chop riff is the hook.
      groove: {
        bass:  { steps: on(2,6,10,14), notes: ['F1','G#1','A#1','C2'] },
        chord: { steps: on(2,6,10,14), chords: ['Fm7','G#maj7','A#m7','D#7'], keys: true },
        vox:   { steps: on(0,2,6,8,10,14), notes: ['F4','G#4','F4','C5','A#4','G#4'] },
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
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',        instrument: 'Tight rumble kick',             sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        instrument: 'Dry funk clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     instrument: 'Driving 16th hats',             sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',  instrument: 'Looped tribal congas',          sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',        instrument: 'Off-beat tribal bass',          sections: [0,1,1,0,1,1,0] },
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
        { name: 'Bass',        instrument: 'Pumping groove bass',           sections: [0,1,1,0,1,1,0] },
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
      bpm: 150,
      key: 'F minor',
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',        instrument: 'Pounding tidy kick',            sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',        instrument: 'Hard offset clap',              sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',     instrument: 'Relentless open hats',          sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',        instrument: 'Off-beat F bass stabs',         sections: [0,1,1,0,1,1,0] },
        { name: 'Donk',        instrument: 'Bouncing octave donk',          sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover Stab', instrument: 'THE Dawn hoover riff',          sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',       instrument: '"The dawn..." spoken vocal',    sections: [0,0,1,0,0,1,0] },
      ],
      // The climbing hoover riff: F–G#–A#–C answered back down.
      groove: {
        bass:     { steps: on(2,6,10,14), notes: ['F1','F1','G#1','A#1'] },
        donk:     { steps: on(2,4,6,8,10,12,14), notes: ['F3','F4','G#3','F3','F4','A#3','G#3'] },
        supersaw: { steps: on(0,2,4,6,8,10,12,14), notes: ['F4','F4','G#4','A#4','C5','A#4','G#4','F4'] },
        vox:      { steps: on(0,8), notes: ['F4','C5'] },
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
        { name: 'Hoover Stab', instrument: 'Screaming rave hoover',         sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',       instrument: '"Burning up" diva loop',        sections: [0,1,1,1,0,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,2,6,8,10,14), notes: ['C2','C2','G1','C2','A#1','C2'] },
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['C3','C4','C3','C4','G2','G3','A#2','A#3'] },
        supersaw: { steps: on(0,4,8,12), notes: ['C4','D#4','G4','D#4'] },
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
      key: 'C major',
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',   instrument: 'Classic 909 thump',                  sections: [0,1,1,1,1,1,0] },
        { name: 'Clap',   instrument: 'Roomy 80s clap',                     sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',instrument: 'Open disco hats',                    sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',   instrument: 'Walking piano-left-hand bass',       sections: [0,1,1,0,1,1,0] },
        { name: 'Piano',  instrument: 'THE rolling house piano (C–F–G)',    sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',  instrument: '"Move your body" chant',             sections: [0,0,1,1,0,1,0] },
      ],
      // "The House Music Anthem" — major-key rolling piano triads C–F–G.
      groove: {
        bass:  { steps: on(0,3,6,10,14), notes: ['C2','C2','G1','F1','G1'] },
        piano: { steps: on(0,2,4,6,8,10,12,14), chords: ['C','C','F','F','G','G','C','C'] },
        vox:   { steps: on(0,4,8,12), notes: ['C5','G4','E4','G4'] },
      },
    },
    {
      title: 'Ride on Time',
      artist: 'Black Box',
      year: 1989,
      bpm: 124,
      key: 'F minor',
      tracks: [
        { name: 'Kick',   instrument: 'Italo-house kick',                   sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',   instrument: 'Big gated clap',                     sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',instrument: 'Bright 8th hats',                    sections: [1,1,1,1,1,1,1] },
        { name: 'Bass',   instrument: 'Octave italo bass',                  sections: [0,1,1,0,1,1,0] },
        { name: 'Piano',  instrument: 'Stabbed italo piano (Fm)',           sections: [0,0,1,1,1,1,0] },
        { name: 'Vocal',  instrument: 'Loleatta Holloway powerhouse vocal', sections: [0,1,1,1,1,1,0] },
      ],
      groove: {
        bass:  { steps: on(0,2,4,6,8,10,12,14), notes: ['F1','F2','F1','F2','D#1','D#2','C#1','C#2'] },
        piano: { steps: on(2,6,10,14), chords: ['Fm','C#','D#','Fm'] },
        vox:   { steps: on(0,3,6,10), notes: ['C5','A#4','G#4','F4'] },
      },
    },
  ],

  'speed-garage': [
    {
      title: 'RipGroove',
      artist: 'Double 99',
      year: 1997,
      bpm: 130,
      key: 'G minor',
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',      instrument: 'Punchy garage kick',              sections: [1,1,1,1,1,1,1] },
        { name: 'Snare',     instrument: 'Cracking 2-step snare',           sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Shuffled skippy hats',            sections: [1,1,1,1,1,1,1] },
        { name: 'Reese Bass',instrument: 'THE RipGroove warping Reese',     sections: [0,1,1,1,1,1,0] },
        { name: 'Sub Bass',  instrument: 'Sliding sub layer',               sections: [0,0,1,1,1,1,0] },
        { name: 'Organ',     instrument: 'Ragga organ stab',                sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',     instrument: '"Ripgroove!" MC shout',           sections: [0,0,1,0,0,1,0] },
      ],
      // The dive-bombing Reese: G dropping then walking back up.
      groove: {
        reese: { steps: on(0,2,6,8,11,14), notes: ['G1','G1','A#1','G1','C2','D2'] },
        bass:  { steps: on(0,6,10), notes: ['G1','G1','A#1'], long: true },
        piano: { steps: on(2,5,10,13), chords: ['Gm','Gm','Cm','Dm'] },
        vox:   { steps: on(0,10), notes: ['G4','D5'] },
      },
    },
    {
      title: 'Sweet Like Chocolate',
      artist: 'Shanks & Bigfoot',
      year: 1999,
      bpm: 134,
      key: 'A minor',
      tracks: [
        { name: 'Kick',      instrument: 'Soft 2-step kick',                sections: [1,1,1,1,1,1,1] },
        { name: 'Snare',     instrument: 'Skippy UKG snare',                sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Swung garage hats',               sections: [1,1,1,1,1,1,1] },
        { name: 'Reese Bass',instrument: 'Warm bouncing sub',               sections: [0,1,1,0,1,1,0] },
        { name: 'Sub Bass',  instrument: 'Round low-end layer',             sections: [0,0,1,0,1,1,0] },
        { name: 'Organ',     instrument: 'Sweet music-box keys',            sections: [1,0,1,1,0,1,1] },
        { name: 'Vocal',     instrument: '"Sweet like chocolate boy" hook', sections: [0,0,1,1,0,1,0] },
      ],
      // The sing-song nursery hook contour: E–C–A "sweet like choc-o-late".
      groove: {
        reese: { steps: on(0,3,6,10,14), notes: ['A1','A1','C2','D2','E2'] },
        piano: { steps: on(0,4,8,12), chords: ['Am','F','C','G'] },
        vox:   { steps: on(0,2,4,7,10,12), notes: ['E5','E5','C5','A4','C5','A4'] },
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
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',      instrument: 'Hard bouncy kick',                sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',      instrument: 'Rave clap',                       sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Off-beat open hats',              sections: [1,1,1,1,1,1,1] },
        { name: 'Donk',      instrument: 'Relentless octave donk (A)',      sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab', instrument: 'Euphoric piano-rave stab',        sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',     instrument: '"Now is the time!" MC shout',     sections: [0,0,1,0,0,1,0] },
      ],
      groove: {
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','G2','G3','A2','A3'] },
        supersaw: { steps: on(0,3,6,8,11,14), notes: ['A4','C5','E5','A4','C5','G4'] },
        vox:      { steps: on(0,8), notes: ['A4','E5'] },
      },
    },
    {
      title: 'Obsession',
      artist: 'Ultra-Sonic',
      year: 1994,
      bpm: 165,
      key: 'A minor',
      tracks: [
        { name: 'Kick',      instrument: 'Pounding rave kick',              sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',      instrument: 'Snappy 909 clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',   instrument: 'Driving 8th hats',                sections: [1,1,1,1,1,1,1] },
        { name: 'Donk',      instrument: 'Bouncing bass stab',              sections: [0,1,1,0,1,1,0] },
        { name: 'Rave Stab', instrument: 'THE Obsession hoover riff',       sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',     instrument: '"Obsession" whispered vocal',     sections: [0,1,1,1,1,1,0] },
      ],
      groove: {
        donk:     { steps: on(0,2,4,6,8,10,12,14), notes: ['A2','A3','A2','A3','C3','C4','E3','E4'] },
        supersaw: { steps: on(0,2,4,6,8,10,12,14), notes: ['A4','A4','C5','A4','E5','D5','C5','B4'] },
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
      key: 'G minor',
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',       instrument: 'Fat rolling kick',               sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',       instrument: 'Dry tight clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',    instrument: 'Crisp off-beat hats',            sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', instrument: 'Clicky shaker groove',           sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',       instrument: 'THE wobbling "losing it" bass',  sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal Stab', instrument: 'Pitched siren stab',             sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',      instrument: '"I\'m losing it" vocal chop',    sections: [0,0,1,1,0,1,0] },
      ],
      // The hook is the bass itself: a nagging G wobble riff.
      groove: {
        bass:     { steps: on(0,2,3,6,8,10,11,14), notes: ['G1','G1','A#1','G1','G1','G1','F1','D1'] },
        supersaw: { steps: on(0,8), notes: ['G3','A#3'] },
        vox:      { steps: on(0,3,6,10,13), notes: ['G4','G4','A#4','G4','F4'] },
      },
    },
    {
      title: 'La La Land',
      artist: 'Green Velvet',
      year: 2001,
      bpm: 128,
      key: 'C minor',
      tracks: [
        { name: 'Kick',       instrument: 'Chicago pumping kick',           sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',       instrument: 'Sharp 909 clap',                 sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',    instrument: 'Metallic 8th hats',              sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', instrument: 'Acid perc blips',                sections: [1,1,1,0,1,1,1] },
        { name: 'Bass',       instrument: 'Driving C acid bass',            sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal Stab', instrument: 'Squelchy acid stab',             sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',      instrument: '"La la land" spoken chant',      sections: [0,1,1,1,1,1,0] },
      ],
      // The chanted "something for your mind" monotone hook.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['C2','C2','C2','D#2','C2','C2','A#1','C2'] },
        supersaw: { steps: on(2,6,10,14), notes: ['C4','C4','D#4','C4'] },
        vox:      { steps: on(0,2,4,8,10,12), notes: ['C5','C5','C5','A#4','A#4','G4'] },
      },
    },
  ],

  techno: [
    {
      title: 'The Bells',
      artist: 'Jeff Mills',
      year: 1996,
      bpm: 140,
      key: 'F minor',
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',       instrument: 'Relentless Detroit kick',        sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',    instrument: 'Machine 8th hats',               sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion', instrument: 'Ride-driven percussion',         sections: [1,1,1,0,1,1,1] },
        { name: 'Sub Bass',   instrument: 'Pumping F sub',                  sections: [0,1,1,0,1,1,0] },
        { name: 'Hypno Stab', instrument: 'THE bell-stab riff',             sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',      instrument: '(none — pure machine)',          sections: [0,0,0,0,0,0,0] },
      ],
      // The galloping ringing bell-riff: double-hit F's with G# and C accents,
      // played on an actual FM bell so it rings like the record.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['F1','F1','F1','F1','F1','F1','D#1','D#1'] },
        supersaw: {
          steps: on(0,1,3,4,6,8,9,11,12,14),
          notes: ['F4','F4','G#4','F4','C5','F4','F4','G#4','F4','D#4'],
          bell: true,
        },
      },
    },
    {
      title: 'Spastik',
      artist: 'Plastikman',
      year: 1993,
      bpm: 134,
      key: 'Percussive / atonal',
      tracks: [
        { name: 'Kick',       instrument: 'Dry minimal kick',               sections: [1,1,1,1,1,1,1] },
        { name: 'Hi-Hats',    instrument: 'Hissing 16th hats',              sections: [0,1,1,0,1,1,1] },
        { name: 'Percussion', instrument: 'THE rolling snare-drum loop',    sections: [1,1,1,1,1,1,1] },
        { name: 'Sub Bass',   instrument: 'Barely-there sub pulse',         sections: [0,1,1,0,1,1,0] },
        { name: 'Hypno Stab', instrument: '(none — drums only)',            sections: [0,0,0,0,0,0,0] },
        { name: 'Vocal',      instrument: '(none — drums only)',            sections: [0,0,0,0,0,0,0] },
      ],
      // The whole track is the accelerating snare-roll percussion workout.
      groove: {
        perc: { steps: on(0,1,3,4,6,7,8,9,11,12,14,15) },
        bass: { steps: on(0,8), notes: ['A1','A1'] },
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
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
      tracks: [
        { name: 'Kick',           instrument: 'Distorted pounding kick',    sections: [1,1,1,1,1,1,1] },
        { name: 'Clap',           instrument: 'Industrial clap',            sections: [0,1,1,0,1,1,0] },
        { name: 'Hi-Hats',        instrument: 'Sizzling open hats',         sections: [1,1,1,1,1,1,1] },
        { name: 'Percussion',     instrument: 'Metallic perc hits',         sections: [1,1,1,0,1,1,1] },
        { name: 'Distorted Bass', instrument: 'Overdriven E rumble',        sections: [0,1,1,0,1,1,0] },
        { name: 'Hoover',         instrument: 'Acid-rave lead riff',        sections: [0,1,1,1,1,1,0] },
        { name: 'Vocal',          instrument: '"Power to the raver" chant', sections: [0,0,1,1,0,1,0] },
      ],
      // Rapid acid-style riff bouncing E octaves with the chant on top.
      groove: {
        bass:     { steps: on(0,2,4,6,8,10,12,14), notes: ['E2','E2','E2','B1','E2','E2','D2','B1'] },
        supersaw: { steps: on(0,2,4,6,8,10,12,14), notes: ['E4','E5','E4','G4','E4','E5','D4','B3'] },
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
        { name: 'Hoover',         instrument: 'Dark screech stab',          sections: [0,1,1,0,1,1,0] },
        { name: 'Vocal',          instrument: 'Pitched-down dark vocal',    sections: [0,0,1,1,0,1,0] },
      ],
      groove: {
        bass:     { steps: on(0,4,8,12), notes: ['E2','E2','E2','E2'] },
        supersaw: { steps: on(0,3,8,11), notes: ['E4','G4','E4','B3'] },
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
      // 7 sections: Intro(16), Build 1(8), Drop 1(16), Break(16), Build 2(8), Drop 2(16), Outro(16)
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
