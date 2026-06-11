// Reference song arrangements for each genre.
// Each entry maps genreId → array of songs. A song's `tracks` array overrides
// the on/off pattern (sections[]) for each named track in the genre's default
// arrangement, letting the UI show how a real track was structured.

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
        { name: 'Hypno Stab', sections: [0,0,1,0,0,1,0] },
        { name: 'Vocal',      sections: [0,0,0,0,0,0,0] },
      ],
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
    },
  ],
}
