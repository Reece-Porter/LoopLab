// Long sung-vocal phrases (Cymatics "Euphoria" pack) that play over the DROP and
// BREAKDOWN sections of a genre's arrangement instead of the per-note vocal — a
// real sung hook rather than single notes. Each phrase is pre-trimmed to a whole
// number of bars at its own BPM; the player grid-locks it by playing at
// rate = genreBPM / phrase.bpm, so it lands on the bars (pitch drifts a little
// when the BPMs differ, which is why each genre is matched to a close phrase).
//
// Genres with no good BPM+key match (schranz, drum-and-bass), or no drop/chorus
// sections to carry a big sung hook (lo-fi hip-hop), keep the per-note vocal
// everywhere and are simply absent here.

const BASE = import.meta.env.BASE_URL

// genreId → { file, bpm (of the recording), bars (length of the trimmed clip) }
export const VOCAL_PHRASES = {
  eurodance:      { file: 'remember-days',   bpm: 140, bars: 2 },
  'speed-garage': { file: 'remember-days',   bpm: 140, bars: 2 },
  'deep-house':   { file: 'remember-days',   bpm: 140, bars: 2 },
  house:          { file: 'remember-days',   bpm: 140, bars: 2 },
  'hard-groove':  { file: 'turn-up',         bpm: 130, bars: 4 },
  'tech-house':   { file: 'turn-up',         bpm: 130, bars: 4 },
  'hard-techno':  { file: 'turn-up',         bpm: 130, bars: 4 },
  'hard-house':   { file: 'i-dont-know',     bpm: 128, bars: 8 },
  techno:         { file: 'i-dont-know',     bpm: 128, bars: 8 },
  trap:           { file: 'i-dont-know',     bpm: 128, bars: 8 },
  'bouncy-techno':{ file: 'let-me-love',     bpm: 150, bars: 2 },
}

export function vocalPhraseFor(genreId) {
  const p = VOCAL_PHRASES[genreId]
  return p ? { ...p, src: `${BASE}samples/vocalphrases/${p.file}.wav` } : null
}
