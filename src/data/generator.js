// Track-starter generator templates.
//
// Launching with the two genres whose groove data has the richest, most
// recognisable HARMONY (deep house = 7th-chord movement, eurodance = classic
// minor pop progressions). Progressions are scale DEGREES (0-based within the
// mode), so they transpose to any key; the generator derives diatonic chord
// symbols and a matching bassline, and lays them on the genre's own rhythm.
//
// Adding a genre later = add an entry here (no code change). Adding a mood =
// tag some progressions with it.

export const GENERATOR = {
  eurodance: {
    label: 'Eurodance',
    bpm: 138,
    mode: 'minor',
    bars: 4,
    quality: 'triad',          // eurodance = bright triads
    chordTimbre: 'supersaw',
    keyRoots: ['A', 'D', 'E', 'F', 'G', 'C'],
    chordSteps: [2, 6, 10, 14],   // off-beat stabs
    bassSteps:  [0, 4, 8, 12],    // driving root/octave
    bass: 'octave',
    drums: { Kick: [0, 4, 8, 12], Clap: [4, 12], Hats: [2, 6, 10, 14] },
    moods: ['uplifting', 'driving', 'classic'],
    progressions: [
      { degrees: [0, 5, 2, 6], weight: 3, moods: ['uplifting', 'classic'] }, // i–VI–III–VII (Am–F–C–G)
      { degrees: [0, 6, 5, 6], weight: 2, moods: ['driving'] },              // i–VII–VI–VII
      { degrees: [0, 3, 4, 0], weight: 2, moods: ['classic'] },              // i–iv–v–i
      { degrees: [0, 5, 3, 4], weight: 2, moods: ['uplifting'] },            // i–VI–iv–v
    ],
  },

  'deep-house': {
    label: 'Deep House',
    bpm: 124,
    mode: 'minor',
    bars: 4,
    quality: 'seventh',        // deep house = 7th chords
    chordTimbre: 'rhodes',
    keyRoots: ['F', 'A', 'C', 'D', 'G'],
    chordSteps: [2, 6, 10, 14],   // syncopated Rhodes stabs
    bassSteps:  [2, 6, 10, 14],   // warm off-beat sub
    bass: 'offbeat-root',
    drums: { Kick: [0, 4, 8, 12], Clap: [4, 12], Hats: [2, 6, 10, 14] },
    moods: ['deep', 'warm', 'soulful'],
    progressions: [
      { degrees: [0, 6, 3, 4], weight: 3, moods: ['deep', 'warm'] },  // i7–VII7–iv7–v7
      { degrees: [0, 3, 6, 4], weight: 2, moods: ['soulful'] },       // i7–iv7–VII7–v7
      { degrees: [0, 5, 3, 4], weight: 2, moods: ['warm'] },          // i7–VI7–iv7–v7
      { degrees: [0, 4, 5, 3], weight: 1, moods: ['deep'] },          // i7–v7–VI7–iv7
    ],
  },
}
